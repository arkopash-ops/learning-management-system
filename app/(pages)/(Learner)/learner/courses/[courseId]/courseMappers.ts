import type { SidebarModule } from "@/app/components/CourseSidebar/CourseSidebar";
import type { LearnerModule, ModuleItem } from "./types";

export const toSidebarModules = (modules: ModuleItem[]): SidebarModule[] =>
  modules.map((mod) => ({
    _id: String(mod._id),
    title: mod.title,
    order: mod.order,
    lessons: mod.lessons.map((lesson) => ({
      _id: String(lesson._id),
      title: lesson.title,
      order: lesson.order,
    })),
  }));

export const toLearnerModules = (modules: ModuleItem[]): LearnerModule[] =>
  modules.map((mod) => ({
    _id: String(mod._id),
    title: mod.title,
    description: mod.description,
    order: mod.order,
    quizId: mod.quizId ? String(mod.quizId) : null,
    lessons: mod.lessons.map((lesson) => ({
      _id: String(lesson._id),
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      videoUrl: lesson.videoUrl,
      videoDurationSec: lesson.videoDurationSec,
      readingContent: lesson.readingContent,
      resources: lesson.resources,
      progress: lesson.progress,
    })),
  }));

export const getLessonProgressPercent = (modules: LearnerModule[]) => {
  const totalLessonCount = modules.reduce(
    (total, mod) => total + mod.lessons.length,
    0,
  );
  const completedLessonCount = modules.reduce(
    (total, mod) =>
      total +
      mod.lessons.filter((lesson) => lesson.progress?.isCompleted).length,
    0,
  );

  return totalLessonCount === 0
    ? 0
    : Math.round((completedLessonCount / totalLessonCount) * 100);
};
