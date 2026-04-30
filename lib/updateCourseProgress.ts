import EnrollmentModel from "@/models/enrollment.model";
import ModuleModel from "@/models/module.model";


// function to update Cource progress after 
//         - Module Completion
//         - After Lesson Completion
//         - Quiz Pass
export async function updateCourseProgress(
    learnerId: string,
    courseId: string
) {
    const enrollment = await EnrollmentModel.findOne({
        learnerId,
        courseId,
    });

    if (!enrollment) return;

    const totalModules = await ModuleModel.countDocuments({
        courseId,
    });

    const completedModules = enrollment.completedModules.length;

    const progress =
        totalModules === 0
            ? 0
            : (completedModules / totalModules) * 100;

    enrollment.progressPercent = progress;

    if (progress === 100) {
        enrollment.status = "completed";
        enrollment.completedAt = new Date();
    }

    enrollment.lastActivityAt = new Date();

    await enrollment.save();
}
