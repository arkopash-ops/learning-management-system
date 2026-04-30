import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuizModel from "@/models/quiz.model";
import QuestionModel from "@/models/question.model";
import QuizAttemptModel from "@/models/quizAttempt.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import ModuleModel from "@/models/module.model";
import EnrollmentModel from "@/models/enrollment.model";
import { updateCourseProgress } from "@/lib/updateCourseProgress";


// api for submit Quiz and show 
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

        if (decoded.role !== UserRole.LEARNER) {
            return NextResponse.json(
                { message: "Only learners can attempt quiz" },
                { status: 403 }
            );
        }

        const { answers } = await req.json();

        if (!Array.isArray(answers) || answers.length === 0) {
            return NextResponse.json(
                { message: "Answers required" },
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

        const questions = await QuestionModel.find({
            quizId: quizId,
        }).select("+correctOptionId");

        const questionMap = new Map(
            questions.map((q) => [q._id.toString(), q])
        );

        let correctCount = 0;

        for (const ans of answers) {
            const q = questionMap.get(ans.questionId);

            if (!q) continue;

            if (q.correctOptionId === ans.selectedOptionId) {
                correctCount++;
            }
        }

        const totalQuestions = questions.length;

        const score = (correctCount / totalQuestions) * 100;

        const passed = score >= quiz.passPercentage;

        const prevAttempts = await QuizAttemptModel.countDocuments({
            quizId: quizId,
            learnerId: decoded.userId,
        });

        const attemptNumber = prevAttempts + 1;

        await QuizAttemptModel.create({
            quizId: quizId,
            learnerId: decoded.userId,
            courseId: quiz.courseId,
            answers,
            score,
            passed,
            attemptNumber,
        });

        if (passed) {
            const myModule = await ModuleModel.findOne({ quizId: quizId });

            if (myModule) {
                const enrollment = await EnrollmentModel.findOne({
                    learnerId: decoded.userId,
                    courseId: quiz.courseId,
                });

                if (enrollment) {
                    if (!enrollment.completedModules.includes(myModule._id)) {
                        enrollment.completedModules.push(myModule._id);
                    }

                    const nextModule = await ModuleModel.findOne({
                        courseId: myModule.courseId,
                        order: myModule.order + 1,
                    });

                    if (
                        nextModule &&
                        !enrollment.unlockedModules.includes(nextModule._id)
                    ) {
                        enrollment.unlockedModules.push(nextModule._id);
                    }

                    await enrollment.save();

                    await updateCourseProgress(
                        decoded.userId,
                        quiz.courseId.toString()
                    );
                }
            }
        }

        return NextResponse.json({
            message: "Quiz submitted",
            result: {
                score,
                passed,
                totalQuestions,
                correctAnswers: correctCount,
                attemptNumber,
            },
        });
    } catch (error) {
        console.error("QUIZ_SUBMIT_ERROR", error);

        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
