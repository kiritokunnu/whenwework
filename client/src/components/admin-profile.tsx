import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Settings, Check, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OrganizationSettings {
  organizationName: string;
  defaultRole: "employee" | "manager";
  emailDomain?: string;
}

export default function AdminProfile() {
  const { user } = useAuth();
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [defaultRole, setDefaultRole] = useState<"employee" | "manager">("employee");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orgSettings } = useQuery<OrganizationSettings>({
    queryKey: ["/api/admin/organization"],
    onSuccess: (data) => {
      if (data) {
        setOrgName(data.organizationName || "");
        setEmailDomain(data.emailDomain || "");
        setDefaultRole(data.defaultRole || "employee");
      }
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (data: OrganizationSettings) => {
      const response = await apiRequest("PUT", "/api/admin/organization", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization updated",
        description: "Organization settings have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organization"] });
      setIsEditingOrg(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update organization settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveOrganization = () => {
    if (!orgName.trim()) {
      toast({
        title: "Organization name required",
        description: "Please enter an organization name",
        variant: "destructive",
      });
      return;
    }

    updateOrgMutation.mutate({
      organizationName: orgName.trim(),
      defaultRole,
      emailDomain: emailDomain.trim() || undefined,
    });
  };

  const extractDomainFromEmail = () => {
    if (user?.email) {
      const domain = user.email.split('@')[1];
      setEmailDomain(domain);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <User className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Profile</h1>
          <p className="text-muted-foreground">Manage your profile and organization settings</p>
        </div>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">First Name</Label>
              <p className="text-sm text-muted-foreground">{user?.firstName || "Not set"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Name</Label>
              <p className="text-sm text-muted-foreground">{user?.lastName || "Not set"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <Badge variant="default">{user?.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditingOrg ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Organization Name</Label>
                <p className="text-sm text-muted-foreground">
                  {orgSettings?.organizationName || "Not configured"}
                </p>
              </div>
              
              {orgSettings?.emailDomain && (
                <div>
                  <Label className="text-sm font-medium">Email Domain</Label>
                  <p className="text-sm text-muted-foreground">@{orgSettings.emailDomain}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Default Role for New Users</Label>
                <Badge variant="secondary" className="ml-2">
                  {orgSettings?.defaultRole || "employee"}
                </Badge>
              </div>

              <Button 
                onClick={() => setIsEditingOrg(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Organization Settings
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter your organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailDomain">Email Domain (Optional)</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="emailDomain"
                      value={emailDomain}
                      onChange={(e) => setEmailDomain(e.target.value)}
                      placeholder="company.com"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={extractDomainFromEmail}
                    disabled={!user?.email}
                  >
                    Use My Domain
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  New users with matching email domains will automatically be assigned the default role
                </p>
              </div>

              <div className="space-y-2">
                <Label>Default Role for New Users</Label>
                <div className="flex gap-2">
                  <Button
                    variant={defaultRole === "employee" ? "default" : "outline"}
                    onClick={() => setDefaultRole("employee")}
                    size="sm"
                  >
                    Employee
                  </Button>
                  <Button
                    variant={defaultRole === "manager" ? "default" : "outline"}
                    onClick={() => setDefaultRole("manager")}
                    size="sm"
                  >
                    Manager
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveOrganization}
                  disabled={updateOrgMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {updateOrgMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditingOrg(false);
                    // Reset to current values
                    setOrgName(orgSettings?.organizationName || "");
                    setEmailDomain(orgSettings?.emailDomain || "");
                    setDefaultRole(orgSettings?.defaultRole || "employee");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Assignment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automatic Role Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>How it works:</strong> When new users sign in with an email address that matches 
              your organization's domain, they will automatically be assigned the default role you've selected.
            </p>
            {orgSettings?.emailDomain ? (
              <p>
                <strong>Current setup:</strong> Users with emails ending in "@{orgSettings.emailDomain}" 
                will be assigned the <Badge variant="secondary" className="mx-1">{orgSettings.defaultRole}</Badge> role.
              </p>
            ) : (
              <p>
                <strong>Not configured:</strong> Set up an email domain above to enable automatic role assignment.
              </p>
            )}
            <p>
              Admins can always change user roles manually through the Employee Management section.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}