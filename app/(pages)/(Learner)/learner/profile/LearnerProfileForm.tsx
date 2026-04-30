"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/components/(Toast)/ToastProvider";
import { EducationLevel } from "@/shared/enum/EducationLevel.enum";

interface LearnerProfile {
  _id: string;
  userId: {
    name: string;
    email: string;
    role: string;
  };
  bio: string;
  dateOfBirth: string | null;
  educationLevel: EducationLevel;
  interests: string[];
}

const educationLevels = Object.values(EducationLevel);

const formatDateForInput = (value: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const isProfileIncomplete = (profile: LearnerProfile) =>
  !profile.bio ||
  !profile.dateOfBirth ||
  !profile.educationLevel ||
  profile.interests.length === 0;

export default function LearnerProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const shouldCompleteProfile = searchParams.get("completeProfile") === "1";

  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(
    EducationLevel.SCHOOL,
  );
  const [interestsText, setInterestsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const incomplete = useMemo(
    () => (profile ? isProfileIncomplete(profile) : false),
    [profile],
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/learner/profile/me");
        const data = await res.json();

        if (!res.ok) {
          showToast(data.message || "Unable to load profile", "error");
          return;
        }

        const learner = data.learner as LearnerProfile;
        setProfile(learner);
        setBio(learner.bio ?? "");
        setDateOfBirth(formatDateForInput(learner.dateOfBirth));
        setEducationLevel(learner.educationLevel);
        setInterestsText(learner.interests.join(", "));
      } catch {
        showToast("Something went wrong while loading profile", "error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [showToast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const interests = interestsText
      .split(",")
      .map((interest) => interest.trim())
      .filter(Boolean);

    if (bio.trim().length < 5) {
      showToast("Bio must be at least 5 characters", "error");
      return;
    }

    if (!dateOfBirth) {
      showToast("Date of birth is required", "error");
      return;
    }

    if (!educationLevel) {
      showToast("Select your education level", "error");
      return;
    }

    if (interests.length === 0) {
      showToast("Add at least one interest", "error");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/learner/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          dateOfBirth,
          educationLevel,
          interests,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Profile update failed", "error");
        return;
      }

      setProfile(data.learner);
      showToast("Profile updated successfully", "success");

      if (shouldCompleteProfile) {
        router.replace("/learner/dashboard");
        router.refresh();
      }
    } catch {
      showToast("Something went wrong while saving profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl rounded-xl border bg-white p-6 shadow-md">
        <p className="text-sm text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-4xl rounded-xl border bg-white p-6 shadow-md">
      <div className="mb-6">
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {profile?.userId.name ?? "Your profile"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{profile?.userId.email}</p>

        {(shouldCompleteProfile || incomplete) && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Please complete your profile details before continuing to your
            dashboard.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            placeholder="Tell us about your learning goals."
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Education Level
            </label>
            <select
              value={educationLevel}
              onChange={(event) =>
                setEducationLevel(event.target.value as EducationLevel)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            >
              {educationLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Interests
          </label>
          <input
            value={interestsText}
            onChange={(event) => setInterestsText(event.target.value)}
            placeholder="Frontend, Data Science, Design"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/learner/dashboard")}
            disabled={shouldCompleteProfile || incomplete}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Dashboard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
