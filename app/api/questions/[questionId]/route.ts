import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuestionModel from "@/models/question.model";
import QuizModel from "@/models/quiz.model";
import CourseModel from "@/models/course.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


// api for update Quiz Questions
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ questionId: string }> }
) {
    try {
        await connectDB();

        const { questionId } = await context.params;
        if (!questionId) {
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

        const question = await QuestionModel.findById(questionId);

        if (!question) {
            return NextResponse.json(
                { message: "Question not found" },
                { status: 404 }
            );
        }

        const quiz = await QuizModel.findById(question.quizId);

        const course = await CourseModel.findOne({
            _id: quiz?.courseId,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const updated = await QuestionModel.findByIdAndUpdate(
            questionId,
            { $set: body },
            { returnDocument: "after" }
        );

        return NextResponse.json({ question: updated });
    } catch (error) {
        console.error("UPDATE_QUESTIONS_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


// api for delete Quiz Questions
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ questionId: string }> }
) {
    try {
        await connectDB();

        const { questionId } = await context.params;
        if (!questionId) {
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

        const question = await QuestionModel.findById(questionId);

        if (!question) {
            return NextResponse.json(
                { message: "Question not found" },
                { status: 404 }
            );
        }

        const quiz = await QuizModel.findById(question.quizId);

        const course = await CourseModel.findOne({
            _id: quiz?.courseId,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        await QuestionModel.findByIdAndDelete(questionId);

        return NextResponse.json({
            message: "Question deleted",
        });
    } catch (error) {
        console.error("DELETE_QUESTIONS_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
