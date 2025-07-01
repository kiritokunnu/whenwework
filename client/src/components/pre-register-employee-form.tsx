import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Mail, Phone, Building } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@shared/schema";

interface PreRegisterEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreRegisterEmployeeForm({ isOpen, onClose }: PreRegisterEmployeeFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch companies for assignment
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: isOpen,
  });

  const createPreRegisterMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/pre-registered-employees", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Employee pre-registered successfully",
        description: "When they sign up with this email/phone, their profile will automatically sync.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pre-registered-employees"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Pre-registration failed",
        description: error.message || "Failed to pre-register employee",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEmail("");
    setPhone("");
    setFirstName("");
    setLastName("");
    setPosition("");
    setCompanyId("");
  };

  const handleSubmit = () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in email, first name, and last name",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    createPreRegisterMutation.mutate({
      email: email.trim(),
      phone: phone.trim() || undefined,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      position: position.trim() || undefined,
      companyId: companyId ? parseInt(companyId) : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pre-register Employee
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Employee will auto-sync when they sign up with this email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional - Alternative sync method
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position/Role</Label>
            <Input
              id="position"
              placeholder="Field Technician, Sales Rep, etc."
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              Assign to Company
            </Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select company (optional)" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <h4 className="text-sm font-medium text-blue-800 mb-1">How it works:</h4>
            <p className="text-xs text-blue-700">
              When this employee signs up using the same email or phone number, 
              their account will automatically be configured with these details and assigned the "Employee" role.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createPreRegisterMutation.isPending}
            >
              {createPreRegisterMutation.isPending ? "Registering..." : "Pre-register Employee"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}