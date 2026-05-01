import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CourseModel from "@/models/course.model";
import ModuleModel from "@/models/module.model";
import LessonModel from "@/models/lesson.model";
import InstructorModel from "@/models/instructor.model";
import "@/models/user.model";

// Public API: get full course overview (course + instructor profile + modules + lessons)
export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ courseId: string }> }
) {
    try {
        await connectDB();

        const { courseId } = await context.params;

        if (!courseId) {
            return NextResponse.json(
                { message: "Course ID is required" },
                { status: 400 }
            );
        }

        const course = await CourseModel.findOne({
            _id: courseId,
            isPublished: true,
        }).populate("instructorId", "name email");

        if (!course) {
            return NextResponse.json(
                { message: "Course not found" },
                { status: 404 }
            );
        }

        const instructorUserId = (course.instructorId as { _id: unknown })._id;

        const instructorProfile = await InstructorModel.findOne({
            userId: instructorUserId,
        }).lean();

        const modules = await ModuleModel.find({ courseId })
            .sort({ order: 1 })
            .lean();

        const moduleIds = modules.map((m) => m._id);

        const allLessons = await LessonModel.find({
            moduleId: { $in: moduleIds },
        })
            .select("title description moduleId order")
            .sort({ order: 1 })
            .lean();

        const modulesWithLessons = modules.map((mod) => ({
            _id: mod._id,
            title: mod.title,
            description: mod.description,
            order: mod.order,
            totalLessons: mod.totalLessons,
            lessons: allLessons.filter(
                (l) => String(l.moduleId) === String(mod._id)
            ),
        }));

        return NextResponse.json({
            course,
            instructorProfile: instructorProfile ?? null,
            modules: modulesWithLessons,
        });
    } catch (error) {
        console.error("GET_COURSE_OVERVIEW_ERROR", error);
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
