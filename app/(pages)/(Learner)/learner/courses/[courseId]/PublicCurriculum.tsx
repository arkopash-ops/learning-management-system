import type { ModuleItem } from "./types";

interface PublicCurriculumProps {
  modules: ModuleItem[];
}

export default function PublicCurriculum({ modules }: PublicCurriculumProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">
        Course Curriculum
      </h2>

      {modules.length === 0 ? (
        <p className="text-sm text-gray-500">No modules added yet.</p>
      ) : (
        <div className="space-y-4">
          {modules.map((moduleItem, moduleIndex) => (
            <div
              key={String(moduleItem._id)}
              className="rounded-xl border border-gray-200"
            >
              <div className="flex items-start justify-between gap-3 rounded-t-xl bg-gray-50 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Module {moduleIndex + 1}
                  </p>
                  <h3 className="mt-0.5 text-base font-semibold text-gray-900">
                    {moduleItem.title}
                  </h3>
                  {moduleItem.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {moduleItem.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {moduleItem.lessons.length} lesson
                  {moduleItem.lessons.length !== 1 ? "s" : ""}
                </span>
              </div>

              {moduleItem.lessons.length > 0 && (
                <ul className="divide-y divide-gray-100">
                  {moduleItem.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={String(lesson._id)}
                      className="flex items-start gap-3 px-5 py-3.5"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                        {lessonIndex + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="mt-0.5 text-xs leading-5 text-gray-500">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
