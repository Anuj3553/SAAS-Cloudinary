import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client'

// import { auth } from '@clerk/nextjs/server'

const prisma = new PrismaClient()

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
    duration?: number;
    width: number;
    height: number;
    created_at: string;
    resource_type: string;
    tags: string[];
    [key: string]: string | number | string[];
}

export async function POST(request: NextRequest) {
    // TODO - To check user
    try {
        // const { userId } = auth()

        // if (!userId) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        if (
            !process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json({ error: 'Cloudinary credentials not found' }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const originalSize = formData.get('originalSize') as string


        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'video',
                        folder: "video-uploads",
                        transformation: [
                            { quality: "auto", fetch_format: "mp4" },
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer);
            })

        const video = await prisma.video.create({
            data: {
                publicId: result.public_id,
                title,
                description,
                originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0,
            }
        })

        return NextResponse.json({ video }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error uploading video' }, { status: 500 });
    } finally {
        await prisma.$disconnect()
    }
}