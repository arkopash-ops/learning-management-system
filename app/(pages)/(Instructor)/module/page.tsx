"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FaArrowLeft,
  FaEdit,
  FaPlus,
  FaRegTrashAlt,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { useToast } from "@/app/components/(Toast)/ToastProvider";

interface ModuleItem {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  totalLessons?: number;
}

interface ModuleFormState {
  title: string;
  description: string;
  order: string;
}

interface ModuleErrors {
  title?: string;
  description?: string;
  order?: string;
}

const emptyForm: ModuleFormState = {
  title: "",
  description: "",
  order: "1",
};

const getNextOrder = (items: ModuleItem[]) =>
  items.length > 0
    ? Math.max(...items.map((item) => Number(item.order) || 0)) + 1
    : 1;

const getErrorMessage = (value: unknown, fallback: string) => {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return fallback;
};

function ModuleManager() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const courseId = searchParams.get("courseId") ?? "";
  const courseTitle = searchParams.get("courseTitle") ?? "Selected course";

  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [form, setForm] = useState<ModuleFormState>(emptyForm);
  const [errors, setErrors] = useState<ModuleErrors>({});
  const [loading, setLoading] = useState(Boolean(courseId));
  const [saving, setSaving] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const nextOrder = useMemo(() => getNextOrder(modules), [modules]);

  useEffect(() => {
    if (!courseId) {
      return;
    }

    const loadModules = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/modules`);
        const data = await res.json();

        if (!res.ok) {
          showToast(getErrorMessage(data, "Unable to load modules"), "error");
          return;
        }

        const loadedModules = Array.isArray(data.modules) ? data.modules : [];
        setModules(loadedModules);
        setForm((current) =>
          current.order
            ? current
            : { ...current, order: String(getNextOrder(loadedModules)) },
        );
      } catch {
        showToast("Something went wrong while loading modules", "error");
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [courseId, showToast]);

  const validateForm = () => {
    const nextErrors: ModuleErrors = {};
    const order = Number(form.order);

    if (form.title.trim().length < 3) {
      nextErrors.title = "Title must be at least 3 characters.";
    }

    if (
      form.description.trim().length > 0 &&
      form.description.trim().length < 5
    ) {
      nextErrors.description = "Description must be at least 5 characters.";
    }

    if (!Number.isInteger(order) || order < 1) {
      nextErrors.order = "Order must be a positive whole number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateForm = (field: keyof ModuleFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm, order: String(nextOrder) });
    setErrors({});
    setEditingModuleId(null);
  };

  const handleEdit = (module: ModuleItem) => {
    setEditingModuleId(module._id);
    setForm({
      title: module.title,
      description: module.description ?? "",
      order: String(module.order),
    });
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!courseId) {
      showToast("Select a course before creating modules", "error");
      return;
    }

    if (!validateForm()) return;

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      order: Number(form.order),
    };

    try {
      const res = await fetch(
        editingModuleId
          ? `/api/modules/${editingModuleId}`
          : `/api/courses/${courseId}/modules`,
        {
          method: editingModuleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        showToast(
          getErrorMessage(
            data,
            editingModuleId ? "Module update failed" : "Module creation failed",
          ),
          "error",
        );
        return;
      }

      const savedModule = (
        editingModuleId ? data.module : data.myModule
      ) as ModuleItem;

      setModules((current) => {
        const nextModules = editingModuleId
          ? current.map((item) =>
              item._id === editingModuleId ? savedModule : item,
            )
          : [...current, savedModule];

        return nextModules.sort((a, b) => a.order - b.order);
      });

      resetForm();
      showToast(
        editingModuleId
          ? "Module updated successfully"
          : "Module created successfully",
        "success",
      );
    } catch {
      showToast("Something went wrong while saving module", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (moduleId: string) => {
    const shouldDelete = window.confirm("Delete this module permanently?");
    if (!shouldDelete) return;

    setActiveModuleId(moduleId);

    try {
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(getErrorMessage(data, "Module delete failed"), "error");
        return;
      }

      setModules((current) => current.filter((item) => item._id !== moduleId));

      if (editingModuleId === moduleId) {
        resetForm();
      }

      showToast("Module deleted successfully", "success");
    } catch {
      showToast("Something went wrong while deleting module", "error");
    } finally {
      setActiveModuleId(null);
    }
  };

  if (!courseId) {
    return (
      <main className="w-full self-start p-3">
        <section className="w-full rounded-xl border bg-white p-6 shadow-md">
          <Link
            href="/course"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            <FaArrowLeft className="h-3.5 w-3.5" />
            Courses
          </Link>

          <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Select a course first
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Open modules from a course card to manage its module list.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="w-full self-start p-3">
      <section className="w-full rounded-xl border bg-white p-6 shadow-md">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/course"
              className="mb-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
            >
              <FaArrowLeft className="h-3.5 w-3.5" />
              Courses
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {courseTitle}
            </h1>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Total Modules:{" "}
            <span className="font-semibold text-gray-900">
              {modules.length}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-lg border border-gray-200 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingModuleId ? "Edit module" : "Create module"}
              </h2>

              {editingModuleId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                >
                  <FaTimes className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Module title"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  rows={5}
                  placeholder="Module overview..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(event) => updateForm("order", event.target.value)}
                  placeholder="1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                />
                {errors.order && (
                  <p className="mt-1 text-xs text-red-600">{errors.order}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingModuleId ? (
                <FaSave className="h-3.5 w-3.5" />
              ) : (
                <FaPlus className="h-3.5 w-3.5" />
              )}
              {saving
                ? "Saving..."
                : editingModuleId
                  ? "Save Module"
                  : "Create Module"}
            </button>
          </form>

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
            </div>

            {loading ? (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Loading modules...</p>
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <h3 className="text-base font-semibold text-gray-900">
                  No modules found
                </h3>
              </div>
            ) : (
              <div className="grid gap-3">
                {modules.map((module) => (
                  <article
                    key={module._id}
                    className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-300"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {module.order}
                            {". "}
                            {module.title}
                          </h3>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {module.description || "No description added."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>{module.totalLessons ?? 0} lessons</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(module)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          <FaEdit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(module._id)}
                          disabled={activeModuleId === module._id}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FaRegTrashAlt className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Modules() {
  return (
    <Suspense
      fallback={
        <main className="w-full self-start p-3">
          <section className="w-full rounded-xl border bg-white p-6 shadow-md">
            <p className="text-sm text-gray-600">Loading modules...</p>
          </section>
        </main>
      }
    >
      <ModuleManager />
    </Suspense>
  );
}
