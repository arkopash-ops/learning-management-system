import { QuestionDocument } from "@/shared/types/question.types";
import { model, models, Schema } from "mongoose";

const QuestionSchema = new Schema<QuestionDocument>({
    quizId: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
        index: true
    },

    questionText: {
        type: String,
        trim: true,
    },

    options: [{
        optionId: { type: String },
        text: { type: String },
    }],

    correctOptionId: { type: String },
}, { timestamps: true });

const QuestionModel = models.Question ||
    model<QuestionDocument>("Question", QuestionSchema);

export default QuestionModel;
