import { Document, Types } from "mongoose";

export interface IAnswer {
    questionId: Types.ObjectId;
    selectedOptionId: string;
};

export interface IQuizAttempts {
    quizId: Types.ObjectId;
    learnerId: Types.ObjectId;
    courseId: Types.ObjectId;
    answers: IAnswer[];
    score: number;
    passed: boolean;
    attemptNumber: number;
};

export interface QuizAttemptDocument extends IQuizAttempts, Document { };
