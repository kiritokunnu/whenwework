import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-briefcase text-white text-2xl"></i>
          </div>
          
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            WorkForce Manager
          </h1>
          
          <p className="text-neutral-600 mb-8">
            Professional workforce management with location-based check-ins, 
            company visit tracking, and team management for field agents.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-map-marker-alt text-secondary text-sm"></i>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Location Check-ins</p>
                <p className="text-sm text-neutral-500">GPS-based attendance tracking</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-calendar text-primary text-sm"></i>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Schedule Management</p>
                <p className="text-sm text-neutral-500">Organize team schedules</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-bar text-warning text-sm"></i>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Analytics & Reports</p>
                <p className="text-sm text-neutral-500">Track productivity and insights</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            Sign In to Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
