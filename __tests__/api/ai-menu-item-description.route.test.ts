import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import { generateMenuItemDescription } from '@/libs/aiMenuDescription';
import {
  AI_MENU_DESCRIPTION_MAX_CHARS,
  AI_MENU_DESCRIPTION_MODEL,
} from '@/libs/menuItemDescription';

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/libs/aiMenuDescription', () => ({
  generateMenuItemDescription: vi.fn(),
}));

const loadRoute = async () => import('@/app/api/ai/menu-item-description/route');

const createRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/ai/menu-item-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/ai/menu-item-description route', () => {
  beforeEach(() => {
    vi.mocked(isAdmin).mockResolvedValue(true as never);
  });

  it('requires an admin session', async () => {
    vi.mocked(isAdmin).mockResolvedValueOnce(false as never);

    const { POST } = await loadRoute();
    const res = await POST(createRequest({ name: 'Pizza Margherita' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(generateMenuItemDescription).not.toHaveBeenCalled();
  });

  it('requires a menu item name', async () => {
    const { POST } = await loadRoute();
    const res = await POST(createRequest({ name: '   ' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'Menu item name is required' });
    expect(generateMenuItemDescription).not.toHaveBeenCalled();
  });

  it('returns generated description metadata', async () => {
    vi.mocked(generateMenuItemDescription).mockResolvedValueOnce(
      'A classic pizza with bright tomato sauce, creamy mozzarella, and fragrant basil.' as never
    );

    const { POST } = await loadRoute();
    const res = await POST(createRequest({ name: ' Pizza Margherita ' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      description:
        'A classic pizza with bright tomato sauce, creamy mozzarella, and fragrant basil.',
      maxCharacters: AI_MENU_DESCRIPTION_MAX_CHARS,
      model: AI_MENU_DESCRIPTION_MODEL,
    });
    expect(generateMenuItemDescription).toHaveBeenCalledWith('Pizza Margherita');
  });
});
