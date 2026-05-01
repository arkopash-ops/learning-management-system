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

interface QuizItem {
  _id: string;
  title: string;
  passPercentage: number;
  timeLimitSec: number;
}

interface QuestionOption {
  optionId: string;
  text: string;
}

interface QuestionItem {
  _id: string;
  questionText: string;
  options: QuestionOption[];
  correctOptionId?: string;
}

interface QuizFormState {
  title: string;
  passPercentage: string;
  timeLimitSec: string;
}

interface QuestionFormState {
  questionText: string;
  correctOptionId: string;
  options: QuestionOption[];
}

interface FormErrors {
  quiz?: string;
  question?: string;
}

const emptyQuizForm: QuizFormState = {
  title: "",
  passPercentage: "70",
  timeLimitSec: "600",
};

const emptyQuestionForm: QuestionFormState = {
  questionText: "",
  correctOptionId: "A",
  options: [
    { optionId: "A", text: "" },
    { optionId: "B", text: "" },
    { optionId: "C", text: "" },
    { optionId: "D", text: "" },
  ],
};

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

function QuizManager() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const moduleId = searchParams.get("moduleId") ?? "";
  const moduleTitle = searchParams.get("moduleTitle") ?? "Selected module";
  const courseId = searchParams.get("courseId") ?? "";
  const courseTitle = searchParams.get("courseTitle") ?? "Selected course";
  const moduleHref = courseId
    ? `/module?courseId=${courseId}&courseTitle=${encodeURIComponent(courseTitle)}`
    : "/module";

  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [quizForm, setQuizForm] = useState<QuizFormState>(emptyQuizForm);
  const [questionForm, setQuestionForm] =
    useState<QuestionFormState>(emptyQuestionForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(Boolean(moduleId));
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const hasQuiz = Boolean(quiz);
  const moduleLabel = useMemo(
    () => `${courseTitle} / ${moduleTitle}`,
    [courseTitle, moduleTitle],
  );

  useEffect(() => {
    if (!moduleId) return;

    const loadQuiz = async () => {
      try {
        const res = await fetch(`/api/modules/${moduleId}/quiz`);
        const data = await res.json();

        if (res.status === 404) {
          setQuiz(null);
          setQuizForm(emptyQuizForm);
          setQuestions([]);
          return;
        }

        if (!res.ok) {
          showToast(getErrorMessage(data, "Unable to load quiz"), "error");
          return;
        }

        const loadedQuiz = data.quiz as QuizItem;
        setQuiz(loadedQuiz);
        setQuizForm({
          title: loadedQuiz.title,
          passPercentage: String(loadedQuiz.passPercentage),
          timeLimitSec: String(loadedQuiz.timeLimitSec),
        });

        const questionRes = await fetch(
          `/api/quizzes/${loadedQuiz._id}/questions`,
        );
        const questionData = await questionRes.json();

        if (!questionRes.ok) {
          showToast(
            getErrorMessage(questionData, "Unable to load questions"),
            "error",
          );
          return;
        }

        setQuestions(
          Array.isArray(questionData.questions) ? questionData.questions : [],
        );
      } catch {
        showToast("Something went wrong while loading quiz", "error");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [moduleId, showToast]);

  const validateQuiz = () => {
    const passPercentage = Number(quizForm.passPercentage);
    const timeLimitSec = Number(quizForm.timeLimitSec);

    if (quizForm.title.trim().length < 3) {
      setErrors({ quiz: "Quiz title must be at least 3 characters." });
      return false;
    }

    if (!Number.isFinite(passPercentage) || passPercentage < 1 || passPercentage > 100) {
      setErrors({ quiz: "Pass percentage must be between 1 and 100." });
      return false;
    }

    if (!Number.isInteger(timeLimitSec) || timeLimitSec < 1) {
      setErrors({ quiz: "Time limit must be a positive number of seconds." });
      return false;
    }

    setErrors((current) => ({ ...current, quiz: undefined }));
    return true;
  };

  const validateQuestion = () => {
    if (questionForm.questionText.trim().length < 5) {
      setErrors({ question: "Question text must be at least 5 characters." });
      return false;
    }

    const hasIncompleteOption = questionForm.options.some(
      (option) => !option.text.trim(),
    );

    if (hasIncompleteOption) {
      setErrors({ question: "All four options are required." });
      return false;
    }

    if (
      !questionForm.options.some(
        (option) => option.optionId === questionForm.correctOptionId,
      )
    ) {
      setErrors({ question: "Select a valid correct option." });
      return false;
    }

    setErrors((current) => ({ ...current, question: undefined }));
    return true;
  };

  const updateQuizForm = (field: keyof QuizFormState, value: string) => {
    setQuizForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, quiz: undefined }));
  };

  const updateQuestionOption = (optionId: string, text: string) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.optionId === optionId ? { ...option, text } : option,
      ),
    }));
    setErrors((current) => ({ ...current, question: undefined }));
  };

  const resetQuestionForm = () => {
    setQuestionForm(emptyQuestionForm);
    setEditingQuestionId(null);
    setErrors((current) => ({ ...current, question: undefined }));
  };

  const handleQuizSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!moduleId || !validateQuiz()) return;

    setSavingQuiz(true);

    const payload = {
      title: quizForm.title.trim(),
      passPercentage: Number(quizForm.passPercentage),
      timeLimitSec: Number(quizForm.timeLimitSec),
    };

    try {
      const res = await fetch(
        quiz ? `/api/quizzes/${quiz._id}` : `/api/modules/${moduleId}/quiz`,
        {
          method: quiz ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        showToast(
          getErrorMessage(data, quiz ? "Quiz update failed" : "Quiz creation failed"),
          "error",
        );
        return;
      }

      const savedQuiz = data.quiz as QuizItem;
      setQuiz(savedQuiz);
      setQuizForm({
        title: savedQuiz.title,
        passPercentage: String(savedQuiz.passPercentage),
        timeLimitSec: String(savedQuiz.timeLimitSec),
      });
      showToast(quiz ? "Quiz updated successfully" : "Quiz created successfully", "success");
    } catch {
      showToast("Something went wrong while saving quiz", "error");
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleQuizDelete = async () => {
    if (!quiz) return;
    const shouldDelete = window.confirm("Delete this quiz and its questions?");
    if (!shouldDelete) return;

    setSavingQuiz(true);

    try {
      const res = await fetch(`/api/quizzes/${quiz._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(getErrorMessage(data, "Quiz delete failed"), "error");
        return;
      }

      setQuiz(null);
      setQuestions([]);
      setQuizForm(emptyQuizForm);
      resetQuestionForm();
      showToast("Quiz deleted successfully", "success");
    } catch {
      showToast("Something went wrong while deleting quiz", "error");
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleQuestionSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!quiz || !validateQuestion()) return;

    setSavingQuestion(true);

    const payload = {
      questionText: questionForm.questionText.trim(),
      options: questionForm.options.map((option) => ({
        optionId: option.optionId,
        text: option.text.trim(),
      })),
      correctOptionId: questionForm.correctOptionId,
    };

    try {
      const res = await fetch(
        editingQuestionId
          ? `/api/questions/${editingQuestionId}`
          : `/api/quizzes/${quiz._id}/questions`,
        {
          method: editingQuestionId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        showToast(
          getErrorMessage(
            data,
            editingQuestionId
              ? "Question update failed"
              : "Question creation failed",
          ),
          "error",
        );
        return;
      }

      const savedQuestion = data.question as QuestionItem;
      setQuestions((current) =>
        editingQuestionId
          ? current.map((question) =>
              question._id === editingQuestionId ? savedQuestion : question,
            )
          : [...current, savedQuestion],
      );
      resetQuestionForm();
      showToast(
        editingQuestionId
          ? "Question updated successfully"
          : "Question created successfully",
        "success",
      );
    } catch {
      showToast("Something went wrong while saving question", "error");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleQuestionEdit = (question: QuestionItem) => {
    setEditingQuestionId(question._id);
    setQuestionForm({
      questionText: question.questionText,
      correctOptionId: question.correctOptionId ?? "A",
      options: emptyQuestionForm.options.map((defaultOption) => {
        const savedOption = question.options.find(
          (option) => option.optionId === defaultOption.optionId,
        );

        return savedOption ?? defaultOption;
      }),
    });
    setErrors((current) => ({ ...current, question: undefined }));
  };

  const handleQuestionDelete = async (questionId: string) => {
    const shouldDelete = window.confirm("Delete this question permanently?");
    if (!shouldDelete) return;

    setActiveQuestionId(questionId);

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(getErrorMessage(data, "Question delete failed"), "error");
        return;
      }

      setQuestions((current) =>
        current.filter((question) => question._id !== questionId),
      );
      if (editingQuestionId === questionId) resetQuestionForm();
      showToast("Question deleted successfully", "success");
    } catch {
      showToast("Something went wrong while deleting question", "error");
    } finally {
      setActiveQuestionId(null);
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
              Module Quiz
            </h1>
            <p className="mt-1 text-sm text-gray-500">{moduleLabel}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Questions:{" "}
            <span className="font-semibold text-gray-900">
              {questions.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Loading quiz...</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
            <div className="space-y-6">
              <form
                onSubmit={handleQuizSubmit}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {hasQuiz ? "Edit quiz" : "Create quiz"}
                  </h2>

                  {hasQuiz && (
                    <button
                      type="button"
                      onClick={handleQuizDelete}
                      disabled={savingQuiz}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaRegTrashAlt className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      value={quizForm.title}
                      onChange={(event) =>
                        updateQuizForm("title", event.target.value)
                      }
                      placeholder="Quiz title"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Pass %
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quizForm.passPercentage}
                        onChange={(event) =>
                          updateQuizForm("passPercentage", event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Time limit (sec)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quizForm.timeLimitSec}
                        onChange={(event) =>
                          updateQuizForm("timeLimitSec", event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                      />
                    </div>
                  </div>

                  {errors.quiz && (
                    <p className="text-xs text-red-600">{errors.quiz}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaSave className="h-3.5 w-3.5" />
                  {savingQuiz
                    ? "Saving..."
                    : hasQuiz
                      ? "Save Quiz"
                      : "Create Quiz"}
                </button>
              </form>

              <form
                onSubmit={handleQuestionSubmit}
                className={`rounded-lg border border-gray-200 p-4 ${
                  !quiz ? "opacity-60" : ""
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingQuestionId ? "Edit question" : "Create question"}
                  </h2>

                  {editingQuestionId && (
                    <button
                      type="button"
                      onClick={resetQuestionForm}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                    >
                      <FaTimes className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  )}
                </div>

                <fieldset disabled={!quiz || savingQuestion} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Question
                    </label>
                    <textarea
                      value={questionForm.questionText}
                      onChange={(event) =>
                        setQuestionForm((current) => ({
                          ...current,
                          questionText: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Question text"
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                    />
                  </div>

                  <div className="space-y-3">
                    {questionForm.options.map((option) => (
                      <div
                        key={option.optionId}
                        className="grid gap-2 sm:grid-cols-[48px_1fr_auto]"
                      >
                        <span className="flex h-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-700">
                          {option.optionId}
                        </span>
                        <input
                          value={option.text}
                          onChange={(event) =>
                            updateQuestionOption(
                              option.optionId,
                              event.target.value,
                            )
                          }
                          placeholder={`Option ${option.optionId}`}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                        />
                        <label className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="correctOptionId"
                            checked={
                              questionForm.correctOptionId === option.optionId
                            }
                            onChange={() =>
                              setQuestionForm((current) => ({
                                ...current,
                                correctOptionId: option.optionId,
                              }))
                            }
                            className="h-4 w-4"
                          />
                          Correct
                        </label>
                      </div>
                    ))}
                  </div>

                  {errors.question && (
                    <p className="text-xs text-red-600">{errors.question}</p>
                  )}
                </fieldset>

                <button
                  type="submit"
                  disabled={!quiz || savingQuestion}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingQuestionId ? (
                    <FaSave className="h-3.5 w-3.5" />
                  ) : (
                    <FaPlus className="h-3.5 w-3.5" />
                  )}
                  {savingQuestion
                    ? "Saving..."
                    : editingQuestionId
                      ? "Save Question"
                      : "Create Question"}
                </button>
              </form>
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Questions
                </h2>
              </div>

              {!quiz ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <h3 className="text-base font-semibold text-gray-900">
                    Create a quiz before adding questions
                  </h3>
                </div>
              ) : questions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <h3 className="text-base font-semibold text-gray-900">
                    No questions found
                  </h3>
                </div>
              ) : (
                <div className="grid gap-3">
                  {questions.map((question, questionIndex) => (
                    <article
                      key={question._id}
                      className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-300"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-gray-900">
                            {questionIndex + 1}. {question.questionText}
                          </h3>
                          <div className="mt-3 grid gap-2">
                            {question.options.map((option) => (
                              <div
                                key={option.optionId}
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                  question.correctOptionId === option.optionId
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-gray-200 text-gray-700"
                                }`}
                              >
                                <span className="font-semibold">
                                  {option.optionId}.
                                </span>{" "}
                                {option.text}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuestionEdit(question)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                          >
                            <FaEdit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuestionDelete(question._id)}
                            disabled={activeQuestionId === question._id}
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
        )}
      </section>
    </main>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <main className="w-full self-start p-3">
          <section className="w-full rounded-xl border bg-white p-6 shadow-md">
            <p className="text-sm text-gray-600">Loading quiz...</p>
          </section>
        </main>
      }
    >
      <QuizManager />
    </Suspense>
  );
}
