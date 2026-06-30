import { isAdmin } from '@/app/api/auth/[...nextauth]/route';
import { generateMenuItemDescription } from '@/libs/aiMenuDescription';
import {
  AI_MENU_DESCRIPTION_MAX_CHARS,
  AI_MENU_DESCRIPTION_MODEL,
} from '@/libs/menuItemDescription';
import {
  createRateLimitKey,
  createRateLimitResponse,
  enforceRateLimit,
  getClientIp,
} from '@/libs/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await enforceRateLimit({
      identifier: createRateLimitKey('ai-menu-item-description', getClientIp(req)),
      limit: 12,
      namespace: 'ai-menu-item-description',
      window: '1 h',
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(
        rateLimit,
        'Too many AI description requests. Please try again later.'
      );
    }

    const data = await req.json();
    const name = typeof data.name === 'string' ? data.name.trim() : '';

    if (!name) {
      return Response.json({ error: 'Menu item name is required' }, { status: 400 });
    }

    if (name.length > 120) {
      return Response.json({ error: 'Menu item name is too long' }, { status: 400 });
    }

    const description = await generateMenuItemDescription(name);

    return Response.json({
      description,
      maxCharacters: AI_MENU_DESCRIPTION_MAX_CHARS,
      model: AI_MENU_DESCRIPTION_MODEL,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate description';

    if (message === 'OpenAI API key is not configured') {
      return Response.json({ error: message }, { status: 500 });
    }

    console.error('Error generating menu item description:', error);
    return Response.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
