"use client";

import { useRouter } from "next/navigation";
import CourseSidebar, {
  type SidebarModule,
} from "@/app/components/CourseSidebar/CourseSidebar";
import LessonContent from "./LessonContent";
import type { LearnerModule } from "./types";

interface CourseLearningShellProps {
  courseId: string;
  courseTitle: string;
  sidebarModules: SidebarModule[];
  learnerModules: LearnerModule[];
  unlockedModules: string[];
  completedModules: string[];
  progressPercent: number;
  initialLessonId?: string;
  children: React.ReactNode;
}

export default function CourseLearningShell({
  courseId,
  courseTitle,
  sidebarModules,
  learnerModules,
  unlockedModules,
  completedModules,
  progressPercent,
  initialLessonId,
  children,
}: CourseLearningShellProps) {
  const router = useRouter();

  const handleLessonSelect = (lessonId: string) => {
    router.push(`/learner/courses/${courseId}/lessons/${lessonId}`);
  };

  return (
    <div className="flex w-full gap-6 items-start py-3">
      <div className="sticky top-4 w-72 shrink-0 self-start">
        <CourseSidebar
          courseTitle={courseTitle}
          modules={sidebarModules}
          unlockedModules={unlockedModules}
          completedModules={completedModules}
          progressPercent={progressPercent}
          currentLessonId={initialLessonId}
          onLessonSelect={handleLessonSelect}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="w-full space-y-6 self-start">
          {!initialLessonId && children}
          {initialLessonId && (
            <div className="scroll-mt-20">
              <LessonContent
                modules={learnerModules}
                unlockedModules={unlockedModules}
                selectedLessonId={initialLessonId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
