import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LessonModel from "@/models/lesson.model";
import ModuleModel from "@/models/module.model";
import CourseModel from "@/models/course.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


//api for get Lessons by Module
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ moduleId: string }> }
) {
    try {
        await connectDB();

        const { moduleId } = await context.params;
        if (!moduleId) {
            return NextResponse.json(
                { success: false, message: "ID is required" },
                { status: 400 }
            );
        }

        const lessons = await LessonModel.find({
            moduleId: moduleId,
        }).sort({ order: 1 });

        return NextResponse.json({ lessons });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}


// api for create Lesson
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ moduleId: string }> }
) {
    try {
        await connectDB();

        const { moduleId } = await context.params;
        if (!moduleId) {
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

        if (decoded.role !== UserRole.INSTRUCTOR) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();

        const myModule = await ModuleModel.findById(moduleId);

        if (!myModule) {
            return NextResponse.json(
                { message: "Module not found" },
                { status: 404 }
            );
        }

        const course = await CourseModel.findOne({
            _id: myModule.courseId,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const lesson = await LessonModel.create({
            ...body,
            moduleId: moduleId,
            courseId: myModule.courseId,
        });

        await ModuleModel.findByIdAndUpdate(moduleId, {
            $inc: { totalLessons: 1 },
        });

        await CourseModel.findByIdAndUpdate(myModule.courseId, {
            $inc: { totalLessons: 1 },
        });

        return NextResponse.json({ lesson }, { status: 201 });
    } catch (error) {
        console.error("CREATE_LESSON_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
