import type { LearnerModule } from "./types";
import {
  getCourseContent,
  getCourseOverview,
  getEnrollmentCourseId,
  getMyEnrollments,
} from "./courseData";
import { toLearnerModules, toSidebarModules } from "./courseMappers";

const getValidCourseModuleIds = (modules: LearnerModule[]) =>
  new Set(modules.map((moduleItem) => moduleItem._id));

const normalizeModuleIds = (
  moduleIds: unknown[] | undefined,
  validModuleIds: Set<string>,
) =>
  Array.from(
    new Set(
      (moduleIds ?? [])
        .map(String)
        .filter((moduleId) => validModuleIds.has(moduleId)),
    ),
  );

const getQuizUnlockedModuleIds = (modules: LearnerModule[]) =>
  modules
    .filter((moduleItem) => {
      if (!moduleItem.quizId || moduleItem.lessons.length === 0) {
        return false;
      }

      return moduleItem.lessons.every(
        (lesson) => lesson.progress?.isCompleted,
      );
    })
    .map((moduleItem) => moduleItem._id);

export async function getCourseViewModel(courseId: string, token: string) {
  const [data, myEnrollmentsData, courseContentData] = await Promise.all([
    getCourseOverview(courseId),
    token ? getMyEnrollments(token) : Promise.resolve({ enrollments: [] }),
    token ? getCourseContent(courseId, token) : Promise.resolve(null),
  ]);

  if (!data) return null;

  const enrollment =
    courseContentData?.enrollment ??
    myEnrollmentsData.enrollments.find(
      (item) => getEnrollmentCourseId(item) === courseId,
    ) ??
    null;
  const contentModules = courseContentData?.modules ?? data.modules;
  const learnerModules = toLearnerModules(contentModules);
  const validModuleIds = getValidCourseModuleIds(learnerModules);
  const unlockedModules = normalizeModuleIds(
    enrollment?.unlockedModules,
    validModuleIds,
  );
  const completedModules = normalizeModuleIds(
    enrollment?.completedModules,
    validModuleIds,
  );
  const enrollmentProgressPercent =
    typeof enrollment?.progressPercent === "number"
      ? Math.round(enrollment.progressPercent)
      : 0;

  return {
    course: data.course,
    instructorProfile: data.instructorProfile,
    publicModules: data.modules,
    isEnrolled: enrollment !== null,
    unlockedModules,
    completedModules,
    learnerModules,
    sidebarModules: toSidebarModules(contentModules),
    quizUnlockedModules: getQuizUnlockedModuleIds(learnerModules),
    progressPercent: enrollmentProgressPercent,
  };
}

export const hasLesson = (modules: LearnerModule[], lessonId: string) =>
  modules.some((moduleItem) =>
    moduleItem.lessons.some((lesson) => lesson._id === lessonId),
  );
