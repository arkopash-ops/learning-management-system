import { EnrollStatus } from '@/shared/enum/EnrollStatus.enum';
import { EnrollmentDocument } from '@/shared/types/enrollment.types';
import { model, models, Schema } from 'mongoose';

const EnrollmentSchema = new Schema<EnrollmentDocument>({
    learnerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true,
    },

    status: {
        type: String,
        enum: Object.values(EnrollStatus),
        default: EnrollStatus.ENROLLED,
    },

    unlockedModules: {
        type: [Schema.Types.ObjectId],
        ref: "Module",
        default: [],
    },

    completedModules: {
        type: [Schema.Types.ObjectId],
        ref: "Module",
        default: [],
    },

    progressPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },

    enrolledAt: {
        type: Date,
        default: Date.now,
    },

    completedAt: {
        type: Date,
        default: null,
    },

    lastActivityAt: {
        type: Date,
        default: Date.now,
    },
});

EnrollmentSchema.index({ learnerId: 1, courseId: 1 }, { unique: true });

const EnrollmentModel = models.Enrollment ||
    model<EnrollmentDocument>("Enrollment", EnrollmentSchema);

export default EnrollmentModel;