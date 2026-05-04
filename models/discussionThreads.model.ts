import { DiscussionThreadsDocument } from "@/shared/types/discussionThreads.types";
import { model, models, Schema } from "mongoose";

const DiscussionThreadSchema = new Schema<DiscussionThreadsDocument>({
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

    totalComments: {
        type: Number,
        default: 0,
    },

    lastCommentAt: {
        type: Date,
    },
}, { timestamps: true });

const DiscussionThreadModel = models.DiscussionThread ||
    model<DiscussionThreadsDocument>("DiscussionThread", DiscussionThreadSchema);

export default DiscussionThreadModel;
