import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import DiscussionCommentModel from "@/models/discussionComments.model";
import DiscussionThreadModel from "@/models/discussionThreads.model";


// api for delete Commement
export async function DELETE(
    req: Request,
    context: { params: Promise<{ commentId: string }> }
) {
    try {
        await connectDB();

        const { commentId } = await context.params;
        if (!commentId) {
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

        const user = verifyToken(token);
        const comment = await DiscussionCommentModel.findById(commentId);

        if (!comment) {
            return NextResponse.json(
                { message: "Not found" },
                { status: 404 }
            );
        }

        if (comment.authorId.toString() !== user.userId) {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
            );
        }

        await DiscussionCommentModel.findByIdAndDelete(commentId);

        await DiscussionThreadModel.findByIdAndUpdate(comment.threadId, {
            $inc: { totalComments: -1 },
        });

        return NextResponse.json({ message: "Deleted" });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
