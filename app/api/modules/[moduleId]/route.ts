import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ModuleModel from "@/models/module.model";
import CourseModel from "@/models/course.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// api foor update Module
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ moduleId: string }> }
) {
    try {
        await connectDB();

        const { moduleId } = await context.params;
        if (!moduleId) {
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

        const myModule = await ModuleModel.findById(moduleId);

        if (!myModule) {
            return NextResponse.json(
                { message: "Module not found" },
                { status: 404 }
            );
        }

        const course = await CourseModel.findOne({
            _id: myModule.courseId,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const updated = await ModuleModel.findByIdAndUpdate(
            moduleId,
            { $set: body },
            { returnDocument: "after" }
        );

        return NextResponse.json({ module: updated });
    } catch (error) {
        console.error("UPDATE_MODULE_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


// api for delete Module
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ moduleId: string }> }
) {
    try {
        await connectDB();

        const { moduleId } = await context.params;
        if (!moduleId) {
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

        const myModule = await ModuleModel.findById(moduleId);

        if (!myModule) {
            return NextResponse.json(
                { message: "Module not found" },
                { status: 404 }
            );
        }

        const course = await CourseModel.findOne({
            _id: myModule.courseId,
            instructorId: decoded.userId,
        });

        if (!course) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        await ModuleModel.findByIdAndDelete(moduleId);

        await CourseModel.findByIdAndUpdate(myModule.courseId, {
            $inc: { totalModules: -1 },
        });

        return NextResponse.json({
            message: "Module deleted",
        });
    } catch (error) {
        console.error("DELETE_MODULE_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
