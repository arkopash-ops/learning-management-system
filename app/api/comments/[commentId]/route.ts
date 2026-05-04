import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import DiscussionCommentModel from "@/models/discussionComments.model";
import DiscussionThreadModel from "@/models/discussionThreads.model";


async function collectReplyIds(commentIds: string[]) {
    const allIds = [...commentIds];
    let parentIds = commentIds;

    while (parentIds.length > 0) {
        const replies = await DiscussionCommentModel.find({
            parentCommentId: { $in: parentIds },
        }).select("_id");

        parentIds = replies.map((reply) => reply._id.toString());
        allIds.push(...parentIds);
    }

    return allIds;
}

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

        const commentIdsToDelete = await collectReplyIds([commentId]);

        await DiscussionCommentModel.deleteMany({
            _id: { $in: commentIdsToDelete },
        });

        await DiscussionThreadModel.findByIdAndUpdate(comment.threadId, {
            $inc: { totalComments: -commentIdsToDelete.length },
        });

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("DELETE_COMMENT_ERROR", error);

        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
