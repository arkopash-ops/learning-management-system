import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import InstructorModel from "@/models/instructor.model";
import { UserRole } from "@/shared/enum/UserRole.enum";
import "@/models/user.model";

interface Education {
  degree?: string;
  institution?: string;
  year?: string | number;
}

interface InstructorDashboardProfile {
  userId: {
    name: string;
    email: string;
  };
  subjects?: string[];
  bio?: string;
  dateOfBirth?: Date | string | null;
  education?: Education[];
}

const isProfileIncomplete = (profile: InstructorDashboardProfile) =>
  !profile.bio ||
  !profile.dateOfBirth ||
  !profile.subjects?.length ||
  !profile.education?.length;

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "Not added";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
};

export default async function InstructorDashboard() {
  const token = (await cookies()).get("token")?.value;

  if (!token) redirect("/login");

  const decoded = verifyToken(token);

  if (decoded.role !== UserRole.INSTRUCTOR) {
    redirect(`/${decoded.role}/dashboard`);
  }

  await connectDB();

  const instructor = await InstructorModel.findOne({
    userId: decoded.userId,
  })
    .populate("userId", "name email")
    .lean<InstructorDashboardProfile | null>();

  if (!instructor || isProfileIncomplete(instructor)) {
    redirect("/instructor/profile?completeProfile=1");
  }

  return (
    <section className="w-full self-start mt-3 rounded-xl border bg-white p-6 shadow-md">
      <div className="flex flex-col gap-6 border-b border-gray-200 pb-6 md:flex-row md:items-start">
        {/* Avatar + Basic Info */}
        <div className="flex gap-4 min-w-0">
          <FaUserCircle className="h-20 w-20 shrink-0 text-gray-300" />

          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">
              {instructor.userId.name}
            </h1>

            <a
              href={`mailto:${instructor.userId.email}`}
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              {instructor.userId.email}
            </a>

            {/* DOB */}
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">DOB:</span>{" "}
              {formatDate(instructor.dateOfBirth)}
            </p>

            {/* Subjects */}
            <div className="mt-3 flex flex-wrap gap-2">
              {instructor.subjects?.length ? (
                instructor.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
                  >
                    {subject}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No subjects added yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="md:w-1/2 ml-40">
          <h2 className="text-lg font-semibold text-gray-900">Bio</h2>
          <p className="mt-2 leading-7 text-gray-600">
            {instructor.bio?.trim() || "No bio added yet."}
          </p>
        </div>
      </div>

      {/* Education */}
      <div className="pt-5">
        <h2 className="text-lg font-semibold text-gray-900">Education</h2>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {instructor.education?.length ? (
            instructor.education.map((item, index) => (
              <div
                key={`${item.degree}-${item.institution}-${index}`}
                className="rounded-md border border-gray-200 p-3"
              >
                <p className="font-semibold text-gray-900 text-sm">
                  {item.degree || "No degree"}
                </p>
                <p className="text-sm text-gray-600">
                  {item.institution || "No institution"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.year || "No year"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No education details added yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
