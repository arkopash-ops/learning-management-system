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

type ResourceType = "pdf" | "file" | "link";

interface LessonResource {
  type: ResourceType;
  label: string;
  url: string;
  publicId: string;
}

interface LessonItem {
  _id: string;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  videoPublicId?: string;
  videoDurationSec?: number;
  readingContent?: string;
  resources?: LessonResource[];
  isPreview?: boolean;
}

interface LessonFormState {
  title: string;
  description: string;
  order: string;
  readingContent: string;
  isPreview: boolean;
  videoUrl: string;
  videoPublicId: string;
  videoDurationSec: string;
}

interface ResourceFormState {
  type: ResourceType;
  label: string;
  url: string;
  publicId: string;
  file: File | null;
}

interface LessonErrors {
  title?: string;
  description?: string;
  order?: string;
  video?: string;
  resources?: string;
}

interface UploadedFile {
  url: string;
  public_id: string;
  duration: number | null;
}

const emptyForm: LessonFormState = {
  title: "",
  description: "",
  order: "1",
  readingContent: "",
  isPreview: false,
  videoUrl: "",
  videoPublicId: "",
  videoDurationSec: "0",
};

const emptyResource: ResourceFormState = {
  type: "link",
  label: "",
  url: "",
  publicId: "",
  file: null,
};

const getNextOrder = (items: LessonItem[]) =>
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

const uploadFile = async (file: File): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(getErrorMessage(data, "Upload failed"));
  }

  return data as UploadedFile;
};

