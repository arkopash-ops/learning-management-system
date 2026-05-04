import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LessonModel from "@/models/lesson.model";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import DiscussionThreadModel from "@/models/discussionThreads.model";
import DiscussionCommentModel from "@/models/discussionComments.model";
import { CommentNode } from "@/shared/types/comment.types";
import { UserRole } from "@/shared/enum/UserRole.enum";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import { EnrollStatus } from "@/shared/enum/EnrollStatus.enum";
import UserModel from "@/models/user.model";

type LeanComment = {
    _id: { toString: () => string };
    threadId: { toString: () => string };
    courseId: { toString: () => string };
    lessonId: { toString: () => string };
    authorId: {
        _id?: { toString: () => string };
        name?: string;
        role?: string;
        toString: () => string;
    };
    parentCommentId?: { toString: () => string } | null;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
};

async function canAccessLessonComments(
    user: { userId: string; role: string },
    lesson: { courseId: unknown },
) {
    if (user.role === UserRole.INSTRUCTOR) {
        const course = await CourseModel.findOne({
            _id: lesson.courseId,
            instructorId: user.userId,
        }).select("_id");

        return Boolean(course);
    }

    if (user.role === UserRole.LEARNER) {
        const enrollment = await EnrollmentModel.findOne({
            courseId: lesson.courseId,
            learnerId: user.userId,
            status: { $in: [EnrollStatus.ENROLLED, EnrollStatus.COMPLETED] },
        }).select("_id");

        return Boolean(enrollment);
    }

    return false;
}


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
        const commentText = typeof comment === "string" ? comment.trim() : "";

        if (!commentText) {
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

        const hasAccess = await canAccessLessonComments(user, lesson);
        if (!hasAccess) {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
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

        if (parentCommentId) {
            const parentComment = await DiscussionCommentModel.findOne({
                _id: parentCommentId,
                threadId: thread._id,
                lessonId: lesson._id,
            }).select("_id");

            if (!parentComment) {
                return NextResponse.json(
                    { message: "Parent comment not found" },
                    { status: 404 }
                );
            }
        }

        const newComment = await DiscussionCommentModel.create({
            threadId: thread._id,
            courseId: lesson.courseId,
            lessonId: lesson._id,
            authorId: user.userId,
            parentCommentId: parentCommentId || null,
            comment: commentText,
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

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = verifyToken(token);
        const lesson = await LessonModel.findById(lessonId);

        if (!lesson) {
            return NextResponse.json(
                { message: "Lesson not found" },
                { status: 404 }
            );
        }

        const hasAccess = await canAccessLessonComments(user, lesson);
        if (!hasAccess) {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
            );
        }

        const thread = await DiscussionThreadModel.findOne({
            lessonId: lessonId,
        });

        if (!thread) {
            return NextResponse.json({ comments: [] });
        }

        const comments = await DiscussionCommentModel.find({ threadId: thread._id })
            .populate({ path: "authorId", model: UserModel, select: "name role" })
            .sort({ createdAt: 1 })
            .lean<LeanComment[]>();

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
                authorId: c.authorId._id?.toString() ?? c.authorId.toString(),
                authorName: c.authorId.name,
                authorRole: c.authorId.role,
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
                roots.push(map[c._id.toString()]);
            }
        });

        return NextResponse.json({
            thread,
            currentUserId: user.userId,
            comments: roots,
        });
    } catch (error) {
        console.error("GET_COMMENTS_ERROR", error);

        return NextResponse.json(
            { message: "Server error" },
            { status: 500 }
        );
    }
}
