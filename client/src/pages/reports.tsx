import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleGuard from "@/components/role-guard";

export default function Reports() {
  const { user } = useAuth();

  // Fetch check-ins for reports
  const { data: checkIns = [] } = useQuery({
    queryKey: ["/api/check-ins"],
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  // Calculate stats
  const totalHoursThisWeek = checkIns
    .filter((checkIn) => {
      if (!checkIn.checkOutTime) return false;
      const checkInDate = new Date(checkIn.checkInTime);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      return checkInDate >= weekStart;
    })
    .reduce((total, checkIn) => {
      if (!checkIn.checkOutTime) return total;
      const hours = (new Date(checkIn.checkOutTime).getTime() - new Date(checkIn.checkInTime).getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

  const sitesVisitedThisWeek = new Set(
    checkIns
      .filter((checkIn) => {
        const checkInDate = new Date(checkIn.checkInTime);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return checkInDate >= weekStart;
      })
      .map((checkIn) => checkIn.companyId)
  ).size;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      
      <div className="px-4 py-6 pb-24 space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">Reports & Analytics</h1>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <RoleGuard allowedRoles={["admin", "manager"]}>
              <TabsTrigger value="team">Team</TabsTrigger>
            </RoleGuard>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            {/* Personal Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-neutral-900">
                    {totalHoursThisWeek.toFixed(1)}
                  </div>
                  <div className="text-sm text-neutral-500">Hours This Week</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {sitesVisitedThisWeek}
                  </div>
                  <div className="text-sm text-neutral-500">Sites Visited</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-history text-primary"></i>
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checkIns.slice(0, 5).map((checkIn) => {
                    const company = companies.find(c => c.id === checkIn.companyId);
                    const duration = checkIn.checkOutTime 
                      ? ((new Date(checkIn.checkOutTime).getTime() - new Date(checkIn.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(1)
                      : null;

                    return (
                      <div key={checkIn.id} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                          checkIn.status === 'checked_out' ? 'bg-secondary/10' : 'bg-primary/10'
                        }`}>
                          <i className={`fas ${checkIn.status === 'checked_out' ? 'fa-check' : 'fa-clock'} text-sm ${
                            checkIn.status === 'checked_out' ? 'text-secondary' : 'text-primary'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">
                            {company?.name || 'Unknown Company'}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {new Date(checkIn.checkInTime).toLocaleDateString()} • 
                            {new Date(checkIn.checkInTime).toLocaleTimeString()}
                            {duration && ` • ${duration}h`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {checkIns.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-chart-line text-neutral-500"></i>
                      </div>
                      <p className="text-neutral-600">No activity yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-neutral-500">Chart visualization coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <RoleGuard allowedRoles={["admin", "manager"]}>
            <TabsContent value="team" className="space-y-6">
              {/* Team Overview */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-neutral-900">
                      {checkIns.length}
                    </div>
                    <div className="text-sm text-neutral-500">Total Check-ins</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {companies.length}
                    </div>
                    <div className="text-sm text-neutral-500">Active Sites</div>
                  </CardContent>
                </Card>
              </div>

              {/* Company Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-building text-primary"></i>
                    <span>Company Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {companies.map((company) => {
                      const companyCheckIns = checkIns.filter(c => c.companyId === company.id);
                      return (
                        <div key={company.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                              <i className="fas fa-building text-secondary"></i>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">{company.name}</p>
                              <p className="text-sm text-neutral-500">
                                {companyCheckIns.length} visits
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-primary">
                            {companyCheckIns.length > 0 ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </RoleGuard>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
