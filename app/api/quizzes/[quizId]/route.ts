import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuizModel from "@/models/quiz.model";
import CourseModel from "@/models/course.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import ModuleModel from "@/models/module.model";
import QuestionModel from "@/models/question.model";


// api for update Quiz
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ quizId: string }> }
) {
    try {
        await connectDB();

        const { quizId } = await context.params;
        if (!quizId) {
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

        const quiz = await QuizModel.findById(quizId);

        if (!quiz) {
            return NextResponse.json(
                { message: "Quiz not found" },
                { status: 404 }
            );
        }

        const course = await CourseModel.findOne({
            _id: quiz.courseId,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const updated = await QuizModel.findByIdAndUpdate(
            quizId,
            { $set: body },
            { returnDocument: "after" }
        );

        return NextResponse.json({ quiz: updated });
    } catch (error) {
        console.error("UPDATE_QUIZ_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


// api for delete Quiz
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ quizId: string }> }
) {
    try {
        await connectDB();

        const { quizId } = await context.params;
        if (!quizId) {
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


        const quiz = await QuizModel.findById(quizId);

        if (!quiz) {
            return NextResponse.json(
                { message: "Quiz not found" },
                { status: 404 }
            );
        }

        const course = await CourseModel.findOne({
            _id: quiz.courseId,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        await QuestionModel.deleteMany({ quizId });
        await QuizModel.findByIdAndDelete(quizId);

        await ModuleModel.findOneAndUpdate(
            { quizId: quizId },
            { $set: { quizId: null } }
        );

        return NextResponse.json({
            message: "Quiz deleted",
        });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
