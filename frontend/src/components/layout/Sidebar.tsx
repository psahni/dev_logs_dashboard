"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";

type NavItem = { label: string; href: string };

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Workspace",
    items: [
      { label: "Home", href: "/" },
      { label: "Activity Log", href: "/activity" },
    ],
  },
  {
    heading: "Surfaces",
    items: [
      { label: "Commits", href: "/commits" },
      { label: "Pull Requests", href: "/pulls" },
    ],
  },
  {
    heading: "Generate",
    items: [
      { label: "Standup", href: "/standup" },
      { label: "Confluence Doc", href: "/confluence" },
    ],
  },
  {
    heading: "Account",
    items: [{ label: "Settings", href: "/settings" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">DevPulse</div>

      <div style={{ flex: 1, paddingTop: "0.5rem" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} style={{ marginBottom: "0.25rem" }}>
            <div className="sidebar-section-label">{group.heading}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link${pathname === item.href ? " active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
        </button>
        <span className="version-badge">v0.2.0</span>
      </div>
    </nav>
  );
}
