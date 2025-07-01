import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Clock, Camera, Package, Plus } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface EnhancedCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: any[];
  location: GeolocationPosition | null;
}

interface SelectedProduct {
  productId: number;
  quantity: number;
  notes?: string;
}

export default function EnhancedCheckInModal({ isOpen, onClose, companies, location }: EnhancedCheckInModalProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch products for inventory selection
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isOpen,
  });

  const checkInMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/check-ins", data);
      return response.json();
    },
    onSuccess: async (checkIn: any) => {
      // Add selected products to the check-in
      if (selectedProducts.length > 0) {
        await apiRequest("POST", `/api/check-ins/${checkIn.id}/products`, {
          products: selectedProducts
        });
      }
      
      toast({
        title: "Check-in successful",
        description: "You have successfully checked in with location and photo!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Check-in failed",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  const addCustomProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/products/custom", data);
      return response.json();
    },
    onSuccess: (newProduct: any) => {
      toast({
        title: "Custom product added",
        description: "Admins have been notified of the new product.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setNewProductName("");
      setNewProductCategory("");
      // Auto-select the new product
      setSelectedProducts(prev => [...prev, { productId: newProduct.id, quantity: 1 }]);
    },
  });

  const resetForm = () => {
    setSelectedCompany("");
    setNotes("");
    setPhoto(null);
    setSelectedProducts([]);
    setNewProductName("");
    setNewProductCategory("");
  };

  const handlePhotoCapture = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductToggle = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, { productId, quantity: 1 }]);
    } else {
      setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    }
  };

  const updateProductQuantity = (productId: number, quantity: number) => {
    setSelectedProducts(prev => 
      prev.map(p => p.productId === productId ? { ...p, quantity } : p)
    );
  };

  const handleAddCustomProduct = () => {
    if (!newProductName.trim()) {
      toast({
        title: "Product name required",
        description: "Please enter a product name",
        variant: "destructive",
      });
      return;
    }

    addCustomProductMutation.mutate({
      name: newProductName,
      category: newProductCategory || "Custom",
      description: "Added during check-in",
    });
  };

  const handleCheckIn = () => {
    if (!selectedCompany) {
      toast({
        title: "Company required",
        description: "Please select a company to check in",
        variant: "destructive",
      });
      return;
    }

    checkInMutation.mutate({
      companyId: parseInt(selectedCompany),
      checkInLatitude: location?.coords.latitude?.toString(),
      checkInLongitude: location?.coords.longitude?.toString(),
      photoUrl: photo,
      notes,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check In with Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company">Visiting Company *</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
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

          {/* Location Display */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
              <MapPin className="h-4 w-4" />
              Location: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </div>
          )}

          {/* Photo Capture */}
          <div className="space-y-2">
            <Label>Visit Photo (Proof of Visit)</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePhotoCapture}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {photo ? "Retake Photo" : "Take Photo"}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            {photo && (
              <div className="mt-2">
                <img src={photo} alt="Visit photo" className="w-full max-w-sm rounded border" />
              </div>
            )}
          </div>

          {/* Inventory/Products Used */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products/Inventory Used
            </Label>
            
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={selectedProducts.some(p => p.productId === product.id)}
                      onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                    />
                    <Label htmlFor={`product-${product.id}`} className="text-sm">
                      {product.name} ({product.category})
                    </Label>
                  </div>
                  {selectedProducts.some(p => p.productId === product.id) && (
                    <Input
                      type="number"
                      min="1"
                      value={selectedProducts.find(p => p.productId === product.id)?.quantity || 1}
                      onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 1)}
                      className="w-16 h-8"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Product */}
            <div className="border-t pt-3">
              <Label className="text-sm">Add Custom Product (Not in List)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Product name"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
                <Input
                  placeholder="Category (optional)"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleAddCustomProduct}
                  disabled={addCustomProductMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Visit Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add details about your visit, work performed, observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCheckIn} 
              disabled={checkInMutation.isPending || !selectedCompany}
            >
              {checkInMutation.isPending ? "Checking in..." : "Check In"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}