export default function Lessons() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const moduleId = searchParams.get("moduleId") ?? "";
  const moduleTitle = searchParams.get("moduleTitle") ?? "Selected module";
  const courseId = searchParams.get("courseId") ?? "";
  const courseTitle = searchParams.get("courseTitle") ?? "Selected course";

  const moduleHref = courseId
    ? `/module?courseId=${courseId}&courseTitle=${encodeURIComponent(courseTitle)}`
    : "/module";

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [form, setForm] = useState<LessonFormState>(emptyForm);
  const [resources, setResources] = useState<ResourceFormState[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<LessonErrors>({});
  const [loading, setLoading] = useState(Boolean(moduleId));
  const [saving, setSaving] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const nextOrder = useMemo(() => getNextOrder(lessons), [lessons]);

  useEffect(() => {
    if (!moduleId) return;

    const loadLessons = async () => {
      try {
        const res = await fetch(`/api/modules/${moduleId}/lessons`);
        const data = await res.json();

        if (!res.ok) {
          showToast(getErrorMessage(data, "Unable to load lessons"), "error");
          return;
        }

        const loadedLessons = Array.isArray(data.lessons) ? data.lessons : [];
        setLessons(loadedLessons);
        setForm((current) =>
          current.order
            ? current
            : { ...current, order: String(getNextOrder(loadedLessons)) },
        );
      } catch {
        showToast("Something went wrong while loading lessons", "error");
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [moduleId, showToast]);

  const validateForm = () => {
    const nextErrors: LessonErrors = {};
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

    const incompleteResource = resources.some((resource) => {
      if (!resource.label.trim()) return true;
      if (resource.type === "link") return !resource.url.trim();
      return !resource.file && !resource.url.trim();
    });

    if (incompleteResource) {
      nextErrors.resources = "Complete every resource label and file or link.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateForm = (
    field: keyof LessonFormState,
    value: string | boolean,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateResource = (
    index: number,
    field: keyof ResourceFormState,
    value: string | File | null,
  ) => {
    setResources((current) =>
      current.map((resource, resourceIndex) =>
        resourceIndex === index ? { ...resource, [field]: value } : resource,
      ),
    );
    setErrors((current) => ({ ...current, resources: undefined }));
  };

  const addResource = () => {
    setResources((current) => [...current, { ...emptyResource }]);
  };

  const removeResource = (index: number) => {
    setResources((current) =>
      current.filter((_, resourceIndex) => resourceIndex !== index),
    );
  };

  const resetForm = () => {
    setForm({ ...emptyForm, order: String(nextOrder) });
    setResources([]);
    setVideoFile(null);
    setErrors({});
    setEditingLessonId(null);
  };

  const handleEdit = (lesson: LessonItem) => {
    setEditingLessonId(lesson._id);
    setForm({
      title: lesson.title,
      description: lesson.description ?? "",
      order: String(lesson.order),
      readingContent: lesson.readingContent ?? "",
      isPreview: Boolean(lesson.isPreview),
      videoUrl: lesson.videoUrl ?? "",
      videoPublicId: lesson.videoPublicId ?? "",
      videoDurationSec: String(lesson.videoDurationSec ?? 0),
    });
    setResources(
      lesson.resources?.map((resource) => ({
        type: resource.type,
        label: resource.label,
        url: resource.url,
        publicId: resource.publicId,
        file: null,
      })) ?? [],
    );
    setVideoFile(null);
    setErrors({});
  };

  const buildResourcesPayload = async () => {
    const uploadedResources = await Promise.all(
      resources.map(async (resource) => {
        if (resource.type === "link") {
          return {
            type: resource.type,
            label: resource.label.trim(),
            url: resource.url.trim(),
            publicId: "",
          };
        }

        if (resource.file) {
          const uploaded = await uploadFile(resource.file);

          return {
            type: resource.type,
            label: resource.label.trim(),
            url: uploaded.url,
            publicId: uploaded.public_id,
          };
        }

        return {
          type: resource.type,
          label: resource.label.trim(),
          url: resource.url.trim(),
          publicId: resource.publicId,
        };
      }),
    );

    return uploadedResources.filter((resource) => resource.label);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!moduleId) {
      showToast("Select a module before creating lessons", "error");
      return;
    }

    if (!validateForm()) return;

    setSaving(true);

    try {
      const uploadedVideo = videoFile ? await uploadFile(videoFile) : null;
      const lessonResources = await buildResourcesPayload();

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        order: Number(form.order),
        videoUrl: uploadedVideo?.url ?? form.videoUrl,
        videoPublicId: uploadedVideo?.public_id ?? form.videoPublicId,
        videoDurationSec:
          uploadedVideo?.duration ?? (Number(form.videoDurationSec) || 0),
        readingContent: form.readingContent.trim(),
        resources: lessonResources,
        isPreview: form.isPreview,
      };

      const res = await fetch(
        editingLessonId
          ? `/api/lesson/${editingLessonId}`
          : `/api/modules/${moduleId}/lessons`,
        {
          method: editingLessonId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        showToast(
          getErrorMessage(
            data,
            editingLessonId ? "Lesson update failed" : "Lesson creation failed",
          ),
          "error",
        );
        return;
      }

      const savedLesson = data.lesson as LessonItem;

      setLessons((current) => {
        const nextLessons = editingLessonId
          ? current.map((lesson) =>
              lesson._id === editingLessonId ? savedLesson : lesson,
            )
          : [...current, savedLesson];

        return nextLessons.sort((a, b) => a.order - b.order);
      });

      resetForm();
      showToast(
        editingLessonId
          ? "Lesson updated successfully"
          : "Lesson created successfully",
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving lesson",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    const shouldDelete = window.confirm("Delete this lesson permanently?");
    if (!shouldDelete) return;

    setActiveLessonId(lessonId);

    try {
      const res = await fetch(`/api/lesson/${lessonId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(getErrorMessage(data, "Lesson delete failed"), "error");
        return;
      }

      setLessons((current) =>
        current.filter((lesson) => lesson._id !== lessonId),
      );

      if (editingLessonId === lessonId) {
        resetForm();
      }

      showToast("Lesson deleted successfully", "success");
    } catch {
      showToast("Something went wrong while deleting lesson", "error");
    } finally {
      setActiveLessonId(null);
    }
  };

  if (!moduleId) {
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
              Select a module first
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="w-full self-start p-3">
          <section className="w-full rounded-xl border bg-white p-6 shadow-md">
            <p className="text-sm text-gray-600">Loading lessons...</p>
          </section>
        </main>
      }
    >
      <main className="w-full self-start p-3">
        <section className="w-full rounded-xl border bg-white p-6 shadow-md">
          <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Link
                href={moduleHref}
                className="mb-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                <FaArrowLeft className="h-3.5 w-3.5" />
                Modules
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                {moduleTitle}
              </h1>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Total Lessons:{" "}
              <span className="font-semibold text-gray-900">
                {lessons.length}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
            <form
              onSubmit={handleSubmit}
              className="h-fit rounded-lg border border-gray-200 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingLessonId ? "Edit lesson" : "Create lesson"}
                </h2>

                {editingLessonId && (
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
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    placeholder="Lesson title"
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
                    rows={3}
                    placeholder="Lesson overview..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.order}
                      onChange={(event) =>
                        updateForm("order", event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                    />
                    {errors.order && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.order}
                      </p>
                    )}
                  </div>

                  <label className="flex items-end gap-2 rounded-lg px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isPreview}
                      onChange={(event) =>
                        updateForm("isPreview", event.target.checked)
                      }
                      className="h-4 w-4"
                    />
                    Preview lesson
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Video
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(event) =>
                      setVideoFile(event.target.files?.[0] ?? null)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1 file:text-sm file:text-white focus:border-black"
                  />
                  {(videoFile || form.videoUrl) && (
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {videoFile?.name || form.videoUrl}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Reading Content
                  </label>
                  <textarea
                    value={form.readingContent}
                    onChange={(event) =>
                      updateForm("readingContent", event.target.value)
                    }
                    rows={5}
                    placeholder="Lesson notes..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-gray-700">
                      Resources
                    </label>
                    <button
                      type="button"
                      onClick={addResource}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                    >
                      <FaPlus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>

                  {resources.map((resource, index) => (
                    <div
                      key={index}
                      className="space-y-3 rounded-lg border border-gray-200 p-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
                        <select
                          value={resource.type}
                          onChange={(event) =>
                            updateResource(
                              index,
                              "type",
                              event.target.value as ResourceType,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                        >
                          <option value="link">Link</option>
                          <option value="pdf">PDF</option>
                          <option value="file">File</option>
                        </select>
                        <input
                          value={resource.label}
                          onChange={(event) =>
                            updateResource(index, "label", event.target.value)
                          }
                          placeholder="Resource label"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={() => removeResource(index)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          Remove
                        </button>
                      </div>

                      {resource.type === "link" ? (
                        <input
                          value={resource.url}
                          onChange={(event) =>
                            updateResource(index, "url", event.target.value)
                          }
                          placeholder="https://example.com"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                        />
                      ) : (
                        <>
                          <input
                            type="file"
                            accept={
                              resource.type === "pdf" ? ".pdf" : undefined
                            }
                            onChange={(event) =>
                              updateResource(
                                index,
                                "file",
                                event.target.files?.[0] ?? null,
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1 file:text-sm file:text-white focus:border-black"
                          />
                          {(resource.file || resource.url) && (
                            <p className="truncate text-xs text-gray-500">
                              {resource.file?.name || resource.url}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  {errors.resources && (
                    <p className="text-xs text-red-600">{errors.resources}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editingLessonId ? (
                  <FaSave className="h-3.5 w-3.5" />
                ) : (
                  <FaPlus className="h-3.5 w-3.5" />
                )}
                {saving
                  ? "Saving..."
                  : editingLessonId
                    ? "Save Lesson"
                    : "Create Lesson"}
              </button>
            </form>

            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Lessons</h2>
              </div>

              {loading ? (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Loading lessons...</p>
                </div>
              ) : lessons.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <h3 className="text-base font-semibold text-gray-900">
                    No lessons found
                  </h3>
                </div>
              ) : (
                <div className="grid gap-3">
                  {lessons.map((lesson) => (
                    <article
                      key={lesson._id}
                      className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-300"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              {lesson.order}. {lesson.title}
                            </h3>
                            {lesson.isPreview && (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                Preview
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {lesson.description || "No description added."}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                            <span>
                              {lesson.videoUrl ? "Video added" : "No video"}
                            </span>
                            <span>
                              {lesson.resources?.length ?? 0} resources
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(lesson)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                          >
                            <FaEdit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(lesson._id)}
                            disabled={activeLessonId === lesson._id}
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
    </Suspense>
  );
}
