import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: any[];
  location: GeolocationPosition | null;
}

export default function CheckInModal({ isOpen, onClose, companies, location }: CheckInModalProps) {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(location);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current location when modal opens
  useEffect(() => {
    if (isOpen && !currentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation(position),
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enable location services.",
            variant: "destructive",
          });
        }
      );
    }
  }, [isOpen, currentLocation, toast]);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany || !currentLocation) return;
      
      const response = await apiRequest("POST", "/api/check-ins", {
        companyId: selectedCompany,
        checkInLatitude: currentLocation.coords.latitude.toString(),
        checkInLongitude: currentLocation.coords.longitude.toString(),
        notes: notes || null,
        status: "checked_in",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Checked In Successfully",
        description: "Your location and time have been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
      onClose();
      setSelectedCompany(null);
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = () => {
    if (!selectedCompany) {
      toast({
        title: "Please select a company",
        description: "Choose your work location to check in.",
        variant: "destructive",
      });
      return;
    }
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Please enable location services to check in.",
        variant: "destructive",
      });
      return;
    }
    checkInMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-map-marker-alt text-secondary text-2xl"></i>
            </div>
            <DialogTitle className="text-lg">Check In Location</DialogTitle>
            <p className="text-sm text-neutral-500 mt-2">Select your work location for today</p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompany(company.id)}
                className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                  selectedCompany === company.id
                    ? "border-primary bg-primary/5"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-building text-secondary"></i>
                    <div>
                      <p className="font-medium text-neutral-900">{company.name}</p>
                      <p className="text-sm text-neutral-500">{company.address || "Work Location"}</p>
                    </div>
                  </div>
                  {selectedCompany === company.id && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs"></i>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {companies.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-building text-neutral-500"></i>
              </div>
              <p className="text-neutral-600">No companies available</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your work session..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <div className={`w-2 h-2 rounded-full ${currentLocation ? 'bg-secondary' : 'bg-neutral-400'}`}></div>
            <span>
              {currentLocation 
                ? `Location acquired (±${currentLocation.coords.accuracy.toFixed(0)}m)`
                : 'Getting location...'
              }
            </span>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending || !selectedCompany || !currentLocation}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
            >
              {checkInMutation.isPending ? "Checking In..." : "Check In"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
