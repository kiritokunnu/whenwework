import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Schedule() {
  const { user } = useAuth();

  // Fetch schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["/api/schedules"],
  });

  // Fetch companies for display
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-secondary text-white";
      case "completed":
        return "bg-neutral-500 text-white";
      case "cancelled":
        return "bg-accent text-white";
      default:
        return "bg-primary text-white";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      
      <div className="px-4 py-6 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Schedule</h1>
          {(user.role === "admin" || user.role === "manager") && (
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <i className="fas fa-plus mr-2"></i>
              Add Schedule
            </Button>
          )}
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-calendar-day text-primary"></i>
              <span>Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {schedules
                  .filter(schedule => {
                    const today = new Date().toISOString().split('T')[0];
                    return schedule.startDate === today;
                  })
                  .map((schedule) => {
                    const company = companies.find(c => c.id === schedule.companyId);
                    return (
                      <div key={schedule.id} className="flex items-center space-x-3 p-3 bg-secondary/5 rounded-lg">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">{schedule.title}</p>
                          <p className="text-sm text-neutral-500">
                            {company?.name} • {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </div>
                    );
                  })
                }
                {schedules.filter(s => s.startDate === new Date().toISOString().split('T')[0]).length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-calendar text-neutral-500"></i>
                    </div>
                    <p className="text-neutral-600">No schedules for today</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Schedules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-calendar-alt text-primary"></i>
              <span>Upcoming Schedules</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules
                .filter(schedule => {
                  const today = new Date().toISOString().split('T')[0];
                  return schedule.startDate > today;
                })
                .slice(0, 5)
                .map((schedule) => {
                  const company = companies.find(c => c.id === schedule.companyId);
                  return (
                    <div key={schedule.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <i className="fas fa-calendar text-primary text-sm"></i>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{schedule.title}</p>
                          <p className="text-sm text-neutral-500">
                            {company?.name}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {formatDate(schedule.startDate)} • {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(schedule.status)}>
                        {schedule.status}
                      </Badge>
                    </div>
                  );
                })
              }
              {schedules.filter(s => s.startDate > new Date().toISOString().split('T')[0]).length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-calendar-plus text-neutral-500"></i>
                  </div>
                  <p className="text-neutral-600">No upcoming schedules</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-chart-bar text-primary"></i>
              <span>This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-neutral-900">
                  {schedules.filter(s => {
                    const scheduleDate = new Date(s.startDate);
                    const now = new Date();
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                    return scheduleDate >= weekStart && scheduleDate <= weekEnd;
                  }).length}
                </div>
                <div className="text-xs text-neutral-500">Total Schedules</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-secondary">
                  {schedules.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-xs text-neutral-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">
                  {schedules.filter(s => s.status === 'scheduled').length}
                </div>
                <div className="text-xs text-neutral-500">Upcoming</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
