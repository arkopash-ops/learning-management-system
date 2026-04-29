import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ModuleModel from "@/models/module.model";
import CourseModel from "@/models/course.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


// api for get Modules by Course
export async function GET(
    req: NextRequest,
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

        const modules = await ModuleModel.find({
            courseId: courseId,
        }).sort({ order: 1 });

        return NextResponse.json({ modules });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}


// api for creating modules
export async function POST(
    req: NextRequest,
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

        if (decoded.role !== UserRole.INSTRUCTOR) {
            return NextResponse.json(
                { message: "Only instructors allowed" },
                { status: 403 }
            );
        }

        const { title, description, order } = await req.json();

        if (!title || order === undefined) {
            return NextResponse.json(
                { message: "Title and order required" },
                { status: 400 }
            );
        }

        const course = await CourseModel.findOne({
            _id: courseId,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Course not found or unauthorized" },
                { status: 404 }
            );
        }

        const myModule = await ModuleModel.create({
            courseId: courseId,
            title,
            description,
            order,
        });

        await CourseModel.findByIdAndUpdate(courseId, {
            $inc: { totalModules: 1 },
        });

        return NextResponse.json(
            { message: "Module created", myModule },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE_MODULE_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
