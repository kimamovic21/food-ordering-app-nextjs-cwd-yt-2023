import OpenAI from 'openai';
import { generateMenuItemDescription } from '@/libs/aiMenuDescription';
import {
  AI_MENU_DESCRIPTION_MAX_CHARS,
  AI_MENU_DESCRIPTION_MODEL,
} from '@/libs/menuItemDescription';

const { responsesCreate } = vi.hoisted(() => ({
  responsesCreate: vi.fn(),
}));

vi.mock('openai', () => ({
  default: vi.fn(function () {
    return {
      responses: {
        create: responsesCreate,
      },
    };
  }),
}));

describe('generateMenuItemDescription', () => {
  const previousOpenAiKey = process.env.OPEN_AI_API_KEY;
  const previousOfficialOpenAiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPEN_AI_API_KEY = 'test-openai-key';
    delete process.env.OPENAI_API_KEY;
  });

  afterAll(() => {
    process.env.OPEN_AI_API_KEY = previousOpenAiKey;
    process.env.OPENAI_API_KEY = previousOfficialOpenAiKey;
  });

  it('uses the low-cost model with a tight output cap', async () => {
    responsesCreate.mockResolvedValueOnce({
      output_text: 'A bright Margherita pizza with tomato, mozzarella, and fresh basil.',
    });

    const description = await generateMenuItemDescription('Pizza Margherita');

    expect(description).toBe('A bright Margherita pizza with tomato, mozzarella, and fresh basil.');
    expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-openai-key' });
    expect(responsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: AI_MENU_DESCRIPTION_MODEL,
        reasoning: { effort: 'minimal' },
        max_output_tokens: 300,
        input: expect.stringContaining('Pizza Margherita'),
      })
    );
  });

  it('trims generated text to the menu description character limit', async () => {
    responsesCreate.mockResolvedValueOnce({
      output_text: ` ${'Fresh mozzarella, basil, and tomato. '.repeat(40)} `,
    });

    const description = await generateMenuItemDescription('Pizza Margherita');

    expect(description.length).toBeLessThanOrEqual(AI_MENU_DESCRIPTION_MAX_CHARS);
    expect(description).toBe(description.trim());
  });

  it('fails before calling OpenAI when the key is missing', async () => {
    delete process.env.OPEN_AI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    await expect(generateMenuItemDescription('Pizza Margherita')).rejects.toThrow(
      'OpenAI API key is not configured'
    );
    expect(responsesCreate).not.toHaveBeenCalled();
  });
});
