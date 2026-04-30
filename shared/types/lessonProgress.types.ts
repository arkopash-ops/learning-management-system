import { Document, Types } from "mongoose";

export interface ILessonProgress {
    learnerId: Types.ObjectId;
    courseId: Types.ObjectId;
    moduleId: Types.ObjectId;
    lessonId: Types.ObjectId;
    videoWatchedInSeconds: number;
    lastPositionSec: number;
    lastWatchedAt: Date;
    isCompleted: boolean;
    completedAt: Date | null;
};

export interface LessonProgressDocument extends ILessonProgress, Document { };
