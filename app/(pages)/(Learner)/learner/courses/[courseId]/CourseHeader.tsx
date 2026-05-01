import EnrollButton from "./EnrollButton";
import type { CourseDetail } from "./types";
import { FaCheck } from "react-icons/fa";
import { HiOutlineCollection, HiOutlineDocumentText } from "react-icons/hi";

interface CourseHeaderProps {
  course: CourseDetail;
  isEnrolled: boolean;
}

export default function CourseHeader({
  course,
  isEnrolled,
}: CourseHeaderProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
      {course.tags && course.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>

      {course.description && (
        <p className="mt-3 text-base leading-7 text-gray-600">
          {course.description}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <HiOutlineCollection className="h-4 w-4 text-gray-400" />
          {course.totalModules} modules
        </span>
        <span className="inline-flex items-center gap-1.5">
          <HiOutlineDocumentText className="h-4 w-4 text-gray-400" />
          {course.totalLessons} lessons
        </span>
      </div>

      {!isEnrolled && <EnrollButton courseId={course._id} />}

      {isEnrolled && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-emerald-700 font-medium">
          <FaCheck className="h-5 w-5 text-emerald-500" />
          You are enrolled in this course
        </div>
      )}
    </section>
  );
}
