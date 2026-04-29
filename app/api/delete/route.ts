import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        const { publicId, resourceType } = await req.json();

        if (!publicId) {
            return NextResponse.json(
                { message: "publicId required" },
                { status: 400 }
            );
        }

        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType || "auto",
        });

        return NextResponse.json({ message: "Deleted successfully" });
    } catch {
        return NextResponse.json({ message: "Delete failed" }, { status: 500 });
    }
}
