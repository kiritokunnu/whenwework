import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  ArrowRightLeft,
  Bell,
  CheckCircle,
  XCircle,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import type { Shift, ShiftSwapRequest, User } from "@shared/schema";

interface EmployeeShiftsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeShifts({ isOpen, onClose }: EmployeeShiftsProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [swapType, setSwapType] = useState<"swap" | "coverage">("swap");
  const [swapReason, setSwapReason] = useState("");
  const [targetEmployee, setTargetEmployee] = useState("");
  const [targetShift, setTargetShift] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch employee's shifts
  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts/employee"],
    enabled: isOpen,
  });

  // Fetch available employees for swap
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: showSwapDialog,
  });

  // Fetch shift swap requests
  const { data: swapRequests = [] } = useQuery<ShiftSwapRequest[]>({
    queryKey: ["/api/shifts/swap-requests"],
    enabled: isOpen,
  });

  // Fetch other employees' shifts for swapping
  const { data: availableShifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts/available", targetEmployee],
    enabled: showSwapDialog && targetEmployee && swapType === "swap",
  });

  const createSwapRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/shifts/swap-requests", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Swap request submitted",
        description: "Your shift swap request has been sent for approval",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/swap-requests"] });
      setShowSwapDialog(false);
      resetSwapForm();
    },
  });

  const respondToSwapMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "accept" | "reject" }) => {
      return await apiRequest(`/api/shifts/swap-requests/${id}/${action}`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/swap-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/employee"] });
      toast({
        title: "Request updated",
        description: "Shift swap request has been processed",
      });
    },
  });

  const resetSwapForm = () => {
    setSwapType("swap");
    setSwapReason("");
    setTargetEmployee("");
    setTargetShift("");
  };

  const handleSwapRequest = () => {
    if (!selectedShift || !swapReason.trim()) return;

    const requestData: any = {
      originalShiftId: selectedShift.id,
      reason: swapReason.trim(),
      coverageOnly: swapType === "coverage",
    };

    if (swapType === "swap" && targetShift) {
      requestData.targetShiftId = parseInt(targetShift);
    }

    createSwapRequestMutation.mutate(requestData);
  };

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.startTime), date)
    );
  };

  const getShiftsForWeek = (date: Date) => {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);
    
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= weekStart && shiftDate <= weekEnd;
    });
  };

  const getShiftStatus = (shift: Shift) => {
    const now = new Date();
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);

    if (shift.status === "cancelled") return "cancelled";
    if (shift.status === "completed") return "completed";
    if (now >= startTime && now <= endTime) return "active";
    if (now > endTime) return "completed";
    if (now < startTime) return "upcoming";
    return "scheduled";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "upcoming": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatShiftTime = (shift: Shift) => {
    const start = format(new Date(shift.startTime), "h:mm a");
    const end = format(new Date(shift.endTime), "h:mm a");
    return `${start} - ${end}`;
  };

  const calculateShiftDuration = (shift: Shift) => {
    const start = new Date(shift.startTime);
    const end = new Date(shift.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return duration.toFixed(1);
  };

  const mySwapRequests = swapRequests.filter(req => req.requesterId === user?.id);
  const incomingSwapRequests = swapRequests.filter(req => 
    shifts.some(shift => shift.id === req.targetShiftId)
  );
  const pendingRequests = swapRequests.filter(req => req.status === "pending");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            My Shifts & Schedule
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="calendar" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="swaps">
              Shift Swaps ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Schedule Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    modifiers={{
                      hasShift: (date) => getShiftsForDate(date).length > 0,
                    }}
                    modifiersStyles={{
                      hasShift: { backgroundColor: "rgb(59 130 246 / 0.1)" },
                    }}
                  />
                </CardContent>
              </Card>

              {/* Daily Shifts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getShiftsForDate(selectedDate).map((shift) => (
                      <Card
                        key={shift.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedShift(shift)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{shift.title}</h4>
                            <Badge className={getStatusColor(getShiftStatus(shift))}>
                              {getShiftStatus(shift)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatShiftTime(shift)}
                            </div>
                            <span>{calculateShiftDuration(shift)}h</span>
                          </div>

                          {shift.overtimeHours && parseFloat(shift.overtimeHours) > 0 && (
                            <Badge variant="outline" className="mt-2">
                              +{shift.overtimeHours}h OT
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {getShiftsForDate(selectedDate).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No shifts scheduled for this day</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="space-y-4 max-h-[450px] overflow-y-auto">
              {shifts
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((shift) => (
                  <Card
                    key={shift.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedShift(shift)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{shift.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(shift.startTime), "EEEE, MMMM d")}
                          </p>
                        </div>
                        <Badge className={getStatusColor(getShiftStatus(shift))}>
                          {getShiftStatus(shift)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Time:</span>
                          <p className="font-medium">{formatShiftTime(shift)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <p className="font-medium">{calculateShiftDuration(shift)}h</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium capitalize">{getShiftStatus(shift)}</p>
                        </div>
                      </div>

                      {getShiftStatus(shift) === "upcoming" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedShift(shift);
                              setShowSwapDialog(true);
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            Request Swap
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="swaps" className="space-y-4">
            <Tabs defaultValue="my-requests">
              <TabsList>
                <TabsTrigger value="my-requests">
                  My Requests ({mySwapRequests.length})
                </TabsTrigger>
                <TabsTrigger value="incoming">
                  Incoming ({incomingSwapRequests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-requests" className="space-y-4">
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {mySwapRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">
                              {request.coverageOnly ? "Coverage Request" : "Shift Swap"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Requested {format(new Date(request.createdAt), "MMM d")}
                            </p>
                          </div>
                          <Badge variant={
                            request.status === "approved" ? "default" :
                            request.status === "rejected" ? "destructive" : "secondary"
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-2">{request.reason}</p>
                        
                        {request.status === "rejected" && request.rejectionReason && (
                          <div className="bg-red-50 p-2 rounded text-sm">
                            <strong>Rejection reason:</strong> {request.rejectionReason}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {mySwapRequests.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No swap requests submitted</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="incoming" className="space-y-4">
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {incomingSwapRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">
                              Swap Request from {request.requesterId}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(request.createdAt), "MMM d")}
                            </p>
                          </div>
                          <Badge variant="secondary">{request.status}</Badge>
                        </div>
                        
                        <p className="text-sm mb-3">{request.reason}</p>
                        
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => respondToSwapMutation.mutate({ 
                                id: request.id, 
                                action: "accept" 
                              })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondToSwapMutation.mutate({ 
                                id: request.id, 
                                action: "reject" 
                              })}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {incomingSwapRequests.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No incoming swap requests</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Shift Detail Dialog */}
      {selectedShift && !showSwapDialog && (
        <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedShift.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <p className="font-medium">
                    {format(new Date(selectedShift.startTime), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <p className="font-medium">{formatShiftTime(selectedShift)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <p className="font-medium">{calculateShiftDuration(selectedShift)} hours</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(getShiftStatus(selectedShift))}>
                    {getShiftStatus(selectedShift)}
                  </Badge>
                </div>
              </div>

              {selectedShift.breakDuration && selectedShift.breakDuration > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Break Duration:</span>
                  <p className="font-medium">{selectedShift.breakDuration} minutes</p>
                </div>
              )}

              {getShiftStatus(selectedShift) === "upcoming" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowSwapDialog(true);
                    }}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Request Swap/Coverage
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Swap Request Dialog */}
      {showSwapDialog && selectedShift && (
        <Dialog open={showSwapDialog} onOpenChange={() => {
          setShowSwapDialog(false);
          resetSwapForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Shift Change</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Current Shift:</span>
                <p className="font-medium">
                  {selectedShift.title} - {format(new Date(selectedShift.startTime), "MMM d, h:mm a")}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Request Type</label>
                <Select value={swapType} onValueChange={(value: "swap" | "coverage") => setSwapType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="swap">Shift Swap</SelectItem>
                    <SelectItem value="coverage">Coverage Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {swapType === "swap" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Swap with Employee</label>
                  <Select value={targetEmployee} onValueChange={setTargetEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter(emp => emp.id !== user?.id)
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {swapType === "swap" && targetEmployee && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Their Shift</label>
                  <Select value={targetShift} onValueChange={setTargetShift}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift to swap" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableShifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id.toString()}>
                          {shift.title} - {format(new Date(shift.startTime), "MMM d, h:mm a")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Request</label>
                <Textarea
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Please explain why you need this change..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSwapDialog(false);
                    resetSwapForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSwapRequest}
                  disabled={
                    !swapReason.trim() ||
                    (swapType === "swap" && (!targetEmployee || !targetShift)) ||
                    createSwapRequestMutation.isPending
                  }
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}