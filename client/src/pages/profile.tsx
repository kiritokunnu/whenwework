import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    position: user?.position || "",
  });

  // Fetch companies and positions for display
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["/api/positions"],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      position: user?.position || "",
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-warning text-white";
      case "manager":
        return "bg-primary text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      
      <div className="px-4 py-6 pb-24 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-primary text-white text-lg">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-neutral-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-neutral-600">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getRoleColor(user.role || "employee")}>
                    {user.role || "employee"}
                  </Badge>
                  {user.position && (
                    <Badge variant="outline">{user.position}</Badge>
                  )}
                </div>
              </div>
            </div>

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <i className="fas fa-edit mr-2"></i>
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-3">
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-secondary hover:bg-secondary/90"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                ) : (
                  <p className="text-neutral-900 font-medium">{user.firstName || "Not set"}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                ) : (
                  <p className="text-neutral-900 font-medium">{user.lastName || "Not set"}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <p className="text-neutral-600">{user.email}</p>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-neutral-900 font-medium">{user.phone || "Not set"}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="position">Position</Label>
              {isEditing ? (
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Enter your position"
                />
              ) : (
                <p className="text-neutral-900 font-medium">{user.position || "Not set"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => toast({ title: "Feature coming soon" })}
            >
              <i className="fas fa-bell mr-3"></i>
              Notification Settings
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => toast({ title: "Feature coming soon" })}
            >
              <i className="fas fa-shield-alt mr-3"></i>
              Privacy Settings
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start text-accent hover:text-accent"
              onClick={() => window.location.href = "/api/logout"}
            >
              <i className="fas fa-sign-out-alt mr-3"></i>
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-briefcase text-white"></i>
            </div>
            <p className="text-neutral-600 text-sm">WorkForce Manager v1.0</p>
            <p className="text-neutral-500 text-xs">Professional workforce management</p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
