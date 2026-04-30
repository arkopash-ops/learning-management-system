"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const NavbarActions = () => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.replace("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isLoggingOut}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>

      {/* Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Logout
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to logout?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarActions;
