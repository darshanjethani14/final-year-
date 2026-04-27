import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/results", label: "Test History" },
  { to: "/profile", label: "Profile" }
];

function Sidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 border-r border-gray-200 bg-white px-4 py-6 md:block">
      <nav className="space-y-2 text-sm font-semibold">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex items-center justify-between rounded-lg px-4 py-3 transition-all duration-200 focus-ring",
                isActive
                  ? "bg-[#7E3AF2]/10 text-[#7E3AF2]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#7E3AF2]"
              ].join(" ")
            }
          >
            <span>{item.label}</span>
            {item.to === "/dashboard" && (
              <span className="rounded-full bg-[#7E3AF2]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#7E3AF2]">
                Live
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
