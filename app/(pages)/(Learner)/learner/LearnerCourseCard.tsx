import Link from "next/link";
import { FiCheckCircle, FiChevronRight } from "react-icons/fi";

export type LearnerCourseStatus = "not-enrolled" | "enrolled" | "completed";

export interface LearnerCourseCardItem {
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

interface LearnerCourseCardProps {
  course: LearnerCourseCardItem;
  status: LearnerCourseStatus;
}

export default function LearnerCourseCard({
  course,
  status,
}: LearnerCourseCardProps) {
  const isEnrolled = status !== "not-enrolled";
  const isCompleted = status === "completed";
  const statusLabel = isCompleted
    ? "Completed"
    : isEnrolled
      ? "Enrolled"
      : "Not enrolled";

  return (
    <Link
      href={`/learner/courses/${course._id}`}
      className="group flex min-h-56 flex-col rounded-lg border border-gray-200 p-5 shadow-sm transition-all duration-150 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-black">
            {course.title}
          </h2>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              isCompleted
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : isEnrolled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            {isEnrolled && <FiCheckCircle className="h-3.5 w-3.5" />}
            {statusLabel}
          </span>
        </div>

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
        <span className="inline-flex items-center gap-1 font-medium text-gray-900">
          View course
          <FiChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
