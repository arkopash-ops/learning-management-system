import { CertificateDocument } from "@/shared/types/certificate.types";
import { model, models, Schema } from "mongoose";

const CertificateSchema = new Schema<CertificateDocument>({
    certId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    learnerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
    },

    issuedAt: {
        type: Date,
        default: Date.now,
    },

    issuedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

    signatureHash: {
        type: String,
        required: true,
    },

    learnerNameSnapshot: { type: String },
    courseTitleSnapshot: { type: String },

    pdfUrl: { type: String },

    completedAt: { type: Date },
}, { timestamps: true });

CertificateSchema.index({ learnerId: 1, courseId: 1 }, { unique: true });

const CertificateModel = models.Certificate ||
    model<CertificateDocument>("Certificate", CertificateSchema);

export default CertificateModel;
