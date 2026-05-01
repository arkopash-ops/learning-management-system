import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuestionModel from "@/models/question.model";
import QuizModel from "@/models/quiz.model";
import CourseModel from "@/models/course.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


// api for get Quiz Question by Quiz
export async function GET(
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
        let shouldShowCorrectOption = false;

        if (token) {
            try {
                const decoded = verifyToken(token);

                if (decoded.role === UserRole.INSTRUCTOR) {
                    const quiz = await QuizModel.findById(quizId);

                    if (quiz) {
                        const course = await CourseModel.findOne({
                            _id: quiz.courseId,
                            instructorId: decoded.userId,
                        });

                        shouldShowCorrectOption = Boolean(course);
                    }
                }
            } catch {
                shouldShowCorrectOption = false;
            }
        }

        const questions = await QuestionModel.find({
            quizId: quizId,
        }).select(shouldShowCorrectOption ? "+correctOptionId" : "-correctOptionId");

        return NextResponse.json({ questions });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}


// api for create Quiz Question
export async function POST(
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

        if (decoded.role !== UserRole.INSTRUCTOR) {
            return NextResponse.json(
                { message: "Only instructors allowed" },
                { status: 403 }
            );
        }

        const { questionText, options, correctOptionId } = await req.json();

        if (!questionText || !Array.isArray(options) || options.length < 2) {
            return NextResponse.json(
                { message: "Invalid question or options" },
                { status: 400 }
            );
        }

        const optionIds = options.map((o) => o.optionId);

        if (!optionIds.includes(correctOptionId)) {
            return NextResponse.json(
                { message: "Correct option must match one of the options" },
                { status: 400 }
            );
        }

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

        const question = await QuestionModel.create({
            quizId: quizId,
            questionText,
            options,
            correctOptionId,
        });

        return NextResponse.json(
            { message: "Question created", question },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE_QUESTIONS_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
