import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

import { auth } from '@clerk/nextjs/server'


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

interface CloudinaryUploadResult {
    public_id: string;
    url: string;
    secure_url: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
    created_at: string;
    resource_type: string;
    tags: string[];
    [key: string]: string | number | string[];
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const result = await new Promise<CloudinaryUploadResult>(
                (resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: "nextjs-cloudinary-uploads" },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result as CloudinaryUploadResult);
                        }
                    )
                    uploadStream.end(buffer);
                })

            return NextResponse.json({ publicId: result.public_id }, { status: 200 });
        } catch (error) {
            console.error(error);
            return NextResponse.json({ error: 'Error uploading image' }, { status: 500 });
        }
    } catch (error) {
        console.log("Upload Image Failed", error);
        return NextResponse.json({ error: 'Error uploading image' }, { status: 500 });
    }
}