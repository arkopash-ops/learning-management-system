import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LessonModel from "@/models/lesson.model";
import LessonProgressModel from "@/models/lessonProgress.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import EnrollmentModel from "@/models/enrollment.model";
import { Types } from "mongoose";
import ModuleModel from "@/models/module.model";
import { updateCourseProgress } from "@/lib/updateCourseProgress";


// api for Lesson Progress
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ lessonId: string }> }
) {
    try {
        await connectDB();

        const { lessonId } = await context.params;
        if (!lessonId) {
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

        const { watchedSeconds, currentPosition } = await req.json();

        if (watchedSeconds === undefined || currentPosition === undefined) {
            return NextResponse.json(
                { message: "Invalid payload" },
                { status: 400 }
            );
        }

        const lesson = await LessonModel.findById(lessonId);

        if (!lesson) {
            return NextResponse.json(
                { message: "Lesson not found" },
                { status: 404 }
            );
        }

        const progress = await LessonProgressModel.findOneAndUpdate(
            {
                learnerId: decoded.userId,
                lessonId: lessonId,
            },
            {
                $max: { videoWatchedInSeconds: watchedSeconds },   // prevents rewind
                $set: {
                    lastPositionSec: currentPosition,
                    lastWatchedAt: new Date(),
                },
                $setOnInsert: {
                    courseId: lesson.courseId,
                    moduleId: lesson.moduleId,
                },
            },
            { new: true, upsert: true }
        );

        // 90% completion
        const completionThreshold = lesson.videoDurationSec * 0.9;

        if (!progress.isCompleted && watchedSeconds >= completionThreshold) {
            progress.isCompleted = true;
            progress.completedAt = new Date();
            await progress.save();

            const totalLessons = await LessonModel.countDocuments({
                moduleId: lesson.moduleId,
            });

            const completedLessons = await LessonProgressModel.countDocuments({
                moduleId: lesson.moduleId,
                learnerId: decoded.userId,
                isCompleted: true,
            });

            if (totalLessons > 0 && totalLessons === completedLessons) {
                const enrollment = await EnrollmentModel.findOne({
                    learnerId: decoded.userId,
                    courseId: lesson.courseId,
                });

                if (enrollment) {
                    const moduleIdStr = lesson.moduleId.toString();

                    // addnig to completeModules
                    if (!enrollment.completedModules.some(
                        (id: Types.ObjectId) => id.toString() === moduleIdStr
                    )) {
                        enrollment.completedModules.push(lesson.moduleId);
                    }

                    // unlocking next module
                    const currentModule = await ModuleModel.findById(lesson.moduleId);

                    const nextModule = await ModuleModel.findOne({
                        courseId: lesson.courseId,
                        order: (currentModule?.order || 0) + 1,
                    });

                    if (nextModule && !enrollment.unlockedModules.some(
                        (id: Types.ObjectId) => id.toString() === nextModule._id.toString()
                    )
                    ) {
                        enrollment.unlockedModules.push(nextModule._id);
                    }

                    await enrollment.save();

                    await updateCourseProgress(
                        decoded.userId,
                        lesson.courseId.toString()
                    );
                }
            }
        }

        return NextResponse.json({
            message: "Progress saved",
            progress,
        });
    } catch (error) {
        console.error("PROGRESS_ERROR", error);

        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}


// api fro get lesson progress to resume video
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ lessonId: string }> }
) {
    try {
        await connectDB();

        const { lessonId } = await context.params;
        if (!lessonId) {
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

        const progress = await LessonProgressModel.findOne({
            learnerId: decoded.userId,
            lessonId: lessonId,
        });

        return NextResponse.json({
            progress,
        });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
