import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaBook,
  FaCertificate,
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaLayerGroup,
  FaQuestionCircle,
  FaRegClock,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import CertificateModel from "@/models/certificate.model";
import CourseModel from "@/models/course.model";
import DiscussionCommentModel from "@/models/discussionComments.model";
import DiscussionThreadModel from "@/models/discussionThreads.model";
import EnrollmentModel from "@/models/enrollment.model";
import InstructorModel from "@/models/instructor.model";
import LearnerModel from "@/models/learner.model";
import LessonModel from "@/models/lesson.model";
import LessonProgressModel from "@/models/lessonProgress.model";
import ModuleModel from "@/models/module.model";
import QuestionModel from "@/models/question.model";
import QuizAttemptModel from "@/models/quizAttempt.model";
import QuizModel from "@/models/quiz.model";
import UserModel from "@/models/user.model";
import { EnrollStatus } from "@/shared/enum/EnrollStatus.enum";
import { UserRole } from "@/shared/enum/UserRole.enum";

export const dynamic = "force-dynamic";

type StatCard = {
  label: string;
  value: number | string;
  helper: string;
  icon: React.ReactNode;
};

type RecentCertificate = {
  _id: unknown;
  certId: string;
  learnerNameSnapshot?: string;
  courseTitleSnapshot?: string;
  issuedAt?: Date;
  completedAt?: Date;
  pdfUrl?: string;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en").format(value);

const formatPercent = (value: number) =>
  `${Number.isFinite(value) ? Math.round(value) : 0}%`;

const formatDate = (value?: Date) => {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
};

async function myAdmin() {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");

  try {
    const user = verifyToken(token);
    if (user.role !== UserRole.ADMIN) redirect("/");
  } catch {
    redirect("/login");
  }
}

async function getAdminAnalytics() {
  await connectDB();

  const [
    totalUsers,
    totalLearners,
    totalInstructors,
    learnerProfiles,
    instructorProfiles,
    totalCourses,
    publishedCourses,
    totalModules,
    totalLessons,
    previewLessons,
    totalQuizzes,
    totalQuestions,
    totalEnrollments,
    completedEnrollments,
    lessonProgress,
    completedLessonProgress,
    quizAttempts,
    passedQuizAttempts,
    discussionThreads,
    discussionComments,
    issuedCertificates,
    recentCertificates,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: UserRole.LEARNER }),
    UserModel.countDocuments({ role: UserRole.INSTRUCTOR }),
    LearnerModel.countDocuments(),
    InstructorModel.countDocuments(),
    CourseModel.countDocuments(),
    CourseModel.countDocuments({ isPublished: true }),
    ModuleModel.countDocuments(),
    LessonModel.countDocuments(),
    LessonModel.countDocuments({ isPreview: true }),
    QuizModel.countDocuments(),
    QuestionModel.countDocuments(),
    EnrollmentModel.countDocuments(),
    EnrollmentModel.countDocuments({ status: EnrollStatus.COMPLETED }),
    LessonProgressModel.countDocuments(),
    LessonProgressModel.countDocuments({ isCompleted: true }),
    QuizAttemptModel.countDocuments(),
    QuizAttemptModel.countDocuments({ passed: true }),
    DiscussionThreadModel.countDocuments(),
    DiscussionCommentModel.countDocuments(),
    CertificateModel.countDocuments(),
    CertificateModel.find()
      .sort({ issuedAt: -1 })
      .limit(8)
      .lean<RecentCertificate[]>(),
  ]);

  const unpublishedCourses = Math.max(totalCourses - publishedCourses, 0);
  const quizPassRate =
    quizAttempts > 0 ? (passedQuizAttempts / quizAttempts) * 100 : 0;
  const lessonCompletionRate =
    lessonProgress > 0 ? (completedLessonProgress / lessonProgress) * 100 : 0;
  const certificateRate =
    completedEnrollments > 0
      ? (issuedCertificates / completedEnrollments) * 100
      : 0;

  return {
    totalUsers,
    totalLearners,
    totalInstructors,
    learnerProfiles,
    instructorProfiles,
    totalCourses,
    publishedCourses,
    unpublishedCourses,
    totalModules,
    totalLessons,
    previewLessons,
    totalQuizzes,
    totalQuestions,
    totalEnrollments,
    completedEnrollments,
    lessonProgress,
    completedLessonProgress,
    quizAttempts,
    passedQuizAttempts,
    discussionThreads,
    discussionComments,
    issuedCertificates,
    recentCertificates,
    quizPassRate,
    lessonCompletionRate,
    certificateRate,
  };
}

