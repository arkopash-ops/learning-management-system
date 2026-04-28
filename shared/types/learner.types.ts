import { Document, Types } from "mongoose";
import { EducationLevel } from "../enum/EducationLevel.enum";

export interface ILearner {
    userId: Types.ObjectId;
    bio: string;
    dateOfBirth: Date;
    educationLevel: EducationLevel;
    interests: string[];
};

export interface LearnerDocument extends ILearner, Document { };
