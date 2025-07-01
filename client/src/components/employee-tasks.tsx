import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckSquare, 
  Clock, 
  Camera, 
  MapPin, 
  AlertCircle,
  Play,
  Pause,
  CheckCircle,
  Upload,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Task, TaskUpdate } from "@shared/schema";

interface EmployeeTasksProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeTasks({ isOpen, onClose }: EmployeeTasksProps) {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updateComment, setUpdateComment] = useState("");
  const [taskPhoto, setTaskPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch employee's assigned tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/assigned"],
    enabled: isOpen,
  });

  // Fetch task updates for selected task
  const { data: taskUpdates = [] } = useQuery<TaskUpdate[]>({
    queryKey: ["/api/tasks", selectedTask?.id, "updates"],
    enabled: selectedTask !== null,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/tasks/${selectedTask?.id}/update`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Task updated",
        description: "Your task status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", selectedTask?.id, "updates"] });
      setUpdateComment("");
      setTaskPhoto(null);
    },
  });

  const startTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest(`/api/tasks/${taskId}/start`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      toast({
        title: "Task started",
        description: "You've started working on this task",
      });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/tasks/${selectedTask?.id}/complete`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      setSelectedTask(null);
      toast({
        title: "Task completed",
        description: "Great job! Task marked as completed",
      });
    },
  });

  // Get user location for location verification
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => {
          toast({
            title: "Location access denied",
            description: "Location verification is required for this task",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handlePhotoCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTaskPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startTimer = (taskId: number) => {
    setActiveTimer(taskId);
    setTimerStartTime(new Date());
    startTaskMutation.mutate(taskId);
  };

  const pauseTimer = () => {
    if (activeTimer && timerStartTime) {
      const hoursWorked = (new Date().getTime() - timerStartTime.getTime()) / (1000 * 60 * 60);
      updateTaskMutation.mutate({
        status: "in_progress",
        comment: "Timer paused",
        hoursWorked: hoursWorked.toFixed(2),
      });
    }
    setActiveTimer(null);
    setTimerStartTime(null);
  };

  const handleStatusUpdate = (status: string) => {
    if (!selectedTask) return;

    let updateData: any = {
      status,
      comment: updateComment,
    };

    // Add photo if required or provided
    if (selectedTask.requiresPhoto || taskPhoto) {
      if (!taskPhoto) {
        toast({
          title: "Photo required",
          description: "This task requires photo evidence",
          variant: "destructive",
        });
        return;
      }
      updateData.photoUrl = taskPhoto;
    }

    // Add location if required
    if (selectedTask.requiresLocation) {
      if (!location) {
        getCurrentLocation();
        return;
      }
      updateData.latitude = location.coords.latitude;
      updateData.longitude = location.coords.longitude;
    }

    // Add hours worked if timer was running
    if (activeTimer === selectedTask.id && timerStartTime) {
      const hoursWorked = (new Date().getTime() - timerStartTime.getTime()) / (1000 * 60 * 60);
      updateData.hoursWorked = hoursWorked.toFixed(2);
    }

    if (status === "completed") {
      completeTaskMutation.mutate(updateData);
    } else {
      updateTaskMutation.mutate(updateData);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "secondary";
      case "medium": return "outline";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskProgress = (task: Task) => {
    switch (task.status) {
      case "completed": return 100;
      case "in_progress": return 50;
      case "pending": return 0;
      default: return 0;
    }
  };

  const formatDueDate = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffInHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) {
      return { text: "Overdue", color: "text-red-600" };
    } else if (diffInHours < 24) {
      return { text: `Due in ${Math.round(diffInHours)}h`, color: "text-orange-600" };
    } else {
      return { text: format(due, "MMM d"), color: "text-muted-foreground" };
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            My Tasks
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pending" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              In Progress ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4 max-h-[450px] overflow-y-auto">
              {pendingTasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTask(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline" className={formatDueDate(task.dueDate).color}>
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDueDate(task.dueDate).text}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {task.requiresPhoto && (
                          <Badge variant="outline" className="text-xs">
                            <Camera className="h-3 w-3 mr-1" />
                            Photo Required
                          </Badge>
                        )}
                        {task.requiresLocation && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            Location Required
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startTimer(task.id);
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4 max-h-[450px] overflow-y-auto">
              {inProgressTasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTask(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                    
                    <Progress value={getTaskProgress(task)} className="mb-3" />
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {task.actualHours ? `${task.actualHours}h logged` : "No time logged"}
                      </div>
                      
                      <div className="flex gap-2">
                        {activeTimer === task.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              pauseTimer();
                            }}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startTimer(task.id);
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 max-h-[450px] overflow-y-auto">
              {completedTasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                  onClick={() => setSelectedTask(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold line-through">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Completed • {task.actualHours ? `${task.actualHours}h` : "No time logged"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={getPriorityColor(selectedTask.priority)}>
                  {selectedTask.priority} priority
                </Badge>
                <Badge className={getStatusColor(selectedTask.status)}>
                  {selectedTask.status.replace("_", " ")}
                </Badge>
              </div>

              <p className="text-sm">{selectedTask.description}</p>

              {selectedTask.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Due: {format(new Date(selectedTask.dueDate), "PPP p")}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Estimated:</span> {selectedTask.estimatedHours || "Not set"}h
                </div>
                <div>
                  <span className="font-medium">Actual:</span> {selectedTask.actualHours || 0}h
                </div>
              </div>

              {/* Requirements */}
              <div className="flex gap-2">
                {selectedTask.requiresPhoto && (
                  <Badge variant="outline">
                    <Camera className="h-3 w-3 mr-1" />
                    Photo Required
                  </Badge>
                )}
                {selectedTask.requiresLocation && (
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location Required
                  </Badge>
                )}
              </div>

              {/* Photo Capture */}
              {(selectedTask.requiresPhoto || selectedTask.status !== "completed") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Evidence</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePhotoCapture}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {taskPhoto ? "Retake Photo" : "Take Photo"}
                    </Button>
                    {selectedTask.requiresLocation && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        className={location ? "bg-green-50" : ""}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {location ? "Location Captured" : "Get Location"}
                      </Button>
                    )}
                  </div>
                  
                  {taskPhoto && (
                    <img src={taskPhoto} alt="Task photo" className="w-full max-w-sm rounded border" />
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Update Comment */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Progress Update</label>
                <Textarea
                  value={updateComment}
                  onChange={(e) => setUpdateComment(e.target.value)}
                  placeholder="Add a comment about your progress..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              {selectedTask.status !== "completed" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={updateTaskMutation.isPending}
                  >
                    Update Progress
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={updateTaskMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              )}

              {/* Task Updates History */}
              {taskUpdates.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Updates</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {taskUpdates.slice(0, 5).map((update) => (
                      <div key={update.id} className="text-xs bg-muted p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{update.status.replace("_", " ")}</span>
                          <span>{format(new Date(update.createdAt), "MMM d, h:mm a")}</span>
                        </div>
                        {update.comment && <p className="mt-1">{update.comment}</p>}
                        {update.hoursWorked && (
                          <p className="text-muted-foreground">Hours worked: {update.hoursWorked}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}