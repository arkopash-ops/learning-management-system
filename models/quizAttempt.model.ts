import { QuizAttemptDocument } from "@/shared/types/quizAttempt.types";
import { model, models, Schema } from "mongoose";

const QuizAttemptSchema = new Schema<QuizAttemptDocument>({
    quizId: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
        index: true,
        required: true
    },

    learnerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
        required: true,
    },

    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        index: true,
        required: true,
    },

    answers: [{
        questionId: {
            type: Schema.Types.ObjectId,
            ref: "Question",
        },

        selectedOptionId: { type: String },

        required: true,
    }],

    score: {
        type: Number,
        default: 0,
    },

    passed: {
        type: Boolean,
        default: false
    },

    attemptNumber: {
        type: Number,
        required: true,
    },
});

QuizAttemptSchema.index(
    { quizId: 1, learnerId: 1, attemptNumber: 1 },
    { unique: true }
);

const QuizAttemptModel = models.QuizAttempt ||
    model<QuizAttemptDocument>("QuizAttempt", QuizAttemptSchema);

export default QuizAttemptModel;
