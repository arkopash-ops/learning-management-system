import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FiAward, FiExternalLink, FiFileText } from "react-icons/fi";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import CertificateModel from "@/models/certificate.model";
import LearnerModel from "@/models/learner.model";
import { EducationLevel } from "@/shared/enum/EducationLevel.enum";
import { UserRole } from "@/shared/enum/UserRole.enum";
import "@/models/user.model";

interface LearnerCertificatesProfile {
  bio?: string;
  dateOfBirth?: Date | string | null;
  educationLevel?: EducationLevel;
  interests?: string[];
}

interface LearnerCertificateItem {
  _id: string;
  certId: string;
  learnerNameSnapshot?: string;
  courseTitleSnapshot?: string;
  pdfUrl?: string;
  issuedAt?: Date;
  completedAt?: Date;
}

const isProfileIncomplete = (profile: LearnerCertificatesProfile) =>
  !profile.bio ||
  !profile.dateOfBirth ||
  !profile.educationLevel ||
  !profile.interests ||
  profile.interests.length === 0;

const formatDate = (date?: Date) =>
  date
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date)
    : "Not available";

export default async function LearnerCertificatesPage() {
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
  }).lean<LearnerCertificatesProfile | null>();

  if (!learner || isProfileIncomplete(learner)) {
    redirect("/learner/profile?completeProfile=1");
  }

  const certificates = await CertificateModel.find({
    learnerId: decoded.userId,
  })
    .sort({ issuedAt: -1 })
    .lean<LearnerCertificateItem[]>();

  return (
    <section className="w-full self-start mt-3 rounded-xl border bg-white p-6 shadow-md">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="mt-1 text-sm text-gray-600">
            View certificates issued after completing courses.
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-600">
            No certificates have been issued yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <article
              key={certificate._id}
              className="flex min-h-56 flex-col rounded-lg border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
                  <FiAward className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Issued
                </span>
              </div>

              <div className="mt-4 flex-1">
                <h2 className="line-clamp-2 text-lg font-semibold text-gray-900">
                  {certificate.courseTitleSnapshot ?? "Course Certificate"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Awarded to {certificate.learnerNameSnapshot ?? "Learner"}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Certificate ID</dt>
                    <dd className="font-medium text-gray-900">
                      {certificate.certId}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Completed</dt>
                    <dd className="font-medium text-gray-900">
                      {formatDate(certificate.completedAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Issued</dt>
                    <dd className="font-medium text-gray-900">
                      {formatDate(certificate.issuedAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <Link
                  href={`/api/verify/${certificate.certId}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Verify
                  <FiExternalLink className="h-3.5 w-3.5" />
                </Link>

                {certificate.pdfUrl && (
                  <a
                    href={certificate.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Certificate
                    <FiFileText className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
