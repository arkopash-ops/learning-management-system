import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LessonModel from "@/models/lesson.model";
import CourseModel from "@/models/course.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import ModuleModel from "@/models/module.model";


// api for update Lesson
export async function PATCH(
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
        const body = await req.json();

        const lesson = await LessonModel.findById(lessonId);
        if (!lesson) {
            return NextResponse.json(
                { message: "Not found" },
                { status: 404 }
            );
        }

        const course = await CourseModel.findOne({
            _id: lesson.courseId,
            instructorId: decoded.userId,
        });
        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const updated = await LessonModel.findByIdAndUpdate(
            lessonId,
            { $set: body },
            { returnDocument: "after" }
        );

        return NextResponse.json({ lesson: updated });
    } catch (error) {
        console.error("UPDATE_LESSON_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


// api for delete Lesson
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ lessonId: string }> }
) {
    try {
        await connectDB();

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

        const lesson = await LessonModel.findById(lessonId);
        if (!lesson) {
            return NextResponse.json(
                { message: "Not found" },
                { status: 404 }
            );
        }

        const course = await CourseModel.findOne({
            _id: lesson.courseId,
            instructorId: decoded.userId,
        });
        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        if (lesson.videoPublicId) {
            await cloudinary.uploader.destroy(lesson.videoPublicId, {
                resource_type: "video",
            });
        }

        for (const res of lesson.resources || []) {
            if (res.publicId) {
                await cloudinary.uploader.destroy(res.publicId, {
                    resource_type: "raw",
                });
            }
        }

        await LessonModel.findByIdAndDelete(lessonId);

        await ModuleModel.findByIdAndUpdate(lesson.moduleId, {
            $inc: { totalLessons: -1 },
        });

        await CourseModel.findByIdAndUpdate(lesson.courseId, {
            $inc: { totalLessons: -1 },
        });

        return NextResponse.json({ message: "Lesson deleted" });
    } catch (error) {
        console.error("DELETE_LESSON_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
