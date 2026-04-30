import { Suspense } from "react";
import LearnerProfileForm from "./LearnerProfileForm";

export default function LearnerProfile() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-3xl rounded-xl border bg-white p-6 shadow-md">
          <p className="text-sm text-gray-600">Loading profile...</p>
        </div>
      }
    >
      <LearnerProfileForm />
    </Suspense>
  );
}
