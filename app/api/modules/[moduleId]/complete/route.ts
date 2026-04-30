import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ModuleModel from "@/models/module.model";
import EnrollmentModel from "@/models/enrollment.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { updateCourseProgress } from "@/lib/updateCourseProgress";
import { Types, UpdateQuery } from "mongoose";
import { EnrollmentDocument } from "@/shared/types/enrollment.types";

// api for Module Complete
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ moduleId: string }> }
) {
    try {
        await connectDB();

        const { moduleId } = await context.params;
        if (!moduleId) {
            return NextResponse.json(
                { message: "Module ID is required" },
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

        const enrollment = await EnrollmentModel.findOne({
            learnerId: decoded.userId,
            courseId: myModule.courseId,
        });

        if (!enrollment) {
            return NextResponse.json(
                { message: "Not enrolled in this course" },
                { status: 403 }
            );
        }

        const isUnlocked = enrollment.unlockedModules.some(
            (id: Types.ObjectId) => id.equals(myModule._id)
        );

        if (!isUnlocked) {
            return NextResponse.json(
                { message: "Module is locked" },
                { status: 403 }
            );
        }

        const nextModule = await ModuleModel.findOne({
            courseId: myModule.courseId,
            order: myModule.order + 1,
        });

        const updatePayload: UpdateQuery<EnrollmentDocument> = {
            $addToSet: {
                completedModules: myModule._id,
                ...(nextModule && { unlockedModules: nextModule._id }),
            },
            $set: {
                lastActivityAt: new Date(),
            },
        };

        await EnrollmentModel.updateOne(
            { _id: enrollment._id },
            updatePayload
        );

        await updateCourseProgress(
            decoded.userId,
            myModule.courseId.toString()
        );

        return NextResponse.json({
            message: "Module completed successfully",
            data: {
                completedModuleId: myModule._id,
                nextModuleId: nextModule?._id || null,
            },
        });
    } catch (error) {
        console.error("MODULE_COMPLETE_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
