import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CourseModel from "@/models/course.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


// api for get Course by Id
export async function GET(
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

        const course = await CourseModel.findOne({
            _id: id,
            isPublished: true,
        }).populate("instructorId", "name");

        if (!course) {
            return NextResponse.json(
                { message: "Course not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ course });
    } catch (error) {
        console.error("GET_COURSE_BY_ID_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


// api for Update Course
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

        const body = await req.json();

        const course = await CourseModel.findOneAndUpdate(
            {
                _id: id,
                instructorId: decoded.userId,
            },
            { $set: body },
            { returnDocument: "after" }
        );

        if (!course) {
            return NextResponse.json(
                { message: "Course not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ course });
    } catch (error) {
        console.error("UPDATE_COURSE_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


// api for Delete Course
export async function DELETE(
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

        const course = await CourseModel.findOneAndDelete({
            _id: id,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Course not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Course deleted" });
    } catch (error) {
        console.error("DELETE_COURSE_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
