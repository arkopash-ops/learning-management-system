import { CourseDocument } from "@/shared/types/course.types";
import { model, models, Schema } from "mongoose";

const CourseSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        trim: true,
    },

    instructorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    tags: {
        type: [String],
        default: [],
    },

    isPublished: {
        type: Boolean,
        default: false,
        index: true,
    },

    totalModules: {
        type: Number,
        default: 0
    },

    totalLessons: {
        type: Number,
        default: 0
    },
});

const CourseModel = models.Course ||
    model<CourseDocument>("Course", CourseSchema);

export default CourseModel;
