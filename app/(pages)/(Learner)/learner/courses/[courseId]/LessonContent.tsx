"use client";

import LessonCard from "./LessonCard";
import type { LearnerModule } from "./types";
import { FiLock } from "react-icons/fi";

interface LessonContentProps {
  modules: LearnerModule[];
  unlockedModules: string[];
  selectedLessonId?: string;
}

export default function LessonContent({
  modules,
  unlockedModules,
  selectedLessonId,
}: LessonContentProps) {
  const selectedModule = modules.find((moduleItem) =>
    moduleItem.lessons.some((lesson) => lesson._id === selectedLessonId),
  );
  const selectedLesson = selectedModule?.lessons.find(
    (lesson) => lesson._id === selectedLessonId,
  );
  const isSelectedModuleUnlocked = selectedModule
    ? unlockedModules.includes(selectedModule._id)
    : false;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">
        Current Lesson
      </h2>

      {modules.length === 0 ? (
        <p className="text-sm text-gray-500">No modules added yet.</p>
      ) : selectedLesson && selectedModule && isSelectedModuleUnlocked ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Module {selectedModule.order}
              </p>
              <h3 className="mt-0.5 text-base font-semibold text-gray-900">
                {selectedModule.title}
              </h3>
              {selectedModule.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {selectedModule.description}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <LessonCard
              key={selectedLesson._id}
              lesson={selectedLesson}
              isUnlocked
            />
          </div>
        </div>
      ) : selectedLesson && selectedModule ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-gray-600">
            <FiLock className="h-4 w-4" />
            Complete the previous module to unlock this lesson.
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500">
          Select a lesson from the sidebar.
        </div>
      )}
    </section>
  );
}
