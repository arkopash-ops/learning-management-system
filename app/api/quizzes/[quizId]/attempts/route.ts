import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import QuizAttemptModel from "@/models/quizAttempt.model";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


// api for get Attempts
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ quizId: string }> }
) {
    try {
        await connectDB();

        const { quizId } = await context.params;
        if (!quizId) {
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

        const attempts = await QuizAttemptModel.find({
            quizId: quizId,
            learnerId: decoded.userId,
        }).sort({ attemptNumber: -1 });

        return NextResponse.json({ attempts });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
