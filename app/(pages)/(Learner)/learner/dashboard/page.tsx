import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import LearnerModel from "@/models/learner.model";
import { EducationLevel } from "@/shared/enum/EducationLevel.enum";
import { UserRole } from "@/shared/enum/UserRole.enum";
import "@/models/user.model";

interface LearnerDashboardProfile {
  userId: {
    name: string;
    email: string;
  };
  bio?: string;
  dateOfBirth?: Date | string | null;
  educationLevel?: EducationLevel;
  interests?: string[];
}

interface CourseItem {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  totalModules?: number;
  totalLessons?: number;
  instructorId?: {
    name?: string;
  };
}

const isProfileIncomplete = (profile: LearnerDashboardProfile) =>
  !profile.bio ||
  !profile.dateOfBirth ||
  !profile.educationLevel ||
  !profile.interests ||
  profile.interests.length === 0;

const getCourses = async () => {
  const res = await fetch("http://localhost:3000/api/courses/", {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as { courses?: CourseItem[] };
  return Array.isArray(data.courses) ? data.courses : [];
};

export default async function LearnerDashboard() {
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
  })
    .populate("userId", "name email")
    .lean<LearnerDashboardProfile | null>();

  if (!learner || isProfileIncomplete(learner)) {
    redirect("/learner/profile?completeProfile=1");
  }

  const courses = await getCourses();

  return (
    <section className="w-full self-start mt-3 rounded-xl border bg-white p-6 shadow-md">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-end md:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
        <p className="mt-1 text-sm text-gray-600">
          Explore courses and continue building your skills.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-600">No published courses found.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course._id}
              href={`/learner/courses/${course._id}`}
              className="group flex min-h-56 flex-col rounded-lg border border-gray-200 p-5 shadow-sm transition-all duration-150 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-black transition-colors">
                  {course.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  By {course.instructorId?.name ?? "Instructor"}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                  {course.description || "No description added yet."}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {course.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-600">
                <span>{course.totalModules ?? 0} modules</span>
                <span className="inline-flex items-center gap-1 text-gray-900 font-medium">
                  View course
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
