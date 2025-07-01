import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
    color: "primary",
    requiresApproval: true
  },
  {
    id: "admin",
    title: "Admin",
    description: "Full system access with company and user management",
    icon: "fas fa-crown",
    color: "warning",
    requiresApproval: true
  }
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user count to determine if this is admin setup
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/users");
        return response.json();
      } catch (error) {
        // If forbidden, user is not admin, so not first user
        return [];
      }
    },
  });

  const isFirstUser = users && Array.isArray(users) && users.length === 0;

  const setRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", "/api/users/set-role", { role });
      return response.json();
    },
    onSuccess: () => {
      const message = isFirstUser && selectedRole === "admin" 
        ? "Welcome! You've been set up as the system administrator."
        : "Welcome to WorkForce Manager! You've been assigned as an employee.";
      
      toast({
        title: "Setup Complete",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Setup Error",
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

  // Auto-select employee for non-first users
  useEffect(() => {
    if (!isLoadingUsers && !isFirstUser) {
      setSelectedRole("employee");
    }
  }, [isFirstUser, isLoadingUsers]);

  if (isLoadingUsers) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-briefcase text-white text-sm"></i>
          </div>
          <p className="text-neutral-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-briefcase text-white text-2xl"></i>
          </div>
          <CardTitle className="text-2xl">
            {isFirstUser ? "Set Up WorkForce Manager" : "Welcome to WorkForce Manager"}
          </CardTitle>
          <p className="text-neutral-600 mt-2">
            {isFirstUser 
              ? "You're the first user! Set up your administrator account to get started."
              : "You've been assigned as an employee. Contact an administrator if you need elevated permissions."
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isFirstUser && (
            <Alert>
              <i className="fas fa-info-circle h-4 w-4"></i>
              <AlertDescription>
                New users are automatically assigned as employees for security. Administrators can promote you to manager or admin roles later.
              </AlertDescription>
            </Alert>
          )}
          
          {roles.map((role) => {
            const isDisabled = !isFirstUser && role.requiresApproval;
            return (
              <button
                key={role.id}
                onClick={() => !isDisabled && setSelectedRole(role.id)}
                disabled={isDisabled}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                  selectedRole === role.id
                    ? "border-primary bg-primary/5"
                    : isDisabled
                    ? "border-neutral-100 bg-neutral-50 opacity-60 cursor-not-allowed"
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
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {role.title}
                      {isDisabled && <span className="text-xs text-neutral-400 ml-2">(Requires Approval)</span>}
                    </h3>
                    <p className="text-sm text-neutral-600">{role.description}</p>
                    {isDisabled && (
                      <p className="text-xs text-neutral-400 mt-1">
                        Contact your administrator to request this role.
                      </p>
                    )}
                  </div>
                  {selectedRole === role.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs"></i>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!selectedRole || setRoleMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              {setRoleMutation.isPending 
                ? (isFirstUser ? "Setting up admin account..." : "Setting up employee account...") 
                : (isFirstUser ? "Set Up Admin Account" : "Join as Employee")
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
