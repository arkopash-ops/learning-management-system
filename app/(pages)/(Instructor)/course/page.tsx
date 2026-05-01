"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaLayerGroup,
  FaPlus,
  FaRegTrashAlt,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { useToast } from "@/app/components/(Toast)/ToastProvider";

interface CourseItem {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  isPublished: boolean;
  totalModules?: number;
  totalLessons?: number;
  instructorId?: {
    name?: string;
  };
}

interface CourseFormState {
  title: string;
  description: string;
  tags: string;
}

interface CourseErrors {
  title?: string;
  description?: string;
  tags?: string;
}

const emptyForm: CourseFormState = {
  title: "",
  description: "",
  tags: "",
};

const splitTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

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

export default function Course() {
  const { showToast } = useToast();

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [form, setForm] = useState<CourseFormState>(emptyForm);
  const [errors, setErrors] = useState<CourseErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const tagPreview = useMemo(() => splitTags(form.tags), [form.tags]);
  const editingCourse = courses.find(
    (course) => course._id === editingCourseId,
  );

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses/my");
        const data = await res.json();

        if (!res.ok) {
          showToast(getErrorMessage(data, "Unable to load courses"), "error");
          return;
        }

        setCourses(Array.isArray(data.courses) ? data.courses : []);
      } catch {
        showToast("Something went wrong while loading courses", "error");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [showToast]);

  const validateForm = () => {
    const nextErrors: CourseErrors = {};
    const tags = splitTags(form.tags);

    if (form.title.trim().length < 3) {
      nextErrors.title = "Title must be at least 3 characters.";
    }

    if (form.description.trim().length < 10) {
      nextErrors.description = "Description must be at least 10 characters.";
    }

    if (tags.length === 0) {
      nextErrors.tags = "Add at least one tag.";
    }

    if (tags.some((tag) => tag.length < 2)) {
      nextErrors.tags = "Every tag must be at least 2 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateForm = (field: keyof CourseFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setEditingCourseId(null);
  };

  const handleEdit = (course: CourseItem) => {
    setEditingCourseId(course._id);
    setForm({
      title: course.title,
      description: course.description ?? "",
      tags: course.tags?.join(", ") ?? "",
    });
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      tags: splitTags(form.tags),
      isPublished: editingCourse?.isPublished ?? false,
      totalModules: editingCourse?.totalModules ?? 0,
      totalLessons: editingCourse?.totalLessons ?? 0,
    };

    try {
      const res = await fetch(
        editingCourseId ? `/api/courses/${editingCourseId}` : "/api/courses",
        {
          method: editingCourseId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        showToast(
          getErrorMessage(
            data,
            editingCourseId ? "Course update failed" : "Course creation failed",
          ),
          "error",
        );
        return;
      }

      const savedCourse = data.course as CourseItem;

      setCourses((current) =>
        editingCourseId
          ? current.map((course) =>
              course._id === editingCourseId ? savedCourse : course,
            )
          : [savedCourse, ...current],
      );
      resetForm();
      showToast(
        editingCourseId
          ? "Course updated successfully"
          : "Course created successfully",
        "success",
      );
    } catch {
      showToast("Something went wrong while saving course", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (course: CourseItem) => {
    setActiveCourseId(course._id);

    try {
      const res = await fetch(`/api/courses/${course._id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(getErrorMessage(data, "Publish update failed"), "error");
        return;
      }

      const updatedCourse = data.course as CourseItem;

      setCourses((current) =>
        current.map((item) =>
          item._id === updatedCourse._id ? updatedCourse : item,
        ),
      );
      showToast(
        updatedCourse.isPublished ? "Course published" : "Course unpublished",
        "success",
      );
    } catch {
      showToast("Something went wrong while updating publish status", "error");
    } finally {
      setActiveCourseId(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    const shouldDelete = window.confirm("Delete this course permanently?");
    if (!shouldDelete) return;

    setActiveCourseId(courseId);

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(getErrorMessage(data, "Course delete failed"), "error");
        return;
      }

      setCourses((current) =>
        current.filter((course) => course._id !== courseId),
      );

      if (editingCourseId === courseId) {
        resetForm();
      }

      showToast("Course deleted successfully", "success");
    } catch {
      showToast("Something went wrong while deleting course", "error");
    } finally {
      setActiveCourseId(null);
    }
  };

  return (
    <main className="w-full self-start p-3">
      <section className="w-full rounded-xl border bg-white p-6 shadow-md">
        <div className="flex flex-col gap-2 border-b border-gray-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Course Management
            </h1>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Total Course:{" "}
            <span className="font-semibold text-gray-900">
              {courses.length}
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
                {editingCourseId ? "Edit course" : "Create course"}
              </h2>

              {editingCourseId && (
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
                  placeholder="Add cource title"
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
                  placeholder="A comprehensive course..."
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
                  Tags
                </label>
                <input
                  value={form.tags}
                  onChange={(event) => updateForm("tags", event.target.value)}
                  placeholder="cpp, oop, javascript"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                />
                {errors.tags && (
                  <p className="mt-1 text-xs text-red-600">{errors.tags}</p>
                )}

                {tagPreview.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tagPreview.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingCourseId ? (
                <FaSave className="h-3.5 w-3.5" />
              ) : (
                <FaPlus className="h-3.5 w-3.5" />
              )}
              {saving
                ? "Saving..."
                : editingCourseId
                  ? "Save Course"
                  : "Create Course"}
            </button>
          </form>

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Courses</h2>
            </div>

            {loading ? (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <h3 className="text-base font-semibold text-gray-900">
                  No courses found
                </h3>
              </div>
            ) : (
              <div className="grid gap-3">
                {courses.map((course) => (
                  <article
                    key={course._id}
                    className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-300"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {course.title}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              course.isPublished
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {course.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {course.description || "No description added."}
                        </p>

                        {course.instructorId?.name && (
                          <p className="mt-2 text-xs text-gray-500">
                            Instructor: {course.instructorId.name}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(course.tags?.length
                            ? course.tags
                            : ["untagged"]
                          ).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>{course.totalModules ?? 0} modules</span>
                          <span>{course.totalLessons ?? 0} lessons</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/module?courseId=${course._id}&courseTitle=${encodeURIComponent(course.title)}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          <FaLayerGroup className="h-3.5 w-3.5" />
                          Modules
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEdit(course)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                        >
                          <FaEdit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(course)}
                          disabled={activeCourseId === course._id}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {course.isPublished ? (
                            <FaEyeSlash className="h-3.5 w-3.5" />
                          ) : (
                            <FaEye className="h-3.5 w-3.5" />
                          )}
                          {course.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(course._id)}
                          disabled={activeCourseId === course._id}
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
