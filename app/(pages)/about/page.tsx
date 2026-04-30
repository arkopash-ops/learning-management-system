export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
          About Mini LMS
        </h1>

        <p className="mt-4 text-gray-600 text-lg">
          A lightweight Learning Management System designed for modern corporate
          training with accurate video progress tracking, quizzes, and
          certificates.
        </p>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl w-full">
        <div className="p-5 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-800">Role-Based Access</h3>
          <p className="text-gray-500 mt-2 text-sm">
            Separate dashboards for Admin, Instructors, and Learners with secure
            permissions.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-800">
            Smart Progress Tracking
          </h3>
          <p className="text-gray-500 mt-2 text-sm">
            Videos resume exactly where you left off with 90% completion logic.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-800">
            Quizzes & Certificates
          </h3>
          <p className="text-gray-500 mt-2 text-sm">
            Unlock modules through quizzes and earn completion certificates.
          </p>
        </div>
      </div>
    </main>
  );
}
