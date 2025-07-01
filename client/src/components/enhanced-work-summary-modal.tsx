import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Upload,
  Search,
  Plus,
  Minus,
  Volume2,
  Languages,
  CheckCircle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface WorkSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkInId: number;
  products: Product[];
}

interface SelectedProduct {
  productId: number;
  name: string;
  quantity: number;
  notes?: string;
}

interface VoiceRecording {
  blob: Blob;
  url: string;
  duration: number;
  transcription?: string;
  translation?: string;
}

export default function EnhancedWorkSummaryModal({ 
  isOpen, 
  onClose, 
  checkInId, 
  products 
}: WorkSummaryModalProps) {
  const [workNotes, setWorkNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Indian languages support
  const supportedLanguages = [
    { code: "en-IN", name: "English (India)", flag: "🇮🇳" },
    { code: "hi-IN", name: "हिंदी (Hindi)", flag: "🇮🇳" },
    { code: "bn-IN", name: "বাংলা (Bengali)", flag: "🇮🇳" },
    { code: "te-IN", name: "తెలుగు (Telugu)", flag: "🇮🇳" },
    { code: "mr-IN", name: "मराठी (Marathi)", flag: "🇮🇳" },
    { code: "ta-IN", name: "தமிழ் (Tamil)", flag: "🇮🇳" },
    { code: "gu-IN", name: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
    { code: "kn-IN", name: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
    { code: "ml-IN", name: "മലയാളം (Malayalam)", flag: "🇮🇳" },
    { code: "pa-IN", name: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
  ];

  const submitWorkSummaryMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/work-summary", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Work summary submitted",
        description: "Your work summary has been recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: "Failed to submit work summary. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isRecording && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (!isRecording && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setVoiceRecording({
          blob,
          url,
          duration: recordingTime,
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (voiceRecording && !isPlaying) {
      if (audioRef.current) {
        audioRef.current.src = voiceRecording.url;
        audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      }
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const transcribeAudio = async () => {
    if (!voiceRecording) return;

    setIsTranscribing(true);
    try {
      // Using Web Speech API for transcription
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = selectedLanguage;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceRecording(prev => prev ? {
          ...prev,
          transcription: transcript
        } : null);

        // Auto-translate to English if not already in English
        if (selectedLanguage !== "en-IN") {
          translateText(transcript);
        }
      };

      recognition.onerror = () => {
        toast({
          title: "Transcription failed",
          description: "Could not transcribe audio. Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      // Play audio and start recognition
      const audio = new Audio(voiceRecording.url);
      audio.play();
      recognition.start();
    } catch (error) {
      setIsTranscribing(false);
      toast({
        title: "Transcription not supported",
        description: "Voice transcription is not available in this browser.",
        variant: "destructive",
      });
    }
  };

  const translateText = async (text: string) => {
    try {
      // Using a simple translation approach - in production, use Google Translate API
      const response = await fetch(`/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          from: selectedLanguage.split('-')[0],
          to: 'en'
        })
      });

      if (response.ok) {
        const { translatedText } = await response.json();
        setVoiceRecording(prev => prev ? {
          ...prev,
          translation: translatedText
        } : null);
      }
    } catch (error) {
      // Fallback - use the original transcription
      setVoiceRecording(prev => prev ? {
        ...prev,
        translation: prev.transcription
      } : null);
    }
  };

  const addProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.productId === product.id)) {
      setSelectedProducts(prev => [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        notes: ""
      }]);
      setProductSearch("");
    }
  };

  const updateProductQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    } else {
      setSelectedProducts(prev => prev.map(p => 
        p.productId === productId ? { ...p, quantity } : p
      ));
    }
  };

  const updateProductNotes = (productId: number, notes: string) => {
    setSelectedProducts(prev => prev.map(p => 
      p.productId === productId ? { ...p, notes } : p
    ));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setWorkNotes("");
    setSelectedProducts([]);
    setProductSearch("");
    setVoiceRecording(null);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Products required",
        description: "Please select at least one product/inventory item used.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('checkInId', checkInId.toString());
    formData.append('workNotes', workNotes);
    formData.append('products', JSON.stringify(selectedProducts));
    formData.append('voiceTranscription', voiceRecording?.transcription || '');
    formData.append('voiceTranslation', voiceRecording?.translation || '');
    formData.append('recordingLanguage', selectedLanguage);

    if (voiceRecording) {
      formData.append('voiceRecording', voiceRecording.blob, 'work-summary-voice.webm');
    }

    submitWorkSummaryMutation.mutate(formData);
  };

  const canSubmit = selectedProducts.length > 0 && !submitWorkSummaryMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Work Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Work Notes */}
          <div className="space-y-2">
            <Label htmlFor="work-notes">Work Performed</Label>
            <Textarea
              id="work-notes"
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              placeholder="Describe the work you performed..."
              rows={4}
            />
          </div>

          {/* Voice Recording Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Voice Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label>Recording Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center gap-4">
                {!voiceRecording ? (
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="flex-1"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Recording ({formatTime(recordingTime)})
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Voice Note
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={playRecording}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Duration: {formatTime(voiceRecording.duration)}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVoiceRecording(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {!voiceRecording.transcription ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={transcribeAudio}
                        disabled={isTranscribing}
                        className="w-full"
                      >
                        <Languages className="h-4 w-4 mr-2" />
                        {isTranscribing ? "Transcribing..." : "Convert to Text"}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-2 bg-muted rounded text-sm">
                          <strong>Transcription:</strong> {voiceRecording.transcription}
                        </div>
                        {voiceRecording.translation && voiceRecording.translation !== voiceRecording.transcription && (
                          <div className="p-2 bg-blue-50 rounded text-sm">
                            <strong>English Translation:</strong> {voiceRecording.translation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products/Inventory Used */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Products/Inventory Used *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {productSearch && (
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => addProduct(product)}
                    >
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground">
                          {product.description}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No products found
                    </div>
                  )}
                </div>
              )}

              {/* Selected Products */}
              <div className="space-y-3">
                {selectedProducts.map((selectedProduct) => (
                  <Card key={selectedProduct.productId} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{selectedProduct.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateProductQuantity(
                              selectedProduct.productId, 
                              selectedProduct.quantity - 1
                            )}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{selectedProduct.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateProductQuantity(
                              selectedProduct.productId, 
                              selectedProduct.quantity + 1
                            )}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        placeholder="Additional notes for this item..."
                        value={selectedProduct.notes || ""}
                        onChange={(e) => updateProductNotes(
                          selectedProduct.productId, 
                          e.target.value
                        )}
                      />
                    </div>
                  </Card>
                ))}
                
                {selectedProducts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No products selected. Search and select products above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
            className="min-w-[120px]"
          >
            {submitWorkSummaryMutation.isPending ? "Submitting..." : "Submit Summary"}
          </Button>
        </DialogFooter>

        <audio ref={audioRef} />
      </DialogContent>
    </Dialog>
  );
}