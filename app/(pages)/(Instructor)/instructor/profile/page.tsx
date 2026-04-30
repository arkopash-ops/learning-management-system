import { Suspense } from "react";
import InstructorProfileForm from "./InstructorProfileForm";

export default function InstructorProfile() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-3xl rounded-xl border bg-white p-6 shadow-md">
          <p className="text-sm text-gray-600">Loading profile...</p>
        </div>
      }
    >
      <InstructorProfileForm />
    </Suspense>
  );
}
