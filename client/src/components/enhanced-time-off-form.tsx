import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Announcement } from "@shared/schema";

interface EnhancedTimeOffFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedTimeOffForm({ isOpen, onClose }: EnhancedTimeOffFormProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState<string>("paid");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch restricted periods
  const { data: restrictedPeriods = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/restricted-periods"],
    enabled: isOpen,
  });

  const createTimeOffMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/time-off-requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Time-off request submitted",
        description: "Your request has been sent for approval",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-off-requests"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error.message || "Failed to submit time-off request",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setLeaveType("paid");
    setIsHalfDay(false);
    setReason("");
    setValidationError("");
  };

  const validateDateRange = () => {
    if (!startDate || !endDate) {
      setValidationError("Please select both start and end dates");
      return false;
    }

    if (startDate > endDate) {
      setValidationError("Start date cannot be after end date");
      return false;
    }

    // Check against restricted periods
    for (const period of restrictedPeriods) {
      if (period.restrictedStartDate && period.restrictedEndDate) {
        const restrictedStart = parseISO(period.restrictedStartDate);
        const restrictedEnd = parseISO(period.restrictedEndDate);
        
        // Check if requested dates overlap with restricted period
        const hasOverlap = 
          isWithinInterval(startDate, { start: restrictedStart, end: restrictedEnd }) ||
          isWithinInterval(endDate, { start: restrictedStart, end: restrictedEnd }) ||
          (startDate <= restrictedStart && endDate >= restrictedEnd);

        if (hasOverlap) {
          setValidationError(
            `Time-off requests are not allowed during: ${period.title} (${format(restrictedStart, 'MMM d')} - ${format(restrictedEnd, 'MMM d, yyyy')})`
          );
          return false;
        }
      }
    }

    setValidationError("");
    return true;
  };

  const handleSubmit = () => {
    if (!validateDateRange()) {
      return;
    }

    if (!reason.trim()) {
      setValidationError("Please provide a reason for your time-off request");
      return;
    }

    createTimeOffMutation.mutate({
      startDate: format(startDate!, 'yyyy-MM-dd'),
      endDate: format(endDate!, 'yyyy-MM-dd'),
      reason: reason.trim(),
      type: leaveType,
      isHalfDay: isHalfDay,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Leave Type Selection */}
          <div className="space-y-3">
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                <SelectItem value="personal">Personal Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Half-day option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="halfDay"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="halfDay" className="text-sm">
              Half-day leave (4 hours or less)
            </Label>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date && endDate) {
                        setTimeout(validateDateRange, 100);
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      if (startDate && date) {
                        setTimeout(validateDateRange, 100);
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || (startDate ? date < startDate : false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
              <AlertTriangle className="h-4 w-4" />
              {validationError}
            </div>
          )}

          {/* Restricted Periods Warning */}
          {restrictedPeriods.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Notice: Restricted Periods</h4>
              <div className="space-y-1">
                {restrictedPeriods.map((period) => (
                  <div key={period.id} className="text-xs text-yellow-700">
                    <strong>{period.title}</strong>: {period.restrictedStartDate && period.restrictedEndDate ? 
                      `${format(parseISO(period.restrictedStartDate), 'MMM d')} - ${format(parseISO(period.restrictedEndDate), 'MMM d, yyyy')}` 
                      : 'Ongoing'
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Time Off *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide details about your time-off request..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError.includes("reason")) {
                  setValidationError("");
                }
              }}
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createTimeOffMutation.isPending || !!validationError}
            >
              {createTimeOffMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}