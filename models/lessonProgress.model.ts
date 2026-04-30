import { model, models, Schema } from "mongoose";
import { LessonProgressDocument } from "@/shared/types/lessonProgress.types";

const LessonProgressSchema = new Schema<LessonProgressDocument>({
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

    moduleId: {
        type: Schema.Types.ObjectId,
        ref: "Module",
        required: true,
        index: true,
    },

    lessonId: {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
        index: true,
    },

    videoWatchedInSeconds: {
        type: Number,
        default: 0,
    },

    lastPositionSec: {
        type: Number,
        default: 0,
    },

    lastWatchedAt: {
        type: Date,
        default: Date.now,
    },

    isCompleted: {
        type: Boolean,
        default: false,
    },

    completedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

LessonProgressSchema.index({ learnerId: 1, lessonId: 1 }, { unique: true });

const LessonProgressModel = models.LessonProgress ||
    model<LessonProgressDocument>("LessonProgress", LessonProgressSchema);

export default LessonProgressModel;
