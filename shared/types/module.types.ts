import { Document, Types } from "mongoose";

export interface IModule {
    courseId: Types.ObjectId;
    title: string;
    description: string;
    order: number;
    quizId: Types.ObjectId;
    totalLessons: number;
};

export interface ModuleDocument extends IModule, Document { };
