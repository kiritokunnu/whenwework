import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SiteManagement from "./site-management";
import EmployeeManagement from "./employee-management";
import ScheduleManagement from "./schedule-management";

export default function ManagerDashboard() {
  const [showSiteDialog, setShowSiteDialog] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["/api/check-ins"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ["/api/time-off-requests"],
  });

  // Calculate stats
  const activeEmployees = (users as any[]).filter((u: any) => u.isActive && u.role === 'employee').length;
  const todayCheckIns = (checkIns as any[]).filter((c: any) => {
    const today = new Date().toISOString().split('T')[0];
    return new Date(c.checkInTime).toISOString().split('T')[0] === today;
  });
  const onDutyToday = todayCheckIns.filter((c: any) => c.status === 'checked_in').length;
  const pendingRequests = (timeOffRequests as any[]).filter((r: any) => r.status === 'pending');

  // Approve/Reject time-off requests
  const updateTimeOffMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      return await apiRequest(`/api/time-off-requests/${id}`, "PATCH", { status, rejectionReason });
    },
    onSuccess: () => {
      toast({
        title: "Request updated",
        description: "Time-off request status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-off-requests"] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <section className="px-4 py-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Team Overview</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{activeEmployees}</div>
                  <div className="text-sm text-neutral-500">Active Employees</div>
                </div>
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-secondary"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{onDutyToday}</div>
                  <div className="text-sm text-neutral-500">On Duty Today</div>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-primary"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Management Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="p-3 h-auto flex flex-col items-center space-y-2"
            onClick={() => setShowEmployeeDialog(true)}
          >
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <i className="fas fa-plus text-primary text-sm"></i>
            </div>
            <div className="text-xs font-medium text-neutral-900">Add Employee</div>
          </Button>
          <Button
            variant="outline"
            className="p-3 h-auto flex flex-col items-center space-y-2"
            onClick={() => setShowSiteDialog(true)}
          >
            <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
              <i className="fas fa-building text-secondary text-sm"></i>
            </div>
            <div className="text-xs font-medium text-neutral-900">Manage Sites</div>
          </Button>
          <Button
            variant="outline"
            className="p-3 h-auto flex flex-col items-center space-y-2"
            onClick={() => setShowScheduleDialog(true)}
          >
            <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
              <i className="fas fa-calendar text-warning text-sm"></i>
            </div>
            <div className="text-xs font-medium text-neutral-900">Schedule</div>
          </Button>
        </div>
      </section>

      {/* Pending Approvals */}
      <section className="px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Pending Approvals</h2>
          {pendingRequests.length > 0 && (
            <Badge className="bg-accent text-white">{pendingRequests.length}</Badge>
          )}
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {pendingRequests.slice(0, 3).map((request) => {
                const employee = users.find(u => u.id === request.employeeId);
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
                        <i className="fas fa-calendar-times text-warning text-sm"></i>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {employee?.firstName} {employee?.lastName}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Time off request - {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-secondary hover:bg-secondary/90 text-white"
                        onClick={() => updateTimeOffMutation.mutate({ id: request.id, status: 'approved' })}
                        disabled={updateTimeOffMutation.isPending}
                      >
                        <i className="fas fa-check text-xs"></i>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-accent border-accent hover:bg-accent hover:text-white"
                        onClick={() => updateTimeOffMutation.mutate({ id: request.id, status: 'rejected', rejectionReason: 'Rejected by manager' })}
                        disabled={updateTimeOffMutation.isPending}
                      >
                        <i className="fas fa-times text-xs"></i>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {pendingRequests.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-check-circle text-neutral-500"></i>
                  </div>
                  <p className="text-neutral-600">No pending approvals</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Site Activity */}
      <section className="px-4 py-2">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Site Activity Today</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {companies.slice(0, 3).map((company) => {
                const companyCheckIns = todayCheckIns.filter(c => c.companyId === company.id);
                const activeCount = companyCheckIns.filter(c => c.status === 'checked_in').length;
                
                return (
                  <div key={company.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                        <i className="fas fa-building text-secondary"></i>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{company.name}</p>
                        <p className="text-sm text-neutral-500">
                          {activeCount} {activeCount === 1 ? 'employee' : 'employees'} active
                        </p>
                      </div>
                    </div>
                    <Badge className={activeCount > 0 ? "bg-secondary text-white" : "bg-neutral-200 text-neutral-600"}>
                      {activeCount > 0 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Analytics Preview */}
      <section className="px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Weekly Analytics</h2>
          <Button variant="ghost" className="text-primary text-sm font-medium">
            View Report
          </Button>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-neutral-900">
                  {checkIns.reduce((total, checkIn) => {
                    if (!checkIn.checkOutTime) return total;
                    const hours = (new Date(checkIn.checkOutTime).getTime() - new Date(checkIn.checkInTime).getTime()) / (1000 * 60 * 60);
                    return total + hours;
                  }, 0).toFixed(0)}
                </div>
                <div className="text-xs text-neutral-500">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-secondary">{checkIns.length}</div>
                <div className="text-xs text-neutral-500">Site Visits</div>
              </div>
            </div>
            <div className="h-24 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
              <p className="text-sm text-neutral-500">Analytics chart coming soon</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Dialogs */}
      <Dialog open={showSiteDialog} onOpenChange={setShowSiteDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Manage Sites</DialogTitle>
          </DialogHeader>
          <SiteManagement />
        </DialogContent>
      </Dialog>

      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Employee Management</DialogTitle>
          </DialogHeader>
          <EmployeeManagement />
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Schedule Management</DialogTitle>
          </DialogHeader>
          <ScheduleManagement />
        </DialogContent>
      </Dialog>
    </div>
  );
}
