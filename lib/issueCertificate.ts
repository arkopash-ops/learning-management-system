import CertificateModel from "@/models/certificate.model";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import UserModel from "@/models/user.model";
import { generateCertId, generateSignatureHash } from "./generateCertificate";


// function to issue Certificates
export async function issueCertificate({
    learnerId,
    courseId,
    issuedBy,
}: {
    learnerId: string;
    courseId: string;
    issuedBy: string;
}) {
    // Check enrollment completion
    const enrollment = await EnrollmentModel.findOne({
        learnerId,
        courseId,
    });

    if (!enrollment || enrollment.progressPercent < 100) {
        throw new Error("Course not completed");
    }

    const user = await UserModel.findById(learnerId);
    const course = await CourseModel.findById(courseId);

    const certId = generateCertId();

    const payload = {
        certId,
        learnerId,
        courseId,
        issuedAt: new Date(),
    };

    const signatureHash = generateSignatureHash(payload);

    const certificate = await CertificateModel.create({
        certId,
        learnerId,
        courseId,
        issuedBy,
        signatureHash,
        learnerNameSnapshot: user?.name,
        courseTitleSnapshot: course?.title,
        completedAt: enrollment.completedAt,
    });

    return certificate;
}
