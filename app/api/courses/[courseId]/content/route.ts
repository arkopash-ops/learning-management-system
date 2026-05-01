import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import LessonModel from "@/models/lesson.model";
import LessonProgressModel from "@/models/lessonProgress.model";
import ModuleModel from "@/models/module.model";
import "@/models/user.model";

export async function GET(
  _req: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    await connectDB();

    const { courseId } = await context.params;

    if (!courseId) {
      return NextResponse.json(
        { message: "Course ID is required" },
        { status: 400 },
      );
    }

    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const course = await CourseModel.findOne({
      _id: courseId,
      isPublished: true,
    }).select("_id title");

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 },
      );
    }

    const enrollment = await EnrollmentModel.findOne({
      learnerId: decoded.userId,
      courseId,
    }).lean();

    if (!enrollment) {
      return NextResponse.json(
        { message: "Not enrolled in this course" },
        { status: 403 },
      );
    }

    const modules = await ModuleModel.find({ courseId })
      .sort({ order: 1 })
      .lean();

    const moduleIds = modules.map((moduleItem) => moduleItem._id);

    const lessons = await LessonModel.find({
      moduleId: { $in: moduleIds },
    })
      .select(
        "courseId moduleId title description order videoUrl videoDurationSec readingContent resources isPreview",
      )
      .sort({ order: 1 })
      .lean();

    const progress = await LessonProgressModel.find({
      learnerId: decoded.userId,
      courseId,
    })
      .select(
        "lessonId videoWatchedInSeconds lastPositionSec lastWatchedAt isCompleted completedAt",
      )
      .lean();

    const progressByLessonId = new Map(
      progress.map((item) => [String(item.lessonId), item]),
    );

    const modulesWithLessons = modules.map((moduleItem) => {
      const moduleLessons = lessons
        .filter((lesson) => String(lesson.moduleId) === String(moduleItem._id))
        .map((lesson) => ({
          ...lesson,
          progress: progressByLessonId.get(String(lesson._id)) ?? null,
        }));

      return {
        _id: moduleItem._id,
        title: moduleItem.title,
        description: moduleItem.description,
        order: moduleItem.order,
        totalLessons: moduleItem.totalLessons,
        lessons: moduleLessons,
      };
    });

    return NextResponse.json({
      enrollment,
      modules: modulesWithLessons,
    });
  } catch (error) {
    console.error("GET_COURSE_CONTENT_ERROR", error);

    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 },
    );
  }
}
