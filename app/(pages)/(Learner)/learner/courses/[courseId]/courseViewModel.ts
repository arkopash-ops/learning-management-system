import type { LearnerModule } from "./types";
import {
  getCourseContent,
  getCourseOverview,
  getEnrollmentCourseId,
  getMyEnrollments,
} from "./courseData";
import {
  getLessonProgressPercent,
  toLearnerModules,
  toSidebarModules,
} from "./courseMappers";

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

  return {
    course: data.course,
    instructorProfile: data.instructorProfile,
    publicModules: data.modules,
    isEnrolled: enrollment !== null,
    unlockedModules,
    completedModules,
    learnerModules,
    sidebarModules: toSidebarModules(contentModules),
    progressPercent: getLessonProgressPercent(learnerModules),
  };
}

export const hasLesson = (modules: LearnerModule[], lessonId: string) =>
  modules.some((moduleItem) =>
    moduleItem.lessons.some((lesson) => lesson._id === lessonId),
  );
