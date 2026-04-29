import { ModuleDocument } from "@/shared/types/module.types";
import { model, models, Schema } from "mongoose";

const ModuleSchema = new Schema<ModuleDocument>({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
    },

    title: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        trim: true,
    },

    order: {
        type: Number,
        required: true
    },

    quizId: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
        default: null,
    },

    totalLessons: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

ModuleSchema.index({ courseId: 1, order: 1 }, { unique: true });

const ModuleModel = models.Module ||
    model<ModuleDocument>("Module", ModuleSchema);

export default ModuleModel;
