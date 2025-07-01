import { useLocation } from "wouter";

const navItems = [
  { id: "dashboard", path: "/", icon: "fas fa-home", label: "Dashboard" },
  { id: "schedule", path: "/schedule", icon: "fas fa-calendar", label: "Schedule" },
  { id: "checkin", path: "/check-in", icon: "fas fa-map-marker-alt", label: "Check-in" },
  { id: "reports", path: "/reports", icon: "fas fa-chart-bar", label: "Reports" },
  { id: "profile", path: "/profile", icon: "fas fa-user", label: "Profile" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-2 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive(item.path) ? "text-primary" : "text-neutral-500"
            }`}
          >
            <i className={`${item.icon} text-lg`}></i>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
