import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../AuthContext";

function LogoutIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.7a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LogoIcon({ className = "" }) {
  return (
    <div
      className={[
        "flex h-10 w-10 items-center justify-center rounded-xl bg-[#7E3AF2] text-white shadow-sm",
        className
      ].join(" ")}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M8 12h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 8v8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Navbar() {
  const { student, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
      <nav className="section-max-width flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3 group focus-ring rounded-lg p-1 -ml-1">
          <LogoIcon className="group-hover:shadow-md transition-all" />
          <div className="leading-tight">
            <div className="text-sm font-bold text-[#333333] tracking-tight">
              AI Based IELTS
            </div>
            <div className="text-[11px] text-[#7E3AF2] font-semibold">Mock Test Platform</div>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              [
                "transition-colors hover:text-[#7E3AF2] focus-ring rounded-md px-2 py-1",
                isActive ? "text-[#7E3AF2] font-bold" : "text-gray-600"
              ].join(" ")
            }
          >
            Home
          </NavLink>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 transition-colors hover:text-[#7E3AF2] focus-ring rounded-md px-2 py-1"
            >
              Practice
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>
            {open && (
              <div className="absolute left-0 top-full mt-2 w-44 rounded-xl bg-white border border-gray-200 py-2 text-xs shadow-lg">
                {["listening", "reading", "writing", "speaking"].map((key) => (
                  <Link
                    key={key}
                    to={`/practice/${key}`}
                    className="block px-4 py-2 capitalize text-gray-700 hover:bg-gray-50 hover:text-[#7E3AF2] transition-colors focus-ring"
                    onClick={() => setOpen(false)}
                  >
                    {key} practice
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              [
                "transition-colors hover:text-[#7E3AF2] focus-ring rounded-md px-2 py-1",
                isActive ? "text-[#7E3AF2] font-bold" : "text-gray-600"
              ].join(" ")
            }
          >
            Dashboard
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          {student ? (
            <>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7E3AF2]/10 border border-[#7E3AF2]/20 text-sm font-bold text-[#7E3AF2]">
                  {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                </span>
                <span className="text-sm font-semibold text-[#333333]">
                  {student.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full bg-gray-50 border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 hover:text-[#7E3AF2] transition-all ml-2 focus-ring"
                title="Logout"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-[#7E3AF2] transition-colors focus-ring rounded-md px-2 py-1"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

