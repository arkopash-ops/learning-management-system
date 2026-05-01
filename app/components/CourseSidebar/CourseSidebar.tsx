"use client";

import { useState } from "react";
import { FiLock, FiCheck, FiChevronRight } from "react-icons/fi";

export interface SidebarLesson {
  _id: string;
  title: string;
  order: number;
}

export interface SidebarModule {
  _id: string;
  title: string;
  order: number;
  lessons: SidebarLesson[];
}

export interface CourseSidebarProps {
  courseTitle: string;
  modules: SidebarModule[];
  unlockedModules: string[];
  completedModules: string[];
  progressPercent: number;
  currentLessonId?: string;
  onLessonSelect?: (lessonId: string) => void;
}

export default function CourseSidebar({
  courseTitle,
  modules,
  unlockedModules,
  completedModules,
  progressPercent,
  currentLessonId,
  onLessonSelect,
}: CourseSidebarProps) {
  const validModuleIds = new Set(modules.map((mod) => mod._id));
  const normalizedUnlockedModules = Array.from(
    new Set(unlockedModules.filter((id) => validModuleIds.has(id))),
  );
  const normalizedCompletedModules = Array.from(
    new Set(completedModules.filter((id) => validModuleIds.has(id))),
  );
  const currentLessonModuleId = modules.find((mod) =>
    mod.lessons.some((lesson) => lesson._id === currentLessonId),
  )?._id;
  const firstUnlockedModuleId =
    modules.find((mod) => normalizedUnlockedModules.includes(mod._id))?._id ??
    modules[0]?._id;
  const initialOpenModuleId = currentLessonModuleId ?? firstUnlockedModuleId;
  const initialOpen = modules.reduce<Record<string, boolean>>((acc, mod) => {
    acc[mod._id] = mod._id === initialOpenModuleId;
    return acc;
  }, {});

  const [openModules, setOpenModules] = useState(initialOpen);

  const toggleModule = (id: string) =>
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));

  const clampedProgress = Math.min(100, Math.max(0, progressPercent));

  return (
    <aside className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
      <div className="border-b border-gray-200 px-5 py-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Enrolled Course
        </p>

        <h2 className="line-clamp-2 text-base font-semibold text-gray-900">
          {courseTitle}
        </h2>

        {/* Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-gray-500">Progress</span>
            <span className="font-semibold text-gray-900">
              {clampedProgress}%
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              style={{ width: `${clampedProgress}%` }}
              className="h-full rounded-full bg-gray-900 transition-all duration-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex gap-4 text-xs text-gray-500">
          <span>
            <span className="font-semibold text-gray-900">
              {normalizedCompletedModules.length}
            </span>
            /{modules.length} done
          </span>
          <span>
            <span className="font-semibold text-gray-900">
              {normalizedUnlockedModules.length}
            </span>{" "}
            unlocked
          </span>
        </div>
      </div>

      {/* Modules */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {modules.map((mod, idx) => {
          const isUnlocked = normalizedUnlockedModules.includes(mod._id);
          const isCompleted = normalizedCompletedModules.includes(mod._id);
          const isOpen =
            openModules[mod._id] || mod._id === currentLessonModuleId;

          return (
            <div
              key={mod._id}
              className="overflow-hidden rounded-xl border border-transparent"
            >
              <button
                onClick={() => toggleModule(mod._id)}
                disabled={!isUnlocked}
                className={`
                  flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm
                  transition
                  ${isUnlocked ? "hover:bg-gray-50" : "cursor-not-allowed opacity-55"}
                  ${isOpen ? "bg-gray-50" : ""}
                `}
              >
                <span
                  className={`
                    flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold
                    ${isCompleted ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}
                  `}
                >
                  {isCompleted ? <FiCheck size={12} /> : idx + 1}
                </span>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {mod.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mod.lessons.length} lessons
                  </p>
                </div>

                <div className="flex items-center text-gray-400">
                  {!isUnlocked && <FiLock size={14} />}
                  {isUnlocked && (
                    <FiChevronRight
                      size={16}
                      className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />
                  )}
                </div>
              </button>

              {/* Lessons */}
              {isUnlocked && isOpen && (
                <ul className="mt-1 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  {mod.lessons.map((lesson, i) => {
                    const isCurrent = currentLessonId === lesson._id;

                    return (
                      <li key={lesson._id}>
                        <button
                          type="button"
                          onClick={() => onLessonSelect?.(lesson._id)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition hover:bg-white ${
                            isCurrent ? "bg-white text-gray-900" : ""
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ${
                              isCurrent
                                ? "bg-gray-900 text-white ring-gray-900"
                                : "bg-white text-gray-500 ring-gray-200"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span
                            className={`truncate ${
                              isCurrent
                                ? "font-semibold text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {lesson.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        {modules.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-500">
            No modules yet.
          </p>
        )}
      </nav>

      {/* Footer */}
      {clampedProgress === 100 && (
        <div className="flex items-center justify-center gap-2 border-t border-gray-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          <FiCheck className="h-4 w-4" />
          <span className="text-sm font-semibold">
            Course Completed
          </span>
        </div>
      )}
    </aside>
  );
}
