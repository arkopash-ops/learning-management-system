import type {
  CourseContentData,
  EnrollmentItem,
  MyEnrollmentsData,
  OverviewData,
} from "./types";

export async function getCourseOverview(
  courseId: string,
): Promise<OverviewData | null> {
  const res = await fetch(
    `http://localhost:3000/api/courses/${courseId}/overview`,
    { cache: "no-store" },
  );

  if (!res.ok) return null;
  return res.json() as Promise<OverviewData>;
}

export async function getMyEnrollments(
  token: string,
): Promise<MyEnrollmentsData> {
  const res = await fetch("http://localhost:3000/api/enrollment/my", {
    cache: "no-store",
    headers: { Cookie: `token=${token}` },
  });

  if (!res.ok) return { enrollments: [] };
  return res.json() as Promise<MyEnrollmentsData>;
}

export async function getCourseContent(
  courseId: string,
  token: string,
): Promise<CourseContentData | null> {
  const res = await fetch(
    `http://localhost:3000/api/courses/${courseId}/content`,
    {
      cache: "no-store",
      headers: { Cookie: `token=${token}` },
    },
  );

  if (!res.ok) return null;
  return res.json() as Promise<CourseContentData>;
}

export const getEnrollmentCourseId = (enrollment: EnrollmentItem) =>
  typeof enrollment.courseId === "string"
    ? enrollment.courseId
    : enrollment.courseId._id;
