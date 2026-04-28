import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CourseModel from "@/models/course.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";


// api for fetching my Courses
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
                { message: "Forbidden: Only instructors allowed" },
                { status: 403 }
            );
        }

        const courses = await CourseModel.find({
            instructorId: decoded.userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            count: courses.length,
            courses,
        });
    } catch (error) {
        console.error("GET_MY_COURSES_ERROR", error);

        return NextResponse.json(
            { message: "Unauthorized or server error" },
            { status: 401 }
        );
    }
}