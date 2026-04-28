import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import InstructorModel from "@/models/instructor.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { IEducation } from "@/shared/types/instructor.types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


type UpdatableFields = Partial<{
    subjects: string[];
    bio: string;
    dateOfBirth: Date;
    education: IEducation[];
}>;


// api for get my Profile (instructor)
export async function GET() {
    try {
        await connectDB();

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);

        const instructor = await InstructorModel.findOne({
            userId: decoded.userId,
        }).populate("userId", "name email role");

        if (!instructor) {
            return NextResponse.json(
                { message: "Instructor profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            instructor,
        });
    } catch (error) {
        console.error("GET_INSTRUCTOR_ME_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


// api for update my Profile (instructor)
export async function PATCH(req: NextRequest) {
    try {
        await connectDB();

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
                { message: "Forbidden: Only instructors allowed" },
                { status: 403 }
            );
        }

        const body = await req.json();

        const updateData: UpdatableFields = {};

        if (body.bio !== undefined) {
            if (typeof body.bio !== "string" || body.bio.trim().length < 5) {
                return NextResponse.json(
                    { message: "Bio must be at least 5 characters" },
                    { status: 400 }
                );
            }
            updateData.bio = body.bio.trim();
        }

        if (body.subjects !== undefined) {
            if (!Array.isArray(body.subjects)) {
                return NextResponse.json(
                    { message: "Subjects must be array of strings" },
                    { status: 400 }
                );
            }
            updateData.subjects = body.subjects;
        }

        if (body.education !== undefined) {
            if (!Array.isArray(body.education)) {
                return NextResponse.json(
                    { message: "Education must be an array" },
                    { status: 400 }
                );
            }

            for (const edu of body.education) {
                if (
                    typeof edu.degree !== "string" ||
                    typeof edu.institution !== "string" ||
                    typeof edu.year !== "number"
                ) {
                    return NextResponse.json(
                        { message: "Invalid education format" },
                        { status: 400 }
                    );
                }
            }

            updateData.education = body.education;
        }

        if (body.dateOfBirth !== undefined) {
            const date = new Date(body.dateOfBirth);
            if (isNaN(date.getTime())) {
                return NextResponse.json(
                    { message: "Invalid dateOfBirth" },
                    { status: 400 }
                );
            }
            updateData.dateOfBirth = date;
        }

        const instructor = await InstructorModel.findOneAndUpdate(
            { userId: decoded.userId },
            { $set: updateData },
            { returnDocument: "after" }
        );

        if (!instructor) {
            return NextResponse.json(
                { message: "Instructor profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Profile updated successfully",
            instructor,
        });
    } catch (error) {
        console.error("PATCH_INSTRUCTOR_ME_ERROR", error);

        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
