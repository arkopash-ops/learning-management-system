import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import LearnerModel from "@/models/learner.model";
import { EducationLevel } from "@/shared/enum/EducationLevel.enum";
import { UserRole } from "@/shared/enum/UserRole.enum";
import LearnerCourseCard, {
  type LearnerCourseCardItem,
  type LearnerCourseStatus,
} from "../LearnerCourseCard";
import "@/models/user.model";

interface LearnerCoursesProfile {
  bio?: string;
  dateOfBirth?: Date | string | null;
  educationLevel?: EducationLevel;
  interests?: string[];
}

interface LearnerEnrollmentCourseItem {
  courseId: string;
  status?: string;
  progressPercent?: number;
}

const isProfileIncomplete = (profile: LearnerCoursesProfile) =>
  !profile.bio ||
  !profile.dateOfBirth ||
  !profile.educationLevel ||
  !profile.interests ||
  profile.interests.length === 0;

export default async function LearnerCoursesPage() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const decoded = verifyToken(token);

  if (decoded.role !== UserRole.LEARNER) {
    redirect(`/${decoded.role}/dashboard`);
  }

  await connectDB();

  const learner = await LearnerModel.findOne({
    userId: decoded.userId,
  }).lean<LearnerCoursesProfile | null>();

  if (!learner || isProfileIncomplete(learner)) {
    redirect("/learner/profile?completeProfile=1");
  }

  const enrollments = await EnrollmentModel.find({
    learnerId: decoded.userId,
  })
    .select("courseId status progressPercent")
    .lean<LearnerEnrollmentCourseItem[]>();
  const enrolledCourseIds = enrollments.map((enrollment) => enrollment.courseId);
  const courseStatusMap = new Map<string, LearnerCourseStatus>(
    enrollments.map((enrollment) => [
      String(enrollment.courseId),
      enrollment.status === "completed" || enrollment.progressPercent === 100
        ? "completed"
        : "enrolled",
    ]),
  );

  const courses =
    enrolledCourseIds.length > 0
      ? await CourseModel.find({
          _id: { $in: enrolledCourseIds },
          isPublished: true,
        })
          .populate("instructorId", "name")
          .lean<LearnerCourseCardItem[]>()
      : [];

  return (
    <section className="w-full self-start mt-3 rounded-xl border bg-white p-6 shadow-md">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Continue learning from the courses you are enrolled in.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-600">
            You are not enrolled in any published courses yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <LearnerCourseCard
              key={course._id}
              course={course}
              status={courseStatusMap.get(String(course._id)) ?? "enrolled"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
