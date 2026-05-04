import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LessonModel from "@/models/lesson.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import DiscussionThreadModel from "@/models/discussionThreads.model";
import DiscussionCommentModel from "@/models/discussionComments.model";
import { CommentNode } from "@/shared/types/comment.types";


// api for post a Comments on Lesson
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ lessonId: string }> }
) {
    try {
        await connectDB();

        const { lessonId } = await context.params;
        if (!lessonId) {
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
        const { comment, parentCommentId } = await req.json();

        if (!comment) {
            return NextResponse.json(
                { message: "Comment required" },
                { status: 400 }
            );
        }

        const lesson = await LessonModel.findById(lessonId);
        if (!lesson) {
            return NextResponse.json(
                { message: "Lesson not found" },
                { status: 404 }
            );
        }

        let thread = await DiscussionThreadModel.findOne({
            lessonId: lessonId,
        });

        if (!thread) {
            thread = await DiscussionThreadModel.create({
                courseId: lesson.courseId,
                moduleId: lesson.moduleId,
                lessonId: lesson._id,
            });
        }

        const newComment = await DiscussionCommentModel.create({
            threadId: thread._id,
            courseId: lesson.courseId,
            lessonId: lesson._id,
            authorId: user.userId,
            parentCommentId: parentCommentId || null,
            comment,
        });

        await DiscussionThreadModel.findByIdAndUpdate(thread._id, {
            $inc: { totalComments: 1 },
            $set: { lastCommentAt: new Date() },
        });

        return NextResponse.json({
            message: "Comment added",
            comment: newComment,
        });
    } catch (error) {
        console.error("POST_COMMENT_ERROR", error);

        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}


// api for get Comment Thread
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ lessonId: string }> }
) {
    try {
        await connectDB();

        const { lessonId } = await context.params;
        if (!lessonId) {
            return NextResponse.json(
                { success: false, message: "ID is required" },
                { status: 400 }
            );
        }

        const thread = await DiscussionThreadModel.findOne({
            lessonId: lessonId,
        });

        if (!thread) {
            return NextResponse.json({ comments: [] });
        }

        const comments = await DiscussionCommentModel.find({ threadId: thread._id })
            .sort({ createdAt: 1 })
            .lean();

        const map: Record<string, CommentNode> = {};
        const roots: CommentNode[] = [];

        comments.forEach((c) => {
            const id = c._id.toString();

            map[id] = {
                ...c,
                _id: id,
                threadId: c.threadId.toString(),
                courseId: c.courseId.toString(),
                lessonId: c.lessonId.toString(),
                authorId: c.authorId.toString(),
                parentCommentId: c.parentCommentId
                    ? c.parentCommentId.toString()
                    : null,
                replies: [],
            };
        });

        comments.forEach((c) => {
            if (c.parentCommentId) {
                const parentId = c.parentCommentId?.toString();
                const currentId = c._id.toString();

                if (parentId && map[parentId]) {
                    map[parentId].replies.push(map[currentId]);
                } else {
                    roots.push(map[currentId]);
                }
            } else {
                roots.push(map[c._id]);
            }
        });

        return NextResponse.json({
            thread,
            comments: roots,
        });
    } catch {
        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
