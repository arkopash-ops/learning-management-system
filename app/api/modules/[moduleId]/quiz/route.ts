import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuizModel from "@/models/quiz.model";
import ModuleModel from "@/models/module.model";
import CourseModel from "@/models/course.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


// api for get Quiz by Module
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

        const quiz = await QuizModel.findOne({
            moduleId: moduleId,
        });

        if (!quiz) {
            return NextResponse.json(
                { message: "Quiz not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ quiz });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}


// api for create Quiz
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
            return NextResponse.json(
                { message: "Only instructors allowed" },
                { status: 403 }
            );
        }

        const { title, passPercentage, timeLimitSec } = await req.json();

        if (!title || passPercentage === undefined || timeLimitSec === undefined) {
            return NextResponse.json(
                { message: "All fields required" },
                { status: 400 }
            );
        }

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

        const existingQuiz = await QuizModel.findOne({
            moduleId: moduleId,
        });

        if (existingQuiz) {
            return NextResponse.json(
                { message: "Quiz already exists for this module" },
                { status: 400 }
            );
        }

        const quiz = await QuizModel.create({
            moduleId: moduleId,
            courseId: myModule.courseId,
            title,
            passPercentage,
            timeLimitSec,
        });

        await ModuleModel.findByIdAndUpdate(moduleId, {
            quizId: quiz._id,
        });

        return NextResponse.json(
            { message: "Quiz created", quiz },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE_QUIZ_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
