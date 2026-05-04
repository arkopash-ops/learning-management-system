"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { FiMessageCircle, FiRefreshCw, FiSend, FiTrash2 } from "react-icons/fi";
import { useToast } from "@/app/components/(Toast)/ToastProvider";
import type { CommentNode } from "@/shared/types/comment.types";

interface LessonCommentsProps {
  lessonId: string;
  title?: string;
  compact?: boolean;
}

interface CommentsResponse {
  comments?: CommentNode[];
  currentUserId?: string;
  message?: string;
}

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

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function LessonComments({
  lessonId,
  title = "Comments",
  compact = false,
}: LessonCommentsProps) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [comment, setComment] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/lesson/${lessonId}/comments`);
      const data = (await res.json()) as CommentsResponse;

      if (!res.ok) {
        showToast(getErrorMessage(data, "Unable to load comments"), "error");
        return;
      }

      setComments(Array.isArray(data.comments) ? data.comments : []);
      setCurrentUserId(data.currentUserId ?? "");
    } catch {
      showToast("Something went wrong while loading comments", "error");
    } finally {
      setLoading(false);
    }
  }, [lessonId, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadComments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadComments]);

  const postComment = async (text: string, parentCommentId?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/lesson/${lessonId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: trimmed,
          parentCommentId: parentCommentId ?? null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(getErrorMessage(data, "Unable to post comment"), "error");
        return;
      }

      setComment("");
      if (parentCommentId) {
        setReplyDrafts((current) => ({ ...current, [parentCommentId]: "" }));
        setOpenReplyId(null);
      }
      await loadComments();
      showToast(parentCommentId ? "Reply posted" : "Comment posted", "success");
    } catch {
      showToast("Something went wrong while posting comment", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void postComment(comment);
  };

  const handleDelete = async (commentId: string) => {
    const shouldDelete = window.confirm(
      "Delete this comment and its replies?",
    );
    if (!shouldDelete) return;

    setDeletingId(commentId);

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(getErrorMessage(data, "Unable to delete comment"), "error");
        return;
      }

      await loadComments();
      showToast("Comment deleted", "success");
    } catch {
      showToast("Something went wrong while deleting comment", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const renderComment = (item: CommentNode, depth = 0) => {
    const replyText = replyDrafts[item._id] ?? "";
    const canDelete = currentUserId && item.authorId === currentUserId;

    return (
      <div key={item._id} className={depth > 0 ? "ml-5 border-l pl-4" : ""}>
        <article className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {item.authorName ?? "User"}
                </p>
                {item.authorRole && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                    {item.authorRole}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {item.comment}
              </p>
            </div>

            {canDelete && (
              <button
                type="button"
                onClick={() => void handleDelete(item._id)}
                disabled={deletingId === item._id}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                {deletingId === item._id ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setOpenReplyId((current) =>
                  current === item._id ? null : item._id,
                )
              }
              className="text-xs font-medium text-gray-600 transition hover:text-black"
            >
              Reply
            </button>
          </div>

          {openReplyId === item._id && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void postComment(replyText, item._id);
              }}
              className="mt-3 flex flex-col gap-2 sm:flex-row"
            >
              <input
                value={replyText}
                onChange={(event) =>
                  setReplyDrafts((current) => ({
                    ...current,
                    [item._id]: event.target.value,
                  }))
                }
                placeholder="Write a reply..."
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
              <button
                type="submit"
                disabled={saving || !replyText.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSend className="h-4 w-4" />
                Reply
              </button>
            </form>
          )}
        </article>

        {item.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {item.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      className={
        compact
          ? "rounded-lg border border-gray-200 bg-gray-50 p-4"
          : "rounded-2xl border border-gray-200 bg-white p-6 shadow-md"
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FiMessageCircle className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadComments()}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={compact ? 2 : 3}
          placeholder="Write a comment..."
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
        />
        <button
          type="submit"
          disabled={saving || !comment.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiSend className="h-4 w-4" />
          {saving ? "Posting..." : "Post Comment"}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-center text-sm text-gray-500">
            No comments yet.
          </div>
        ) : (
          comments.map((item) => renderComment(item))
        )}
      </div>
    </section>
  );
}
