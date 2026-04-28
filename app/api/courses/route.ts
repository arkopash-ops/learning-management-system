import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CourseModel from "@/models/course.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();

        const courses = await CourseModel.find({
            isPublished: true,
        }).populate("instructorId", "name");

        return NextResponse.json({ courses });
    } catch (error) {
        console.error("GET_COURSE_PUBLIC_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


export async function POST(req: NextRequest) {
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
                { message: "Only instructors can create courses" },
                { status: 403 }
            );
        }

        const { title, description, tags } = await req.json();

        if (!title) {
            return NextResponse.json(
                { message: "Title is required" },
                { status: 400 }
            );
        }

        const course = await CourseModel.create({
            title,
            description,
            tags,
            instructorId: decoded.userId,
        });

        return NextResponse.json(
            { message: "Course created", course },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE_COURSE_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
