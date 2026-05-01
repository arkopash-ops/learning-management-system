import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import LearnerModel from "@/models/learner.model";
import { EducationLevel } from "@/shared/enum/EducationLevel.enum";
import { UserRole } from "@/shared/enum/UserRole.enum";
import "@/models/user.model";

interface LearnerDashboardProfile {
  userId: {
    name: string;
    email: string;
  };
  bio?: string;
  dateOfBirth?: Date | string | null;
  educationLevel?: EducationLevel;
  interests?: string[];
}

const isProfileIncomplete = (profile: LearnerDashboardProfile) =>
  !profile.bio ||
  !profile.dateOfBirth ||
  !profile.educationLevel ||
  !profile.interests ||
  profile.interests.length === 0;

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "Not added";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
};

export default async function LearnerDashboard() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const decoded = verifyToken(token);

  if (decoded.role !== UserRole.LEARNER) {
    redirect(`/${decoded.role}/dashboard`);
  }

  await connectDB();

  const learner = await LearnerModel.findOne({
    userId: decoded.userId,
  })
    .populate("userId", "name email")
    .lean<LearnerDashboardProfile | null>();

  if (!learner || isProfileIncomplete(learner)) {
    redirect("/learner/profile?completeProfile=1");
  }

  return (
    <section className="w-full self-start mt-3 rounded-xl border bg-white p-6 shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-gray-200 pb-6 md:flex-row md:items-start">
        {/* Avatar + Info */}
        <div className="flex gap-4 min-w-0">
          <FaUserCircle className="h-20 w-20 shrink-0 text-gray-300" />

          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">
              {learner.userId.name}
            </h1>

            <a
              href={`mailto:${learner.userId.email}`}
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              {learner.userId.email}
            </a>

            {/* DOB */}
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">DOB:</span>{" "}
              {formatDate(learner.dateOfBirth)}
            </p>

            {/* Education Level */}
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Education:</span>{" "}
              {learner.educationLevel || "Not added"}
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="md:w-1/2 ml-50">
          <h2 className="text-lg font-semibold text-gray-900">Bio</h2>
          <p className="mt-2 leading-7 text-gray-600">
            {learner.bio?.trim() || "No bio added yet."}
          </p>
        </div>
      </div>

      {/* Interests */}
      <div className="pt-5">
        <h2 className="text-lg font-semibold text-gray-900">Interests</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {learner.interests?.length ? (
            learner.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
              >
                {interest}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-500">No interests added yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
