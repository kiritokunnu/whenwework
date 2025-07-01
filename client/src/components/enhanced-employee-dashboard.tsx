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
  AlertCircle,
  Users,
  Star
} from "lucide-react";
import { format, subDays, startOfWeek, isToday } from "date-fns";
import StreamlinedCheckInModal from "./streamlined-check-in-modal";
import EnhancedCheckInModal from "./enhanced-check-in-modal";
import EnhancedWorkSummaryModal from "./enhanced-work-summary-modal";
import EnhancedTimeOffForm from "./enhanced-time-off-form";
import EmployeeChat from "./employee-chat";
import EmployeeTasks from "./employee-tasks";
import EmployeeShifts from "./employee-shifts";
import NotificationPanel from "./notification-panel";
import type { CheckIn, Schedule, Company, Task, Shift, Notification, Product } from "@shared/schema";

export default function EnhancedEmployeeDashboard() {
  const { user } = useAuth();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showWorkSummaryModal, setShowWorkSummaryModal] = useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showShifts, setShowShifts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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

  // Fetch existing data
  const { data: activeCheckIn } = useQuery({
    queryKey: ["/api/check-ins/active"],
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const { data: checkIns = [] } = useQuery<CheckIn[]>({
    queryKey: ["/api/check-ins"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch new real-time features data
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/assigned"],
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts/employee"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Calculate enhanced stats
  const thisWeekCheckIns = (checkIns as CheckIn[]).filter((checkIn) => {
    const checkInDate = new Date(checkIn.checkInTime);
    const weekStart = startOfWeek(new Date());
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
  const todaySchedules = (schedules as Schedule[]).filter(schedule => {
    const today = new Date().toISOString().split('T')[0];
    return schedule.startDate === today;
  });

  // Real-time features stats
  const pendingTasks = (tasks as Task[]).filter(task => task.status === "pending");
  const activeTasks = (tasks as Task[]).filter(task => task.status === "in_progress");
  const completedTasksToday = (tasks as Task[]).filter(task => 
    task.status === "completed" && 
    isToday(new Date(task.updatedAt || task.createdAt))
  );
  
  const todayShifts = (shifts as Shift[]).filter(shift => {
    const shiftDate = new Date(shift.startTime);
    return isToday(shiftDate);
  });
  
  const unreadNotifications = (notifications as Notification[]).filter(notif => !notif.isRead);

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "in_progress": return "text-blue-600";
      case "pending": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  const getShiftStatus = (shift: Shift) => {
    const now = new Date();
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);

    if (now >= startTime && now <= endTime) return "active";
    if (now > endTime) return "completed";
    if (now < startTime) return "upcoming";
    return "scheduled";
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Notifications */}
      <section className="px-4 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          
          {/* Notification Bell */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => {
              if (activeCheckIn) {
                setShowWorkSummaryModal(true);
              } else {
                setShowCheckInModal(true);
              }
            }}
            className="h-auto p-4 flex flex-col items-center gap-2"
            variant={activeCheckIn ? "destructive" : "default"}
          >
            {activeCheckIn ? <LogOut className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
            <span className="text-sm">
              {activeCheckIn ? "Work Summary" : "Check In"}
            </span>
          </Button>

          <Button
            onClick={() => setShowTasks(true)}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-sm">My Tasks</span>
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingTasks.length}
              </Badge>
            )}
          </Button>

          <Button
            onClick={() => setShowShifts(true)}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <CalendarClock className="h-5 w-5" />
            <span className="text-sm">Shifts</span>
            {todayShifts.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {todayShifts.length}
              </Badge>
            )}
          </Button>

          <Button
            onClick={() => setShowChat(true)}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">Team Chat</span>
            {unreadNotifications.filter(n => n.type === "chat").length > 0 && (
              <Badge variant="secondary" className="text-xs">
                New
              </Badge>
            )}
          </Button>
        </div>
      </section>

      {/* Enhanced Stats Overview */}
      <section className="px-4">
        <h2 className="text-lg font-semibold mb-4">This Week Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hours Worked</p>
                  <p className="text-2xl font-bold">{hoursWorkedThisWeek.toFixed(1)}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sites Visited</p>
                  <p className="text-2xl font-bold">{sitesVisitedThisWeek}</p>
                </div>
                <Building2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{completedTasksToday.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                  <p className="text-2xl font-bold">{activeTasks.length}</p>
                </div>
                <Star className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Today's Schedule & Tasks */}
      <section className="px-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedules.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{schedule.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </p>
                      </div>
                      <Badge
                        variant={schedule.status === "completed" ? "default" : "secondary"}
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No scheduled appointments today</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowShifts(true)}
                  >
                    View All Shifts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTasks.length > 0 || pendingTasks.length > 0 ? (
                <div className="space-y-3">
                  {[...activeTasks.slice(0, 2), ...pendingTasks.slice(0, 2)].map((task) => (
                    <div
                      key={task.id}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                      onClick={() => setShowTasks(true)}
                    >
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={task.priority === "urgent" ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                          <span className={`text-xs ${getTaskStatusColor(task.status || "pending")}`}>
                            {(task.status || "pending").replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due {format(new Date(task.dueDate), "MMM d")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(activeTasks.length + pendingTasks.length) > 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowTasks(true)}
                    >
                      View All Tasks ({activeTasks.length + pendingTasks.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active tasks</p>
                  <p className="text-sm">Great job staying on top of your work!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Today's Shifts */}
      {todayShifts.length > 0 && (
        <section className="px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Today's Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {todayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{shift.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(shift.startTime), "h:mm a")} - {format(new Date(shift.endTime), "h:mm a")}
                      </p>
                    </div>
                    <Badge
                      variant={getShiftStatus(shift) === "active" ? "default" : "secondary"}
                    >
                      {getShiftStatus(shift)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Recent Activity */}
      <section className="px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {thisWeekCheckIns.slice(0, 3).map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex justify-between items-center p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      Visited {(companies as Company[]).find(c => c.id === checkIn.companyId)?.name || "Unknown Company"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(checkIn.checkInTime), "MMM d, h:mm a")}
                      {checkIn.checkOutTime && (
                        <> - {format(new Date(checkIn.checkOutTime), "h:mm a")}</>
                      )}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {checkIn.checkOutTime ? "Completed" : "Active"}
                  </Badge>
                </div>
              ))}
              
              {thisWeekCheckIns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowCheckInModal(true)}
                  >
                    Start Your First Check-in
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Additional Options */}
      <section className="px-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Need Time Off?</h3>
                <p className="text-sm text-muted-foreground">
                  Submit a time-off request for approval
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowTimeOffForm(true)}>
                Request Time Off
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Modals */}
      <StreamlinedCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        companies={companies as Company[]}
        isCheckOut={false}
      />

      <StreamlinedCheckInModal
        isOpen={showCheckOutModal}
        onClose={() => setShowCheckOutModal(false)}
        companies={companies as Company[]}
        isCheckOut={true}
        activeCheckIn={activeCheckIn}
      />

      <EnhancedWorkSummaryModal
        isOpen={showWorkSummaryModal}
        onClose={() => setShowWorkSummaryModal(false)}
        checkInId={activeCheckIn?.id || 0}
        products={products || []}
      />

      <EnhancedTimeOffForm
        isOpen={showTimeOffForm}
        onClose={() => setShowTimeOffForm(false)}
      />

      <EmployeeChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      <EmployeeTasks
        isOpen={showTasks}
        onClose={() => setShowTasks(false)}
      />

      <EmployeeShifts
        isOpen={showShifts}
        onClose={() => setShowShifts(false)}
      />
      
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}