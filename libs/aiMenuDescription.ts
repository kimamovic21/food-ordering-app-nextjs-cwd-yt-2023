import OpenAI from 'openai';
import {
  AI_MENU_DESCRIPTION_MAX_CHARS,
  AI_MENU_DESCRIPTION_MODEL,
} from '@/libs/menuItemDescription';

const AI_MENU_DESCRIPTION_MAX_OUTPUT_TOKENS = 300;

const getOpenAIApiKey = () => process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY;

const cleanGeneratedDescription = (value: string) =>
  value
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, AI_MENU_DESCRIPTION_MAX_CHARS)
    .trim();

export const generateMenuItemDescription = async (menuItemName: string) => {
  const trimmedName = menuItemName.trim();

  if (!trimmedName) {
    throw new Error('Menu item name is required');
  }

  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: AI_MENU_DESCRIPTION_MODEL,
    instructions:
      'You write appetizing restaurant menu item descriptions. Keep the text polished, specific, and useful for customers. Return only the description text.',
    input: `Write one menu description for "${trimmedName}". Use 2 concise sentences. Stay under ${AI_MENU_DESCRIPTION_MAX_CHARS} characters. Do not mention prices, allergens, nutrition, availability, or unsupported ingredients.`,
    reasoning: { effort: 'minimal' },
    max_output_tokens: AI_MENU_DESCRIPTION_MAX_OUTPUT_TOKENS,
  });

  const description = cleanGeneratedDescription(response.output_text ?? '');

  if (!description) {
    throw new Error('OpenAI returned an empty description');
  }

  return description;
};
