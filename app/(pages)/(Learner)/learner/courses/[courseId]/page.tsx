import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import CourseLearningShell from "./CourseLearningShell";
import CourseOverviewSections from "./CourseOverviewSections";
import PublicCurriculum from "./PublicCurriculum";
import { getCourseViewModel } from "./courseViewModel";

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const token = (await cookies()).get("token")?.value ?? "";
  const viewModel = await getCourseViewModel(courseId, token);

  if (!viewModel) notFound();

  const courseOverview = (
    <CourseOverviewSections
      course={viewModel.course}
      instructorProfile={viewModel.instructorProfile}
      isEnrolled={viewModel.isEnrolled}
    />
  );

  if (!viewModel.isEnrolled) {
    return (
      <div className="w-full space-y-6 self-start">
        {courseOverview}
        <PublicCurriculum modules={viewModel.publicModules} />
      </div>
    );
  }

  return (
    <CourseLearningShell
      courseId={courseId}
      courseTitle={viewModel.course.title}
      sidebarModules={viewModel.sidebarModules}
      learnerModules={viewModel.learnerModules}
      unlockedModules={viewModel.unlockedModules}
      completedModules={viewModel.completedModules}
      progressPercent={viewModel.progressPercent}
    >
      {courseOverview}
    </CourseLearningShell>
  );
}
