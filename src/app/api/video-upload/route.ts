import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
// import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient()

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

// Interface for the Cloudinary upload result
interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number
    [key: string]: any
}

export async function POST(request: NextRequest) {
    try {
        //TODO: To check user

        if (
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json({ error: "Cloudinary credentials not found" }, { status: 500 })
        }

        // Parse the incoming form data
        const formData = await request.formData();
        // Get the file from the form data
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 400 })
        }

        // Convert the file to a buffer
        const bytes = await file.arrayBuffer()
        // Create a buffer from the bytes
        const buffer = Buffer.from(bytes)

        // Upload the image to Cloud
        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                // Create a stream to upload the video
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        // Upload options
                        resource_type: "video",
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
                // Write the buffer to the stream
                uploadStream.end(buffer)
            }
        )
        // Save the video to the database
        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0,
            }
        })
        // Return the video
        return NextResponse.json(video)
    } catch (error) {
        console.log("UPload video failed", error)
        return NextResponse.json({ error: "UPload video failed" }, { status: 500 })
    } finally {
        // Disconnect the Prisma client
        await prisma.$disconnect()
    }
}
