"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MdCheckCircleOutline } from "react-icons/md";

interface EnrollButtonProps {
  courseId: string;
}

export default function EnrollButton({ courseId }: EnrollButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "already"
  >("idle");
  const [message, setMessage] = useState("");

  const handleEnroll = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });

      const data = (await res.json()) as { message?: string };

      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "Enrolled successfully!");
        router.refresh();
      } else if (res.status === 400 && data.message === "Already enrolled") {
        setStatus("already");
        setMessage("You are already enrolled in this course.");
      } else {
        setStatus("error");
        setMessage(data.message ?? "Enrollment failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-emerald-700 font-medium">
          <MdCheckCircleOutline className="h-5 w-5 text-green-500" />;
          {message}
        </div>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-5 py-3 text-blue-700 font-medium">
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <button
        id={`enroll-btn-${courseId}`}
        onClick={handleEnroll}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 bg-black hover:opacity-90 active:scale-95 text-white font-semibold text-base shadow-md shadow-gray-200 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Enrolling...
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Enroll in Course
          </>
        )}
      </button>

      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
