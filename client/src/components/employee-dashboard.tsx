import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle,
  User,
  Building2,
  TrendingUp,
  MessageCircle,
  CheckSquare,
  CalendarClock,
  Bell,
  LogOut,
  Play,
  Pause,
  AlertCircle
} from "lucide-react";
import { format, subDays, startOfWeek } from "date-fns";
import EnhancedCheckInModal from "./enhanced-check-in-modal";
import EnhancedTimeOffForm from "./enhanced-time-off-form";
import EmployeeChat from "./employee-chat";
import EmployeeTasks from "./employee-tasks";
import EmployeeShifts from "./employee-shifts";
import type { CheckIn, Schedule, Company, Task, Shift, Notification } from "@shared/schema";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => console.log("Location access denied:", error)
      );
    }
  }, []);

  // Fetch data
  const { data: activeCheckIn } = useQuery({
    queryKey: ["/api/check-ins/active"],
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["/api/check-ins"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  // Calculate stats
  const thisWeekCheckIns = checkIns.filter((checkIn) => {
    const checkInDate = new Date(checkIn.checkInTime);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return checkInDate >= weekStart;
  });

  const hoursWorkedThisWeek = thisWeekCheckIns
    .filter(checkIn => checkIn.checkOutTime)
    .reduce((total, checkIn) => {
      const hours = (new Date(checkIn.checkOutTime!).getTime() - new Date(checkIn.checkInTime).getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

  const sitesVisitedThisWeek = new Set(thisWeekCheckIns.map(c => c.companyId)).size;

  // Get today's schedules
  const todaySchedules = schedules.filter(schedule => {
    const today = new Date().toISOString().split('T')[0];
    return schedule.startDate === today;
  });

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Section */}
      <section className="px-4 py-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Check In/Out Card */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-map-marker-alt text-secondary text-xl"></i>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                {activeCheckIn ? "Check Out" : "Check In"}
              </h3>
              <p className="text-xs text-neutral-500 mb-3">
                {activeCheckIn ? "Currently at work" : "Start your work day"}
              </p>
              <Button
                onClick={() => setShowCheckInModal(true)}
                className={`w-full ${
                  activeCheckIn 
                    ? "bg-accent text-white hover:bg-accent/90" 
                    : "bg-secondary text-white hover:bg-secondary/90"
                }`}
              >
                <i className={`fas ${activeCheckIn ? "fa-sign-out-alt" : "fa-clock"} mr-1`}></i>
                {activeCheckIn ? "Check Out" : "Check In"}
              </Button>
            </div>
          </div>

          {/* Time Off Request */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-calendar-times text-warning text-xl"></i>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">Time Off</h3>
              <p className="text-xs text-neutral-500 mb-3">Request leave</p>
              <Button
                onClick={() => setShowTimeOffForm(true)}
                className="w-full bg-warning text-white hover:bg-warning/90"
              >
                <i className="fas fa-plus mr-1"></i>
                New Request
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Schedule */}
      <section className="px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Today's Schedule</h2>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {todaySchedules.map((schedule) => {
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
                    <Badge className={
                      schedule.status === 'active' ? 'bg-secondary text-white' :
                      schedule.status === 'completed' ? 'bg-neutral-500 text-white' :
                      'bg-neutral-200 text-neutral-600'
                    }>
                      {schedule.status}
                    </Badge>
                  </div>
                );
              })}
              {todaySchedules.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-calendar text-neutral-500"></i>
                  </div>
                  <p className="text-neutral-600">No schedules for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Weekly Stats */}
      <section className="px-4 py-2">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">This Week</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-neutral-900">
                {hoursWorkedThisWeek.toFixed(0)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">Hours Worked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">{sitesVisitedThisWeek}</div>
              <div className="text-xs text-neutral-500 mt-1">Sites Visited</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{thisWeekCheckIns.length}</div>
              <div className="text-xs text-neutral-500 mt-1">Check-ins</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-4 py-2">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {checkIns.slice(0, 3).map((checkIn) => {
                const company = companies.find(c => c.id === checkIn.companyId);
                return (
                  <div key={checkIn.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                      checkIn.status === 'checked_out' ? 'bg-secondary/10' : 'bg-primary/10'
                    }`}>
                      <i className={`fas ${
                        checkIn.status === 'checked_out' ? 'fa-check' : 'fa-clock'
                      } text-sm ${
                        checkIn.status === 'checked_out' ? 'text-secondary' : 'text-primary'
                      }`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        {checkIn.status === 'checked_out' ? 'Checked out from' : 'Checked in at'} {company?.name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {new Date(checkIn.checkInTime).toLocaleDateString()}, {new Date(checkIn.checkInTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {checkIns.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-history text-neutral-500"></i>
                  </div>
                  <p className="text-neutral-600">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Modals */}
      {showCheckInModal && (
        <EnhancedCheckInModal
          isOpen={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          companies={companies}
          location={location}
        />
      )}

      {showTimeOffForm && (
        <EnhancedTimeOffForm
          isOpen={showTimeOffForm}
          onClose={() => setShowTimeOffForm(false)}
        />
      )}
    </div>
  );
}
