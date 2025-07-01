import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Clock, Building2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Company } from "@shared/schema";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  isCheckOut?: boolean;
  activeCheckIn?: any;
}

export default function StreamlinedCheckInModal({
  isOpen,
  onClose,
  companies,
  isCheckOut = false,
  activeCheckIn
}: CheckInModalProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && !isCheckOut) {
      getCurrentLocation();
    }
  }, [isOpen, isCheckOut]);

  const checkInMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isCheckOut ? "/api/check-ins/checkout" : "/api/check-ins";
      return await apiRequest(endpoint, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: isCheckOut ? "Checked out successfully" : "Checked in successfully",
        description: isCheckOut 
          ? "You can now add your work summary" 
          : "Your location and check-in time have been recorded",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: isCheckOut ? "Check-out failed" : "Check-in failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location services and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const resetForm = () => {
    setSelectedCompany("");
    setNotes("");
    setLocation(null);
    setLocationError("");
  };

  const handleSubmit = () => {
    if (!isCheckOut) {
      if (!selectedCompany) {
        toast({
          title: "Company required",
          description: "Please select a company for check-in",
          variant: "destructive",
        });
        return;
      }

      if (!location) {
        toast({
          title: "Location required",
          description: "Please allow location access to check in",
          variant: "destructive",
        });
        return;
      }
    }

    const data = isCheckOut 
      ? {
          checkInId: activeCheckIn?.id,
          notes: notes || undefined,
        }
      : {
          companyId: parseInt(selectedCompany),
          latitude: location!.latitude,
          longitude: location!.longitude,
          notes: notes || undefined,
        };

    checkInMutation.mutate(data);
  };

  const canSubmit = isCheckOut 
    ? !checkInMutation.isPending
    : !checkInMutation.isPending && selectedCompany && location;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCheckOut ? (
              <>
                <Clock className="h-5 w-5" />
                Check Out
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5" />
                Check In
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isCheckOut && (
            <>
              {/* Location Status */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <MapPin className={`h-5 w-5 ${location ? "text-green-600" : "text-orange-500"}`} />
                    <div className="flex-1">
                      {isGettingLocation ? (
                        <div className="text-sm text-muted-foreground">Getting your location...</div>
                      ) : location ? (
                        <div className="text-sm text-green-600">
                          Location captured successfully
                        </div>
                      ) : locationError ? (
                        <div className="space-y-2">
                          <div className="text-sm text-destructive flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {locationError}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={getCurrentLocation}
                          >
                            Try Again
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Location is required for check-in
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Selection */}
              <div className="space-y-2">
                <Label htmlFor="company">Select Company *</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a company to visit">
                      {selectedCompany && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {companies.find(c => c.id === parseInt(selectedCompany))?.name}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.address && (
                              <div className="text-xs text-muted-foreground">
                                {company.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {isCheckOut && activeCheckIn && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Check-out Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{activeCheckIn.company?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in time:</span>
                  <span className="font-medium">
                    {new Date(activeCheckIn.checkInTime).toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {isCheckOut ? "Check-out Notes (Optional)" : "Check-in Notes (Optional)"}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isCheckOut 
                ? "Any notes about your departure..." 
                : "Any notes about your arrival or the visit..."
              }
              rows={3}
            />
          </div>

          {isCheckOut && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Next Step:</strong> After checking out, you'll be prompted to add a work summary 
                with details about products used and the work performed.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
            className="min-w-[120px]"
          >
            {checkInMutation.isPending 
              ? (isCheckOut ? "Checking out..." : "Checking in...") 
              : (isCheckOut ? "Check Out" : "Check In")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}