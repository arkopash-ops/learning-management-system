import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EnrollmentModel from "@/models/enrollment.model";
import CourseModel from "@/models/course.model";
import ModuleModel from "@/models/module.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


// api for Enrollment into Course
export async function POST(
    req: Request,
    context: { params: Promise<{ courseId: string }> }
) {
    try {
        await connectDB();

        const { courseId } = await context.params;
        if (!courseId) {
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
                { message: "Only learners can enroll" },
                { status: 403 }
            );
        }

        const course = await CourseModel.findOne({
            _id: courseId,
            isPublished: true,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Course not available" },
                { status: 404 }
            );
        }

        const isEnrolled = await EnrollmentModel.findOne({
            learnerId: decoded.userId,
            courseId: courseId,
        });

        if (isEnrolled) {
            return NextResponse.json(
                { message: "Already enrolled" },
                { status: 400 }
            );
        }

        const firstModule = await ModuleModel.findOne({
            courseId: courseId,
        }).sort({ order: 1 });

        const enrollment = await EnrollmentModel.create({
            learnerId: decoded.userId,
            courseId: courseId,
            unlockedModules: firstModule ? [firstModule._id] : [],
        });

        return NextResponse.json(
            { message: "Enrolled successfully", enrollment },
            { status: 201 }
        );
    } catch (error) {
        console.error("ENROLLMENT_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
