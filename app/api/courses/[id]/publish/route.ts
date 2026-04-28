import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CourseModel from "@/models/course.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


// api for publish and unpublish Course
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await context.params;
        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID is required" },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);

        const { isPublished } = await req.json();

        const course = await CourseModel.findOneAndUpdate(
            {
                _id: id,
                instructorId: decoded.userId,
            },
            { isPublished },
            { returnDocument: "after" }
        );

        if (!course) {
            return NextResponse.json(
                { message: "Not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ course });
    } catch (error) {
        console.error("PUBLISH_COURSE_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
