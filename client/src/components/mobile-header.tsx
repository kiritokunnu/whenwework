import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MobileHeader() {
  const { user } = useAuth();

  // Fetch user's company for display
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const userCompany = companies.find(c => c.id === user?.companyId);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-briefcase text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">WorkForce Manager</h1>
              <p className="text-xs text-neutral-500">
                {userCompany?.name || "No Company Assigned"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="relative p-2 text-neutral-600 hover:text-primary">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </button>
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl} alt={`${user?.firstName} ${user?.lastName}`} />
              <AvatarFallback className="bg-primary text-white text-xs">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