function StatCard({ stat }: { stat: StatCard }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
          <p className="mt-2 text-sm text-gray-500">{stat.helper}</p>
        </div>
        <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
          {stat.icon}
        </div>
      </div>
    </article>
  );
}

export default async function AdminDashboard() {
  await myAdmin();
  const analytics = await getAdminAnalytics();

  const primaryStats: StatCard[] = [
    {
      label: "Total Users",
      value: formatNumber(analytics.totalUsers),
      helper: "All registered accounts",
      icon: <FaUsers className="h-5 w-5" />,
    },
    {
      label: "Learners",
      value: formatNumber(analytics.totalLearners),
      helper: `${formatNumber(analytics.learnerProfiles)} learner profiles`,
      icon: <FaUserGraduate className="h-5 w-5" />,
    },
    {
      label: "Instructors",
      value: formatNumber(analytics.totalInstructors),
      helper: `${formatNumber(analytics.instructorProfiles)} instructor profiles`,
      icon: <FaChalkboardTeacher className="h-5 w-5" />,
    },
    {
      label: "Issued Certificates",
      value: formatNumber(analytics.issuedCertificates),
      helper: `${formatPercent(analytics.certificateRate)} of completed enrollments`,
      icon: <FaCertificate className="h-5 w-5" />,
    },
  ];

  const contentStats: StatCard[] = [
    {
      label: "Courses",
      value: formatNumber(analytics.totalCourses),
      helper: `${formatNumber(analytics.publishedCourses)} published, ${formatNumber(
        analytics.unpublishedCourses,
      )} draft`,
      icon: <FaBook className="h-5 w-5" />,
    },
    {
      label: "Modules",
      value: formatNumber(analytics.totalModules),
      helper: "Across every course",
      icon: <FaLayerGroup className="h-5 w-5" />,
    },
    {
      label: "Lessons",
      value: formatNumber(analytics.totalLessons),
      helper: `total ${formatNumber(analytics.totalLessons)} lessons`,
      icon: <FaClipboardCheck className="h-5 w-5" />,
    },
    {
      label: "Quiz Questions",
      value: formatNumber(analytics.totalQuestions),
      helper: `${formatNumber(analytics.totalQuizzes)} quizzes created`,
      icon: <FaQuestionCircle className="h-5 w-5" />,
    },
  ];

  return (
    <main className="w-full self-start py-6">
      <section className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Admin Analytics Dashboard
            </h1>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">
              {formatNumber(analytics.totalEnrollments)}
            </span>{" "}
            total enrollments
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {primaryStats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {contentStats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FaCertificate className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recently Issued Certificates
              </h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
              <FaRegClock className="h-4 w-4" />
              Latest 8 records
            </div>
          </div>

          {analytics.recentCertificates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              No certificates have been issued yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="border-b border-gray-200 px-3 py-3 font-medium">
                      Certificate
                    </th>
                    <th className="border-b border-gray-200 px-3 py-3 font-medium">
                      Learner
                    </th>
                    <th className="border-b border-gray-200 px-3 py-3 font-medium">
                      Course
                    </th>
                    <th className="border-b border-gray-200 px-3 py-3 font-medium">
                      Issued
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentCertificates.map((certificate) => (
                    <tr key={String(certificate._id)} className="text-gray-700">
                      <td className="border-b border-gray-100 px-3 py-3">
                        <div className="font-medium text-gray-900">
                          {certificate.certId}
                        </div>
                      </td>
                      <td className="border-b border-gray-100 px-3 py-3">
                        {certificate.learnerNameSnapshot ?? "Learner"}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-3">
                        {certificate.courseTitleSnapshot ?? "Course"}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-3">
                        {formatDate(certificate.issuedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
