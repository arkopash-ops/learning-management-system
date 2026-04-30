import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EnrollmentModel from "@/models/enrollment.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";


// api for get My Module
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

        const enrollments = await EnrollmentModel.find({
            learnerId: decoded.userId,
        })
            .populate("courseId", "title")
            .lean();

        return NextResponse.json({ enrollments });
    } catch (error) {
        console.error("GET_MY_ENROLLED_COURSES_ERROR", error);

        return NextResponse.json(
            { message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}
