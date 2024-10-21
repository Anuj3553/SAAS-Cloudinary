import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

// Interface for the Cloudinary upload result
interface CloudinaryUploadResult {
    public_id: string;
    [key: string]: any
}

export async function POST(request: NextRequest) {
    const { userId } = auth()

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Parse the incoming form data
        const formData = await request.formData();
        // Get the file from the form data
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 400 })
        }

        // Convert the file to a buffer
        const bytes = await file.arrayBuffer()
        // Create a buffer from the bytes
        const buffer = Buffer.from(bytes)

        // Upload the image to Cloudinary
        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                // Create a stream to upload the image
                const uploadStream = cloudinary.uploader.upload_stream(
                    // Upload options
                    { folder: "next-cloudinary-uploads" },
                    (error, result) => {
                        // Handle the response
                        if (error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                )
                // Write the buffer to the stream
                uploadStream.end(buffer)
            }
        )
        // Return the public ID of the uploaded image
        return NextResponse.json({ publicId: result.public_id }, { status: 200 }
        )
    } catch (error) {
        console.log("UPload image failed", error)
        return NextResponse.json({ error: "Upload image failed" }, { status: 500 })
    }
}
