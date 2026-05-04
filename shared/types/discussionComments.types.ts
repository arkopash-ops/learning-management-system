import { Document, Types } from "mongoose";

export interface IDiscussionComments {
    threadId: Types.ObjectId;
    courseId: Types.ObjectId;
    lessonId: Types.ObjectId;
    authorId: Types.ObjectId;
    parentCommentId: Types.ObjectId | null;
    comment: string;
}

export interface DiscussionCommentDocument extends IDiscussionComments, Document { };
