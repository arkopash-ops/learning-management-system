import CertificateModel from "@/models/certificate.model";
import EnrollmentModel from "@/models/enrollment.model";
import ModuleModel from "@/models/module.model";
import { issueCertificate } from "./issueCertificate";
import CourseModel from "@/models/course.model";


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

    const course = await CourseModel.findById(courseId);

    if (progress === 100 && enrollment.status !== "completed") {
        enrollment.status = "completed";
        enrollment.completedAt = new Date();

        const cert = await CertificateModel.findOne({ learnerId, courseId });

        if (!cert) {
            await issueCertificate({
                learnerId,
                courseId,
                issuedBy: course.instructorId
            });
        }
    }

    enrollment.lastActivityAt = new Date();

    await enrollment.save();
}
