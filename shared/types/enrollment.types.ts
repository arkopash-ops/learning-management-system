import { Document, Types } from "mongoose";
import { EnrollStatus } from "../enum/EnrollStatus.enum";

export interface IEnrollment {
    learnerId: Types.ObjectId;
    courseId: Types.ObjectId;
    status: EnrollStatus;
    unlockedModules: Types.ObjectId[];
    completedModules: Types.ObjectId[];
    progressPercent: number;
    enrolledAt: Date;
    completedAt: Date | null;
    lastActivityAt: Date;
};

export interface EnrollmentDocument extends IEnrollment, Document { };
