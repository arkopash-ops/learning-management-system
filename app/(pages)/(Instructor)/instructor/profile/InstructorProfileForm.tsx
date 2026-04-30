"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/components/(Toast)/ToastProvider";

interface Education {
  degree: string;
  institution: string;
  year: number | "";
}

interface InstructorProfile {
  _id: string;
  userId: {
    name: string;
    email: string;
    role: string;
  };
  subjects: string[];
  bio: string;
  dateOfBirth: string | null;
  education: Education[];
}

const emptyEducation: Education = {
  degree: "",
  institution: "",
  year: "",
};

const formatDateForInput = (value: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const isProfileIncomplete = (profile: InstructorProfile) =>
  !profile.bio ||
  !profile.dateOfBirth ||
  profile.subjects.length === 0 ||
  profile.education.length === 0;

export default function InstructorProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const shouldCompleteProfile = searchParams.get("completeProfile") === "1";

  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [subjectsText, setSubjectsText] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [education, setEducation] = useState<Education[]>([emptyEducation]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const incomplete = useMemo(
    () => (profile ? isProfileIncomplete(profile) : false),
    [profile],
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/instructor/profile/me");
        const data = await res.json();

        if (!res.ok) {
          showToast(data.message || "Unable to load profile", "error");
          return;
        }

        const instructor = data.instructor as InstructorProfile;
        setProfile(instructor);
        setSubjectsText(instructor.subjects.join(", "));
        setBio(instructor.bio ?? "");
        setDateOfBirth(formatDateForInput(instructor.dateOfBirth));
        setEducation(
          instructor.education.length > 0
            ? instructor.education.map((item) => ({
                degree: item.degree,
                institution: item.institution,
                year: item.year,
              }))
            : [emptyEducation],
        );
      } catch {
        showToast("Something went wrong while loading profile", "error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [showToast]);

  const updateEducation = (
    index: number,
    field: keyof Education,
    value: string,
  ) => {
    setEducation((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === "year" ? Number(value) || "" : value,
            }
          : item,
      ),
    );
  };

  const addEducation = () => {
    setEducation((current) => [...current, emptyEducation]);
  };

  const removeEducation = (index: number) => {
    setEducation((current) =>
      current.length === 1
        ? [emptyEducation]
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const subjects = subjectsText
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    const cleanedEducation = education
      .map((item) => ({
        degree: item.degree.trim(),
        institution: item.institution.trim(),
        year: Number(item.year),
      }))
      .filter((item) => item.degree || item.institution || item.year);

    if (bio.trim().length < 5) {
      showToast("Bio must be at least 5 characters", "error");
      return;
    }

    if (!dateOfBirth) {
      showToast("Date of birth is required", "error");
      return;
    }

    if (subjects.length === 0) {
      showToast("Add at least one subject", "error");
      return;
    }

    if (
      cleanedEducation.length === 0 ||
      cleanedEducation.some(
        (item) => !item.degree || !item.institution || !item.year,
      )
    ) {
      showToast("Complete every education detail", "error");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/instructor/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          bio,
          dateOfBirth,
          education: cleanedEducation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Profile update failed", "error");
        return;
      }

      setProfile(data.instructor);
      showToast("Profile updated successfully", "success");

      if (shouldCompleteProfile) {
        router.replace("/instructor/dashboard");
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
    <section className="w-full m-3 max-w-4xl rounded-xl border bg-white p-6 shadow-md">
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
            Subjects
          </label>
          <input
            value={subjectsText}
            onChange={(event) => setSubjectsText(event.target.value)}
            placeholder="JavaScript, React, Database"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate multiple subjects with commas.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            placeholder="Tell learners about your teaching experience."
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
          />
        </div>

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

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-700">
              Education
            </label>
            <button
              type="button"
              onClick={addEducation}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
            >
              Add Education
            </button>
          </div>

          {education.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_1fr_120px_auto]"
            >
              <input
                value={item.degree}
                onChange={(event) =>
                  updateEducation(index, "degree", event.target.value)
                }
                placeholder="Degree"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
              <input
                value={item.institution}
                onChange={(event) =>
                  updateEducation(index, "institution", event.target.value)
                }
                placeholder="Institution"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
              <input
                type="number"
                value={item.year}
                onChange={(event) =>
                  updateEducation(index, "year", event.target.value)
                }
                placeholder="Year"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/instructor/dashboard")}
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
