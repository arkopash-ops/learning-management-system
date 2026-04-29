import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { UploadApiResponse } from "cloudinary";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "File required" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result: UploadApiResponse = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: "lms",
                },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error("Upload failed: No result"));

                    resolve(result);
                }
            );

            stream.end(buffer);
        });

        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id,
            duration: result.duration || null,
        });
    } catch (error) {
        console.error("UPLOAD_ERROR:", error);
        return NextResponse.json(
            { message: "Upload failed", error: String(error) },
            { status: 500 }
        );
    }
}