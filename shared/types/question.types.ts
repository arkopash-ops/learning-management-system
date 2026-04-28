import { Document, Types } from "mongoose";

export interface IOptions {
    optionId: string;
    text: string;
};

export interface IQuestion {
    quizId: Types.ObjectId;
    questionText: string;
    options: IOptions;
    correctOptionId: string;
}

export interface QuestionDocument extends IQuestion, Document { };
