import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Building, 
  Package, 
  Calendar, 
  FileText, 
  TrendingUp,
  UserPlus,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  UserCheck,
  Shield
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PreRegisterEmployeeForm from "./pre-register-employee-form";
import ProductManagementDialog from "./product-management-dialog";
import ReportsDialog from "./reports-dialog";
import AnnouncementForm from "./announcement-form";
import type { User, Company, Product, TimeOffRequest, PreRegisteredEmployee } from "@shared/schema";

// User Role Actions Component
function UserRoleActions({ employee }: { employee: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      const response = await apiRequest("POST", "/api/users/set-role", { 
        role: newRole,
        targetUserId: employee.id 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: `User role has been updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (newRole: string) => {
    if (newRole !== employee.role) {
      updateRoleMutation.mutate(newRole);
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={employee.role || 'employee'} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="employee">Employee</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      {updateRoleMutation.isPending && (
        <div className="text-xs text-muted-foreground">Updating...</div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPreRegisterForm, setShowPreRegisterForm] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data for admin dashboard
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: timeOffRequests = [] } = useQuery<TimeOffRequest[]>({
    queryKey: ["/api/time-off-requests"],
  });

  const { data: preRegisteredEmployees = [] } = useQuery<PreRegisteredEmployee[]>({
    queryKey: ["/api/pre-registered-employees"],
  });

  // Approve/Reject time-off requests
  const updateTimeOffMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      return await apiRequest(`/api/time-off-requests/${id}`, "PATCH", { status, rejectionReason });
    },
    onSuccess: () => {
      toast({
        title: "Request updated",
        description: "Time-off request status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-off-requests"] });
    },
  });

  const deletePreRegisteredMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/pre-registered-employees/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Employee removed",
        description: "Pre-registered employee has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pre-registered-employees"] });
    },
  });

  const pendingRequests = timeOffRequests.filter(req => req.status === 'pending');
  const activeEmployees = employees.filter(emp => emp.isActive);
  const customProducts = products.filter(prod => prod.isCustom);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your workforce and operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPreRegisterForm(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Pre-register Employee
          </Button>
          <Button onClick={() => setShowAnnouncementForm(true)} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground">
              {preRegisteredEmployees.length} pre-registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">Client locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Time-off requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {customProducts.length} custom added
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest workforce activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeOffRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Time-off request</p>
                        <p className="text-xs text-muted-foreground">
                          {request.startDate} to {request.endDate}
                        </p>
                      </div>
                      <Badge variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowProductDialog(true)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowReportsDialog(true)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("requests")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Review Requests ({pendingRequests.length})
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Employee Management</h3>
            <Button onClick={() => setShowPreRegisterForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Pre-register New Employee
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                            <p className="text-sm text-muted-foreground">{employee.position || 'No position'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            employee.role === 'admin' ? 'default' :
                            employee.role === 'manager' ? 'secondary' : 'outline'
                          }>
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <UserRoleActions employee={employee} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pre-registered Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preRegisteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <Badge variant={employee.isUsed ? "default" : "secondary"}>
                            {employee.isUsed ? "Registered" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!employee.isUsed && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deletePreRegisteredMutation.mutate(employee.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <h3 className="text-lg font-semibold">Time-off Requests</h3>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeOffRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.employeeId}</TableCell>
                      <TableCell>
                        {request.startDate} to {request.endDate}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === 'approved' ? 'default' :
                          request.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateTimeOffMutation.mutate({ 
                                id: request.id, 
                                status: 'approved' 
                              })}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateTimeOffMutation.mutate({ 
                                id: request.id, 
                                status: 'rejected',
                                rejectionReason: 'Not approved by management'
                              })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Product Management</h3>
            <Button onClick={() => setShowProductDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>
                        <Badge variant={product.isCustom ? "secondary" : "default"}>
                          {product.isCustom ? "Custom" : "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "destructive"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reports & Analytics</h3>
            <Button onClick={() => setShowReportsDialog(true)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Open Reports Dashboard
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PreRegisterEmployeeForm 
        isOpen={showPreRegisterForm} 
        onClose={() => setShowPreRegisterForm(false)} 
      />
      
      {/* Placeholder dialogs - would be implemented similarly */}
      {showProductDialog && (
        <div>Product Management Dialog - Implementation needed</div>
      )}
      {showReportsDialog && (
        <div>Reports Dialog - Implementation needed</div>
      )}
      {showAnnouncementForm && (
        <div>Announcement Form - Implementation needed</div>
      )}
    </div>
  );
}