import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import CourseLearningShell from "../../CourseLearningShell";
import { getCourseViewModel, hasLesson } from "../../courseViewModel";

export default async function LearnerLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const token = (await cookies()).get("token")?.value ?? "";
  const viewModel = await getCourseViewModel(courseId, token);

  if (!viewModel) notFound();

  if (!viewModel.isEnrolled) {
    redirect(`/learner/courses/${courseId}`);
  }

  if (!hasLesson(viewModel.learnerModules, lessonId)) {
    notFound();
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
      initialLessonId={lessonId}
    >
      {null}
    </CourseLearningShell>
  );
}
