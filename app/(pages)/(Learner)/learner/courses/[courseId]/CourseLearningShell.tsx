"use client";

import { useRouter } from "next/navigation";
import CourseSidebar, {
  type SidebarModule,
} from "@/app/components/CourseSidebar/CourseSidebar";
import LessonContent from "./LessonContent";
import LearnerQuizPanel from "./LearnerQuizPanel";
import type { LearnerModule } from "./types";

interface CourseLearningShellProps {
  courseId: string;
  courseTitle: string;
  sidebarModules: SidebarModule[];
  learnerModules: LearnerModule[];
  unlockedModules: string[];
  completedModules: string[];
  quizUnlockedModules: string[];
  progressPercent: number;
  initialLessonId?: string;
  selectedQuizModuleId?: string;
  children: React.ReactNode;
}

export default function CourseLearningShell({
  courseId,
  courseTitle,
  sidebarModules,
  learnerModules,
  unlockedModules,
  completedModules,
  quizUnlockedModules,
  progressPercent,
  initialLessonId,
  selectedQuizModuleId,
  children,
}: CourseLearningShellProps) {
  const router = useRouter();

  const handleLessonSelect = (lessonId: string) => {
    router.push(`/learner/courses/${courseId}/lessons/${lessonId}`);
  };

  const handleQuizSelect = (moduleId: string) => {
    if (!quizUnlockedModules.includes(moduleId)) return;

    router.push(`/learner/courses/${courseId}?quizModuleId=${moduleId}`);
  };

  const selectedQuizModule = learnerModules.find(
    (moduleItem) =>
      moduleItem._id === selectedQuizModuleId && moduleItem.quizId,
  );
  const isSelectedQuizUnlocked = selectedQuizModule
    ? quizUnlockedModules.includes(selectedQuizModule._id)
    : false;

  return (
    <div className="flex w-full gap-6 items-start py-3">
      <div className="sticky top-4 w-72 shrink-0 self-start">
        <CourseSidebar
          courseTitle={courseTitle}
          modules={sidebarModules}
          unlockedModules={unlockedModules}
          completedModules={completedModules}
          quizUnlockedModules={quizUnlockedModules}
          progressPercent={progressPercent}
          currentLessonId={initialLessonId}
          currentQuizModuleId={selectedQuizModule?._id}
          onLessonSelect={handleLessonSelect}
          onQuizSelect={handleQuizSelect}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="w-full space-y-6 self-start">
          {!initialLessonId && !selectedQuizModuleId && children}
          {initialLessonId && (
            <div className="scroll-mt-20">
              <LessonContent
                modules={learnerModules}
                unlockedModules={unlockedModules}
                selectedLessonId={initialLessonId}
              />
            </div>
          )}
          {!initialLessonId && selectedQuizModuleId && (
            <div className="scroll-mt-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              {selectedQuizModule && isSelectedQuizUnlocked ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Module Quiz
                    </p>
                    <h2 className="mt-0.5 text-xl font-semibold text-gray-900">
                      {selectedQuizModule.title}
                    </h2>
                  </div>
                  <LearnerQuizPanel moduleId={selectedQuizModule._id} />
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600">
                  Complete all lessons in this module to unlock the quiz.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
