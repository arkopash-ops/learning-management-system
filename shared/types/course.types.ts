import { Document, Types } from "mongoose";

export interface ICourse {
    title: string;
    description: string;
    instructorId: Types.ObjectId;
    tags: string[];
    isPublished: boolean;
    totalModules: number;
    totalLessons: number;
}

export interface CourseDocument extends ICourse, Document { };
