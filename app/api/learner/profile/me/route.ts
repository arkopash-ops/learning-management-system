import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import LearnerModel from "@/models/learner.model";
import { EducationLevel } from "@/shared/enum/EducationLevel.enum";
import { UserRole } from "@/shared/enum/UserRole.enum";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


type UpdatableFields = Partial<{
    bio: string;
    dateOfBirth: Date;
    educationLevel: EducationLevel;
    interests: string[];
}>;


// api for get my Profile (learner)
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

        const learner = await LearnerModel.findOne({
            userId: decoded.userId,
        }).populate("userId", "name email role");

        if (!learner) {
            return NextResponse.json(
                { message: "Learner profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ learner });
    } catch (error) {
        console.error("GET_LEARNER_ME_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}


// api for update my Profile (learner)
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

        if (decoded.role !== UserRole.LEARNER) {
            return NextResponse.json(
                { message: "Forbidden: Only learners allowed" },
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

        if (body.educationLevel !== undefined) {
            if (
                typeof body.educationLevel !== "string" ||
                !Object.values(EducationLevel).includes(body.educationLevel)
            ) {
                return NextResponse.json(
                    { message: "Select proper Education Level" },
                    { status: 400 }
                );
            }
            updateData.educationLevel = body.educationLevel;
        }

        if (body.interests !== undefined) {
            if (!Array.isArray(body.interests)) {
                return NextResponse.json(
                    { message: "Interests must be array of strings" },
                    { status: 400 }
                );
            }
            updateData.interests = body.interests
                .filter((interest: unknown) => typeof interest === "string")
                .map((interest: string) => interest.trim())
                .filter(Boolean);
        }

        const learner = await LearnerModel.findOneAndUpdate(
            { userId: decoded.userId },
            { $set: updateData },
            { returnDocument: "after" }
        );

        if (!learner) {
            return NextResponse.json(
                { message: "Learner profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Profile updated successfully",
            learner: learner,
        });
    } catch (error) {
        console.error("PATCH_LEARNER_ME_ERROR", error);

        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
