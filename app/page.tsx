import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-200 px-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
          Mini Learning Management System
        </h1>

        <p className="mt-4 text-gray-600 text-lg">
          Learn. Track Progress. Complete Courses. Earn Certificates.
        </p>

        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-black text-white rounded-lg hover:opacity-90 transition"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-100 transition"
          >
            Register
          </Link>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="p-5 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-800">Courses</h3>
          <p className="text-gray-500 mt-2 text-sm">
            Structured learning with modules and videos.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-800">Progress Tracking</h3>
          <p className="text-gray-500 mt-2 text-sm">
            Resume exactly where you left off.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-800"> Certificates</h3>
          <p className="text-gray-500 mt-2 text-sm">
            Earn completion certificates after finishing courses.
          </p>
        </div>
      </div>
    </main>
  );
}
