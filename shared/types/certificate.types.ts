import { Document, Types } from "mongoose";

export interface ICertificate {
    certId: string;
    learnerId: Types.ObjectId;
    courseId: Types.ObjectId;
    issuedAt: Date;
    issuedBy: Types.ObjectId;
    signatureHash: string;
    learnerNameSnapshot: string;
    courseTitleSnapshot: string;
    pdfUrl: string;
    completedAt: Date;
};

export interface CertificateDocument extends ICertificate, Document { };

export interface CertificateHashPayload {
    certId: string;
    learnerId: string;
    courseId: string;
    issuedAt: string | Date;
}
