import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import CourseModel from "@/models/course.model";
import { UserRole } from "@/shared/enum/UserRole.enum";

// api for fetching all courses owned by the logged-in instructor
export async function GET() {
    try {
        await connectDB();

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);

        if (decoded.role !== UserRole.INSTRUCTOR) {
            return NextResponse.json(
                { message: "Only instructors can view their courses" },
                { status: 403 }
            );
        }

        const courses = await CourseModel.find({
            instructorId: decoded.userId,
        }).sort({ createdAt: -1 });

        return NextResponse.json({ courses });
    } catch (error) {
        console.error("GET_MY_COURSES_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
