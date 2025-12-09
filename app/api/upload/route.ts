import { getServerSession } from 'next-auth';
import { type UploadApiResponse } from 'cloudinary';
import { authOptions } from '@/libs/authOptions';
import { User } from '@/models/user';
import cloudinary from '@/libs/cloudinary';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return new Response('Unauthorized', { status: 401 });
    };

    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return new Response('No file provided', { status: 400 });
    };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadedImage: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'users' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadApiResponse);
        }
      );
      uploadStream.end(buffer);
    });

    const user = await User.findOne({ email });

    if (!user) {
      return new Response('User not found', { status: 404 });
    };

    if (user.image) {
      const matches = user.image.match(/users\/([^\.]+)/);
      const oldPublicId = matches ? `users/${matches[1]}` : null;

      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      };
    };

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { image: uploadedImage.secure_url },
      { new: true }
    );

    return Response.json({
      success: true,
      url: uploadedImage.secure_url,
      user: updatedUser,
    });

  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    return new Response('Upload error', { status: 500 });
  };
};
