import { model, models, Schema } from 'mongoose';
import { LearnerDocument } from '../shared/types/learner.types';
import { EducationLevel } from '@/shared/enum/EducationLevel.enum';

const LearnerSchema = new Schema({
    learnerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },

    bio: {
        type: String,
        default: "",
    },

    dateOfBirth: { type: Date },

    educationLevel: {
        type: String,
        enum: Object.values(EducationLevel),
        default: EducationLevel.SCHOOL,
        required: true,
    },

    interests: { type: [String] },
});

const LearnerModel = models.Learner ||
    model<LearnerDocument>("Learner", LearnerSchema);

export default LearnerModel;
