"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactPlayer from "react-player";
import type { LearnerLesson } from "./types";
import { FiCheck, FiExternalLink, FiFileText } from "react-icons/fi";

interface LessonCardProps {
  lesson: LearnerLesson;
  isUnlocked: boolean;
}

export default function LessonCard({ lesson, isUnlocked }: LessonCardProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedAtRef = useRef(0);
  const [isCompleted, setIsCompleted] = useState(
    lesson.progress?.isCompleted ?? false,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const saveProgress = async (
    watchedSeconds: number,
    currentPosition: number,
    refreshOnComplete = false,
  ) => {
    if (!isUnlocked) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/lesson/${lesson._id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchedSeconds: Math.max(0, Math.floor(watchedSeconds)),
          currentPosition: Math.max(0, Math.floor(currentPosition)),
          durationSeconds: Number.isFinite(videoRef.current?.duration)
            ? Math.floor(videoRef.current?.duration ?? 0)
            : lesson.videoDurationSec,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        progress?: { isCompleted?: boolean };
      };

      if (!response.ok) {
        setError(data.message ?? "Could not save progress.");
        return;
      }

      const completedNow = Boolean(data.progress?.isCompleted);

      if (completedNow && !isCompleted) {
        setIsCompleted(true);
        if (refreshOnComplete) router.refresh();
      }
    } catch {
      setError("Network error while saving progress.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayerReady = () => {
    const player = videoRef.current;
    const resumeAt = lesson.progress?.lastPositionSec ?? 0;

    if (!player || resumeAt <= 0 || resumeAt >= player.duration) return;

    player.currentTime = resumeAt;
  };

  const handleTimeUpdate = () => {
    const player = videoRef.current;
    const now = Date.now();

    if (!player || now - lastSavedAtRef.current < 8000) return;

    lastSavedAtRef.current = now;
    void saveProgress(player.currentTime, player.currentTime);
  };

  const markComplete = () => {
    const player = videoRef.current;
    const duration =
      player?.duration ||
      lesson.videoDurationSec ||
      lesson.progress?.lastPositionSec ||
      0;

    void saveProgress(duration, duration, true);
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Lesson {lesson.order}
          </p>
          <h4 className="mt-0.5 text-base font-semibold text-gray-900">
            {lesson.title}
          </h4>
          {lesson.description && (
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {lesson.description}
            </p>
          )}
        </div>

        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isCompleted
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {isCompleted && <FiCheck className="h-3.5 w-3.5" />}
          {isCompleted ? "Completed" : "In progress"}
        </span>
      </div>

      <div className="space-y-5 px-5 py-5">
        {lesson.readingContent && (
          <div className="rounded-lg bg-gray-50 px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FiFileText className="h-4 w-4 text-gray-500" />
              Reading
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {lesson.readingContent}
            </p>
          </div>
        )}

        {lesson.videoUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <ReactPlayer
              ref={videoRef}
              src={lesson.videoUrl}
              controls
              playsInline
              preload="metadata"
              width="100%"
              height="100%"
              style={{ display: "block" }}
              onReady={handlePlayerReady}
              onTimeUpdate={handleTimeUpdate}
              onPause={() => {
                const player = videoRef.current;
                if (player) {
                  void saveProgress(player.currentTime, player.currentTime);
                }
              }}
              onEnded={() => {
                const player = videoRef.current;
                const duration =
                  player?.duration || lesson.videoDurationSec || 0;
                void saveProgress(duration, duration, true);
              }}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
            No video has been added for this lesson.
          </div>
        )}

        {lesson.resources && lesson.resources.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900">
              Resources
            </p>
            <div className="flex flex-wrap gap-2">
              {lesson.resources.map((resource) => (
                <a
                  key={`${resource.label}-${resource.url}`}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  {resource.label || resource.type}
                  <FiExternalLink className="h-3.5 w-3.5 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={markComplete}
            disabled={isSaving || isCompleted}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCheck className="h-4 w-4" />
            {isCompleted
              ? "Completed"
              : isSaving
                ? "Saving..."
                : "Mark complete"}
          </button>

          {lesson.progress?.lastPositionSec ? (
            <p className="text-xs text-gray-500">
              Resume position: {Math.floor(lesson.progress.lastPositionSec)}s
            </p>
          ) : null}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </article>
  );
}
