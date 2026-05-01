"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiClock, FiRefreshCw } from "react-icons/fi";

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
}

interface QuizAttempt {
  _id: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  createdAt?: string;
}

interface LearnerQuizPanelProps {
  moduleId: string;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
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

export default function LearnerQuizPanel({ moduleId }: LearnerQuizPanelProps) {
  const router = useRouter();
  const timerRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    attemptNumber: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const answeredCount = useMemo(
    () => questions.filter((question) => answers[question._id]).length,
    [answers, questions],
  );

  useEffect(() => {
    const loadQuizData = async () => {
      setLoading(true);
      setError("");

      try {
        const quizRes = await fetch(`/api/modules/${moduleId}/quiz`);
        const quizData = await quizRes.json();

        if (quizRes.status === 404) {
          setQuiz(null);
          setQuestions([]);
          setAttempts([]);
          return;
        }

        if (!quizRes.ok) {
          setError(getErrorMessage(quizData, "Unable to load quiz."));
          return;
        }

        const loadedQuiz = quizData.quiz as QuizItem;
        setQuiz(loadedQuiz);
        setTimeRemaining(loadedQuiz.timeLimitSec);
        timerRef.current = loadedQuiz.timeLimitSec;

        const [questionRes, attemptRes] = await Promise.all([
          fetch(`/api/quizzes/${loadedQuiz._id}/questions`),
          fetch(`/api/quizzes/${loadedQuiz._id}/attempts`),
        ]);
        const questionData = await questionRes.json();
        const attemptData = await attemptRes.json();

        if (!questionRes.ok) {
          setError(getErrorMessage(questionData, "Unable to load questions."));
          return;
        }

        if (!attemptRes.ok) {
          setError(getErrorMessage(attemptData, "Unable to load attempts."));
          return;
        }

        setQuestions(
          Array.isArray(questionData.questions) ? questionData.questions : [],
        );
        setAttempts(
          Array.isArray(attemptData.attempts) ? attemptData.attempts : [],
        );
      } catch {
        setError("Something went wrong while loading quiz.");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [moduleId]);

  const submitQuiz = useCallback(
    async (autoSubmitted = false) => {
      if (!quiz || questions.length === 0 || isSubmitting) return;

      setIsSubmitting(true);
      setError("");

      try {
        const payload = {
          answers: questions.map((question) => ({
            questionId: question._id,
            selectedOptionId: answers[question._id] ?? "",
          })),
        };

        const res = await fetch(`/api/quizzes/${quiz._id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(getErrorMessage(data, "Quiz submission failed."));
          return;
        }

        setResult(data.result);
        setIsStarted(false);

        const attemptRes = await fetch(`/api/quizzes/${quiz._id}/attempts`);
        const attemptData = await attemptRes.json();

        if (attemptRes.ok) {
          setAttempts(
            Array.isArray(attemptData.attempts) ? attemptData.attempts : [],
          );
        }

        if (autoSubmitted) {
          setError("Time ended. Your quiz was submitted automatically.");
        }

        router.refresh();
      } catch {
        setError("Something went wrong while submitting quiz.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, isSubmitting, questions, quiz, router],
  );

  useEffect(() => {
    if (!isStarted || !quiz || result) return;

    const intervalId = window.setInterval(() => {
      timerRef.current = Math.max(0, timerRef.current - 1);
      setTimeRemaining(timerRef.current);

      if (timerRef.current === 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        void submitQuiz(true);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isStarted, quiz, result, submitQuiz]);

  const startQuiz = () => {
    if (!quiz || questions.length === 0) return;

    autoSubmittedRef.current = false;
    timerRef.current = quiz.timeLimitSec;
    setTimeRemaining(quiz.timeLimitSec);
    setAnswers({});
    setResult(null);
    setError("");
    setIsStarted(true);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600">
        Loading quiz...
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Module Quiz
          </p>
          <h4 className="mt-0.5 text-base font-semibold text-gray-900">
            {quiz.title}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            Pass {quiz.passPercentage}% • {questions.length} questions
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
          <FiClock className="h-4 w-4 text-gray-500" />
          {formatTime(timeRemaining || quiz.timeLimitSec)}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {!isStarted && !result && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startQuiz}
              disabled={questions.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start Quiz
            </button>

            {questions.length === 0 && (
              <p className="text-sm text-gray-500">
                No questions have been added yet.
              </p>
            )}
          </div>
        )}

        {isStarted && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <span>
                Answered {answeredCount}/{questions.length}
              </span>
              <span>Auto-submit at 0:00</span>
            </div>

            {questions.map((question, questionIndex) => (
              <div
                key={question._id}
                className="rounded-lg border border-gray-200 px-4 py-4"
              >
                <p className="font-medium text-gray-900">
                  {questionIndex + 1}. {question.questionText}
                </p>

                <div className="mt-3 grid gap-2">
                  {question.options.map((option) => (
                    <label
                      key={option.optionId}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                        answers[question._id] === option.optionId
                          ? "border-gray-900 bg-gray-50 text-gray-900"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question._id}
                        checked={answers[question._id] === option.optionId}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question._id]: option.optionId,
                          }))
                        }
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>
                        <span className="font-semibold">{option.optionId}.</span>{" "}
                        {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => void submitQuiz(false)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        )}

        {result && (
          <div
            className={`rounded-lg border px-4 py-4 ${
              result.passed
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <FiCheckCircle className="h-4 w-4" />
              {result.passed ? "Quiz passed" : "Quiz submitted"}
            </div>
            <p className="mt-1 text-sm">
              Score: {Math.round(result.score)}% • Attempt #
              {result.attemptNumber}
            </p>
          </div>
        )}

        {error && (
          <p
            className={`text-sm ${
              error.startsWith("Time ended") ? "text-gray-600" : "text-red-600"
            }`}
          >
            {error}
          </p>
        )}

        {attempts.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FiRefreshCw className="h-4 w-4 text-gray-500" />
              Attempts
            </div>
            <div className="grid gap-2">
              {attempts.slice(0, 5).map((attempt) => (
                <div
                  key={attempt._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                >
                  <span>Attempt #{attempt.attemptNumber}</span>
                  <span
                    className={
                      attempt.passed ? "text-emerald-700" : "text-red-600"
                    }
                  >
                    {Math.round(attempt.score)}% •{" "}
                    {attempt.passed ? "Passed" : "Failed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
