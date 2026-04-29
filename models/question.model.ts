import { QuestionDocument } from "@/shared/types/question.types";
import { model, models, Schema } from "mongoose";

const QuestionSchema = new Schema<QuestionDocument>({
    quizId: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
        required: true,
        index: true,
    },

    questionText: {
        type: String,
        required: true,
        trim: true,
    },

    options: [{
        optionId: { type: String, required: true, },
        text: { type: String, required: true, },
    }],

    correctOptionId: {
        type: String,
        required: true,
        select: false,
    },
}, { timestamps: true });

const QuestionModel = models.Question ||
    model<QuestionDocument>("Question", QuestionSchema);

export default QuestionModel;
