import { getServerSession } from 'next-auth/next';
import { type UploadApiResponse } from 'cloudinary';
import { authOptions } from '@/libs/authOptions';
import { Restaurant } from '@/models/restaurant';
import { User } from '@/models/user';
import cloudinary from '@/libs/cloudinary';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Only admins can upload restaurant images' }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadedImage: UploadApiResponse = await new Promise((resolve, reject) => {
      const folder =
        process.env.NODE_ENV === 'production' ? 'restaurants-production' : 'restaurants';
      const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      });
      uploadStream.end(buffer);
    });

    // Try to find existing restaurant, but don't fail if it doesn't exist yet (new restaurant case)
    const restaurant = await Restaurant.findOne({ ownerId: user._id });

    if (restaurant) {
      // For existing restaurants, just return the URL without updating the database
      // The form will handle adding it to the images array
      return Response.json({
        success: true,
        url: uploadedImage.secure_url,
      });
    }

    // For new restaurants, just return the URL without updating the database yet
    return Response.json({
      success: true,
      url: uploadedImage.secure_url,
    });
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    return Response.json({ error: 'Upload error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Only admins can delete restaurant images' }, { status: 403 });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: 'No image URL provided' }, { status: 400 });
    }

    // Delete from Cloudinary
    if (imageUrl && imageUrl.trim() !== '') {
      const matches = imageUrl.match(/restaurants(?:-production)?\/([^\.]+)/);
      const folder =
        process.env.NODE_ENV === 'production' ? 'restaurants-production' : 'restaurants';
      const publicId = matches ? `${folder}/${matches[1]}` : null;

      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
    }

    return Response.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (err) {
    console.error('DELETE ERROR:', err);
    return Response.json({ error: 'Delete error' }, { status: 500 });
  }
}
