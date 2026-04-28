import { QuizAttemptDocument } from "@/shared/types/quizAttempt.types";
import { model, models, Schema } from "mongoose";

const QuizAttemptSchema = new Schema<QuizAttemptDocument>({
    quizId: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
        index: true
    },

    learnerId: {
        type: Schema.Types.ObjectId,
        ref: "Learner",
        index: true
    },

    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        index: true
    },

    answers: [{
        questionId: { 
            type: Schema.Types.ObjectId,
            ref:"Question",
        },
        
        selectedOptionId: { type: String },
    }],

    score: { type: Number },

    passed: { type: Boolean },

    attemptNumber: { type: Number },
});

const QuizAttemptModel = models.QuizAttempt ||
    model<QuizAttemptDocument>("QuizAttempt", QuizAttemptSchema);

export default QuizAttemptModel;
