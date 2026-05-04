import { DiscussionCommentDocument } from "@/shared/types/discussionComments.types";
import { model, models, Schema } from "mongoose";

const DiscussionCommentSchema = new Schema<DiscussionCommentDocument>({
    threadId: {
        type: Schema.Types.ObjectId,
        ref: "DiscussionThread",
        required: true,
        index: true,
    },

    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
    },

    lessonId: {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
        index: true,
    },

    authorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    parentCommentId: {
        type: Schema.Types.ObjectId,
        ref: "DiscussionComment",
        index: true,
        default: null,
    },

    comment: {
        type: String,
    },
}, { timestamps: true });

const DiscussionCommentModel = models.DiscussionComment ||
    model<DiscussionCommentDocument>("DiscussionComment", DiscussionCommentSchema);

export default DiscussionCommentModel;
