import Link from "next/link";

const Footer = async () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Link href="/" className="text-base font-bold text-gray-900">
            Mini LMS
          </Link>
          <p className="text-sm text-gray-500">Learn. Build. Grow.</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <Link href="/about" className="hover:text-gray-900">
            About
          </Link>
        </div>

        <div className="text-xs text-gray-500 sm:text-right">
          © {new Date().getFullYear()} Mini LMS. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
