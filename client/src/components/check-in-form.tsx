import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle, LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Company, CheckIn, InsertCheckIn } from "@shared/schema";

export default function CheckInForm() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: activeCheckIn } = useQuery<CheckIn | null>({
    queryKey: ["/api/check-ins/active"],
  });

  const checkInMutation = useMutation({
    mutationFn: async (data: InsertCheckIn) => {
      const response = await apiRequest("POST", "/api/check-ins", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully checked in!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
      setSelectedCompanyId("");
      setNotes("");
      setLocation(null);
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (checkInId: number) => {
      const response = await apiRequest("PATCH", `/api/check-ins/${checkInId}`, {
        checkOutTime: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully checked out!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to check out",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsGettingLocation(false);
        toast({
          title: "Location captured",
          description: "Your current location has been recorded",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location error",
          description: "Could not get your current location. Please try again.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleCheckIn = () => {
    if (!selectedCompanyId) {
      toast({
        title: "Company required",
        description: "Please select a company to check in to",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "Location required",
        description: "Please capture your location before checking in",
        variant: "destructive",
      });
      return;
    }

    const checkInData: InsertCheckIn = {
      companyId: parseInt(selectedCompanyId),
      latitude: location.latitude,
      longitude: location.longitude,
      checkInTime: new Date().toISOString(),
      notes: notes || undefined,
    };

    checkInMutation.mutate(checkInData);
  };

  const handleCheckOut = () => {
    if (activeCheckIn) {
      checkOutMutation.mutate(activeCheckIn.id);
    }
  };

  const getCompanyName = (companyId: number) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || "Unknown Company";
  };

  if (activeCheckIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Currently Checked In
          </CardTitle>
          <CardDescription>
            You are currently checked in to {getCompanyName(activeCheckIn.companyId)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Checked in at: {new Date(activeCheckIn.checkInTime).toLocaleString()}
          </div>
          
          {activeCheckIn.notes && (
            <div className="text-sm">
              <strong>Notes:</strong> {activeCheckIn.notes}
            </div>
          )}

          <Button 
            onClick={handleCheckOut}
            disabled={checkOutMutation.isPending}
            className="w-full"
            variant="destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {checkOutMutation.isPending ? "Checking out..." : "Check Out"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Check In
        </CardTitle>
        <CardDescription>
          Select a company and capture your location to check in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Company</label>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a company to visit" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">{company.name}</div>
                      {company.address && (
                        <div className="text-xs text-muted-foreground">{company.address}</div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <div className="flex items-center gap-2">
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              variant="outline"
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isGettingLocation ? "Getting location..." : "Capture Current Location"}
            </Button>
            {location && (
              <Badge variant="default">
                Location captured
              </Badge>
            )}
          </div>
          {location && (
            <div className="text-xs text-muted-foreground">
              Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes (Optional)</label>
          <Textarea
            placeholder="Add any notes about your visit..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={checkInMutation.isPending || !selectedCompanyId || !location}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {checkInMutation.isPending ? "Checking in..." : "Check In"}
        </Button>
      </CardContent>
    </Card>
  );
}