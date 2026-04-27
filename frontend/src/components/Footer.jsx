import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-gradient-to-r from-slate-900 via-slate-950 to-black">
      <div className="section-max-width py-10 text-sm text-slate-300">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              AI Based IELTS
            </h3>
            <p className="text-xs font-medium text-red-400">
              Mock Test Platform
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              Prepare for your IELTS exam with AI-powered mock tests and
              personalized feedback.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-red-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/practice/listening" className="hover:text-red-400">
                  Practice Tests
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-red-400">
                  Dashboard
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="cursor-default text-left text-slate-400"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="cursor-default text-left text-slate-400"
                >
                  Blog
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">
              Practice Modules
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="text-slate-300">Listening Practice</li>
              <li className="text-slate-300">Reading Practice</li>
              <li className="text-slate-300">Writing Practice</li>
              <li className="text-slate-300">Speaking Practice</li>
              <li className="text-slate-300">Full Mock Test</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Contact Us</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="text-slate-300">
                123 Education Street, London, UK
              </li>
              <li className="text-slate-300">+44 20 1234 5678</li>
              <li className="text-slate-300">support@aiielts.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4 text-[11px] text-slate-400 sm:flex sm:items-center sm:justify-between">
          <p>
            © 2026 AI Based IELTS Mock Test. All rights reserved.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 sm:mt-0">
            <button
              type="button"
              className="cursor-default hover:text-red-500"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="cursor-default hover:text-red-500"
            >
              Terms of Service
            </button>
            <button
              type="button"
              className="cursor-default hover:text-red-500"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

