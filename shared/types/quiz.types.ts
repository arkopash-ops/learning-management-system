import { Document, Types } from "mongoose";

export interface IQuiz {
    moduleId: Types.ObjectId;
    courseId: Types.ObjectId;
    title: string;
    passPercentage: number;
    timeLimitSec: number;
}

export interface QuizDocument extends IQuiz, Document { };
