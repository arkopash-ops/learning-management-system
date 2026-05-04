import { Document, Types } from "mongoose";

export interface IDiscussionThreads {
    courseId: Types.ObjectId;
    moduleId: Types.ObjectId;
    lessonId: Types.ObjectId;
    totalComments: number;
    lastCommentAt: Date;
}

export interface DiscussionThreadsDocument extends IDiscussionThreads, Document { }
