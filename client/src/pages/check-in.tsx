import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CheckInModal from "@/components/check-in-modal";

export default function CheckIn() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [notes, setNotes] = useState("");

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enable location services.",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  // Fetch active check-in
  const { data: activeCheckIn } = useQuery({
    queryKey: ["/api/check-ins/active"],
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!activeCheckIn || !location) return;
      
      const response = await apiRequest("PATCH", `/api/check-ins/${activeCheckIn.id}`, {
        checkOutTime: new Date().toISOString(),
        checkOutLatitude: location.coords.latitude.toString(),
        checkOutLongitude: location.coords.longitude.toString(),
        status: "checked_out",
        notes: notes || activeCheckIn.notes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Checked Out Successfully",
        description: "Your work session has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Check-out Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckOut = () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location services to check out.",
        variant: "destructive",
      });
      return;
    }
    checkOutMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      
      <div className="px-4 py-6 pb-24 space-y-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-clock text-primary"></i>
              <span>Current Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCheckIn ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
                  <div>
                    <p className="font-semibold text-secondary">Checked In</p>
                    <p className="text-sm text-neutral-600">
                      Since {new Date(activeCheckIn.checkInTime).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Company: {companies.find(c => c.id === activeCheckIn.companyId)?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-700">
                    Add Notes (Optional)
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about your work session..."
                    rows={3}
                  />
                </div>
                
                <Button
                  onClick={handleCheckOut}
                  disabled={checkOutMutation.isPending || !location}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  size="lg"
                >
                  {checkOutMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Checking Out...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Check Out Now
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-clock text-neutral-500 text-xl"></i>
                </div>
                <p className="text-neutral-600 mb-4">You are not currently checked in</p>
                <Button
                  onClick={() => setShowModal(true)}
                  disabled={!location}
                  className="bg-secondary hover:bg-secondary/90 text-white"
                  size="lg"
                >
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  Check In Now
                </Button>
                {!location && (
                  <p className="text-sm text-neutral-500 mt-2">
                    Waiting for location access...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-neutral-900">8</div>
              <div className="text-sm text-neutral-500">Hours Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-secondary">3</div>
              <div className="text-sm text-neutral-500">Sites Visited</div>
            </CardContent>
          </Card>
        </div>

        {/* Location Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                location ? 'bg-secondary/10' : 'bg-neutral-200'
              }`}>
                <i className={`fas fa-map-marker-alt ${
                  location ? 'text-secondary' : 'text-neutral-500'
                }`}></i>
              </div>
              <div>
                <p className="font-medium text-neutral-900">
                  {location ? 'Location Available' : 'Getting Location...'}
                </p>
                <p className="text-sm text-neutral-500">
                  {location 
                    ? `Accuracy: ${location.coords.accuracy.toFixed(0)}m`
                    : 'Location services required for check-in'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
      
      {showModal && (
        <CheckInModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          companies={companies}
          location={location}
        />
      )}
    </div>
  );
}
