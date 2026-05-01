import { ResourcesTypes } from "@/shared/enum/ResourceTypes.enum";
import { LessonDocument } from "@/shared/types/lessons.types";
import { model, models, Schema } from "mongoose";

const ResourcesSchema = new Schema({
    type: {
        type: String,
        enum: Object.values(ResourcesTypes),
    },

    label: { type: String },

    url: { type: String },

    publicId: { type: String },
}, { _id: false });

const LessonSchema = new Schema<LessonDocument>({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        index: true,
        required: true,
    },

    moduleId: {
        type: Schema.Types.ObjectId,
        ref: "Module",
        index: true,
        required: true,
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
        required: true,
    },

    videoUrl: {
        type: String,
        default: "",
    },

    videoPublicId: {
        type: String,
        default: "",
    },

    videoDurationSec: {
        type: Number,
        default: 0,
    },

    readingContent: { type: String },

    resources: [ResourcesSchema],

    isPreview: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

LessonSchema.index({ moduleId: 1, order: 1 }, { unique: true });

const LessonModel = models.Lesson ||
    model<LessonDocument>("Lesson", LessonSchema);

export default LessonModel;
