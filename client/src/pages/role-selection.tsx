import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const roles = [
  {
    id: "employee",
    title: "Employee",
    description: "Field worker with check-in capabilities and schedule viewing",
    icon: "fas fa-user",
    color: "secondary"
  },
  {
    id: "manager",
    title: "Manager",
    description: "Team lead with employee management and approval permissions",
    icon: "fas fa-users",
    color: "primary"
  },
  {
    id: "admin",
    title: "Admin",
    description: "Full system access with company and user management",
    icon: "fas fa-crown",
    color: "warning"
  }
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", "/api/users/set-role", { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Set Successfully",
        description: "Welcome to WorkForce Manager!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose your role to continue",
        variant: "destructive",
      });
      return;
    }
    setRoleMutation.mutate(selectedRole);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-briefcase text-white text-2xl"></i>
          </div>
          <CardTitle className="text-2xl">Welcome to WorkForce Manager</CardTitle>
          <p className="text-neutral-600 mt-2">
            Please select your role to get started with the appropriate permissions and features.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                selectedRole === role.id
                  ? "border-primary bg-primary/5"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  role.color === 'primary' ? 'bg-primary/10' : 
                  role.color === 'secondary' ? 'bg-secondary/10' : 'bg-warning/10'
                }`}>
                  <i className={`${role.icon} text-lg ${
                    role.color === 'primary' ? 'text-primary' : 
                    role.color === 'secondary' ? 'text-secondary' : 'text-warning'
                  }`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">{role.title}</h3>
                  <p className="text-sm text-neutral-600">{role.description}</p>
                </div>
                {selectedRole === role.id && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                )}
              </div>
            </button>
          ))}
          
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!selectedRole || setRoleMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              {setRoleMutation.isPending ? "Setting up..." : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
