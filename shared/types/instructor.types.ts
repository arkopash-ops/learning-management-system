import { Document, Types } from "mongoose";

export interface IEducation {
    degree: string;
    institution: string;
    year: number;
}

export interface IInstructore {
    userId: Types.ObjectId;
    subjects: string[];
    bio: string;
    dateOfBirth: Date;
    education: IEducation[];
}

export interface InstructoreDocument extends IInstructore, Document { };
