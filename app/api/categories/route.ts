import { Category } from '@/models/category';

export async function POST(request: Request) {
  const { name } = await request.json();

  const categoryDocument = await Category.create({ name });

  return new Response(categoryDocument);
};

export async function PUT(request: Request) {
  const { _id, name } = await request.json();

  const categoryDocument = await Category.findByIdAndUpdate(
    _id,
    { name },
    { new: true }
  );

  return new Response(JSON.stringify(categoryDocument));
};

export async function GET() {
  const categories = await Category
    .find()
    .sort({ name: 1 });

  return new Response(JSON.stringify(categories));
};
