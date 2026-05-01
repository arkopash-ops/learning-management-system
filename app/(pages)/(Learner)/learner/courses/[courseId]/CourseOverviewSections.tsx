import Link from "next/link";
import CourseHeader from "./CourseHeader";
import InstructorCard from "./InstructorCard";
import type { CourseDetail, InstructorProfile } from "./types";
import { FaArrowLeft } from "react-icons/fa";

interface CourseOverviewSectionsProps {
  course: CourseDetail;
  instructorProfile: InstructorProfile | null;
  isEnrolled: boolean;
}

export default function CourseOverviewSections({
  course,
  instructorProfile,
  isEnrolled,
}: CourseOverviewSectionsProps) {
  return (
    <>
      <Link
        href="/learner/dashboard"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 mt-3"
      >
        <FaArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <CourseHeader course={course} isEnrolled={isEnrolled} />

      <InstructorCard
        instructor={course.instructorId}
        profile={instructorProfile}
      />
    </>
  );
}
