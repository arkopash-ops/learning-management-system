import type { CourseDetail, InstructorProfile } from "./types";

interface InstructorCardProps {
  instructor: CourseDetail["instructorId"];
  profile: InstructorProfile | null;
}

export default function InstructorCard({
  instructor,
  profile,
}: InstructorCardProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        About the Instructor
      </h2>

      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-700 select-none">
          {instructor.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-gray-900">
            {instructor.name}
          </p>
          <p className="text-sm text-gray-500">{instructor.email}</p>

          {profile?.bio && (
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {profile.bio}
            </p>
          )}

          {profile?.subjects && profile.subjects.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Subjects
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile?.education && profile.education.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Education
              </p>
              <ul className="space-y-1">
                {profile.education.map((education, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    <span className="font-medium">{education.degree}</span>
                    {" - "}
                    {education.institution}
                    {education.year ? ` (${education.year})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
