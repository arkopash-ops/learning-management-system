import { QuizDocument } from "@/shared/types/quiz.types";
import { model, models, Schema } from "mongoose";

const QuizSchema = new Schema<QuizDocument>({
    moduleId: {
        type: Schema.Types.ObjectId,
        ref: "Module",
        unique: true,
        index: true
    },

    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        index: true
    },

    title: {
        type: String,
        required: true,
        trim: true,
    },

    passPercentage: {
        type: Number,
        required: true,
    },

    timeLimitSec: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

const QuizModel = models.Quiz ||
    model<QuizDocument>("Quiz", QuizSchema);

export default QuizModel;
