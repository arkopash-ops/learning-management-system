import { InstructoreDocument } from "@/shared/types/instructor.types";
import { model, models, Schema } from "mongoose";

const EducationSchema = new Schema({
    degree: { type: String },
    institution: { type: String },
    year: { type: String },
});

const InstructorSchema = new Schema<InstructoreDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },

    subjects: {
        type: [String],
        default: [],
    },

    bio: {
        type: String,
        default: "",
    },

    dateOfBirth: { type: Date },

    education: {
        type: [EducationSchema],
        default: [],
    },
}, { timestamps: true });

const InstructorModel = models.Instructor ||
    model<InstructoreDocument>("Instructor", InstructorSchema);

export default InstructorModel;
