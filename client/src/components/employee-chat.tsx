import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Send, 
  Image, 
  Paperclip, 
  Mic, 
  MapPin,
  Users,
  MessageSquare,
  Check,
  CheckCheck,
  Reply,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ChatRoom, ChatMessage, User } from "@shared/schema";

interface EmployeeChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeChat({ isOpen, onClose }: EmployeeChatProps) {
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatUsers, setNewChatUsers] = useState<string[]>([]);
  const [newChatName, setNewChatName] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch chat rooms for employee
  const { data: chatRooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: isOpen,
  });

  // Fetch messages for active room
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", activeRoom],
    enabled: isOpen && activeRoom !== null,
    refetchInterval: 3000, // Poll every 3 seconds for real-time feel
  });

  // Fetch all users for group chat creation
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: showNewChatDialog,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/chat/messages", "POST", data);
    },
    onSuccess: () => {
      setMessageInput("");
      setReplyToMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", activeRoom] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      scrollToBottom();
    },
  });

  const createChatRoomMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/chat/rooms", "POST", data);
    },
    onSuccess: (newRoom: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setActiveRoom(newRoom.id);
      setShowNewChatDialog(false);
      setNewChatUsers([]);
      setNewChatName("");
    },
  });

  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest(`/api/chat/messages/${messageId}/read`, "POST", {});
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
      // Mark latest message as read if it's not from current user
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.senderId !== user?.id) {
        markMessageAsReadMutation.mutate(latestMessage.id);
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeRoom) return;

    sendMessageMutation.mutate({
      roomId: activeRoom,
      content: messageInput.trim(),
      messageType: "text",
      replyToId: replyToMessage?.id,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeRoom) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", activeRoom.toString());
    formData.append("messageType", file.type.startsWith("image/") ? "image" : "file");

    try {
      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", activeRoom] });
        toast({
          title: "File uploaded",
          description: "Your file has been shared successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const startVoiceRecording = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsRecording(true);
      // Implement voice recording logic here
      toast({
        title: "Voice recording",
        description: "Voice recording feature coming soon",
      });
      setTimeout(() => setIsRecording(false), 3000);
    }
  };

  const shareLocation = () => {
    if (navigator.geolocation && activeRoom) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendMessageMutation.mutate({
            roomId: activeRoom,
            messageType: "location",
            content: `Location: ${position.coords.latitude}, ${position.coords.longitude}`,
          });
        },
        () => {
          toast({
            title: "Location access denied",
            description: "Please enable location access to share your location",
            variant: "destructive",
          });
        }
      );
    }
  };

  const createNewChat = () => {
    if (newChatUsers.length === 0) return;

    const participants = [...newChatUsers, user?.id].filter(Boolean);
    const chatType = newChatUsers.length === 1 ? "direct" : "group";
    const chatName = chatType === "direct" 
      ? allUsers.find(u => u.id === newChatUsers[0])?.firstName || "Direct Chat"
      : newChatName || "Group Chat";

    createChatRoomMutation.mutate({
      name: chatName,
      type: chatType,
      participants,
    });
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  const getMessageStatus = (message: ChatMessage) => {
    // This would check read receipts in a real implementation
    return message.senderId === user?.id ? "sent" : "received";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Team Chat
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-full">
          {/* Chat Rooms Sidebar */}
          <div className="w-1/3 border-r pr-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Conversations</h3>
              <Button
                size="sm"
                onClick={() => setShowNewChatDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {chatRooms.map((room) => (
                  <Card
                    key={room.id}
                    className={`cursor-pointer transition-colors ${
                      activeRoom === room.id ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                    onClick={() => setActiveRoom(room.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {room.type === "group" ? (
                            <Users className="h-8 w-8 text-muted-foreground" />
                          ) : (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {room.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{room.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {room.type === "group" ? "Group Chat" : "Direct Message"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {room.type === "announcement" ? "📢" : "💬"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 pl-4 flex flex-col">
            {activeRoom ? (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.senderId === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          } rounded-lg p-3`}
                        >
                          {message.senderId !== user?.id && (
                            <p className="text-xs font-medium mb-1">
                              {message.senderId}
                            </p>
                          )}
                          
                          {message.replyToId && (
                            <div className="bg-muted/50 p-2 rounded mb-2 text-xs">
                              <Reply className="h-3 w-3 inline mr-1" />
                              Replying to message
                            </div>
                          )}

                          {message.messageType === "text" && (
                            <p className="text-sm">{message.content}</p>
                          )}

                          {message.messageType === "image" && (
                            <div>
                              <img
                                src={message.fileUrl}
                                alt="Shared image"
                                className="max-w-full rounded"
                              />
                              {message.content && (
                                <p className="text-sm mt-2">{message.content}</p>
                              )}
                            </div>
                          )}

                          {message.messageType === "file" && (
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4" />
                              <span className="text-sm">{message.fileName}</span>
                            </div>
                          )}

                          {message.messageType === "location" && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">{message.content}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs opacity-70">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {message.senderId === user?.id && (
                              <div className="flex items-center">
                                {getMessageStatus(message) === "sent" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <CheckCheck className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Reply Preview */}
                {replyToMessage && (
                  <div className="bg-muted p-2 rounded mb-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Reply className="h-4 w-4" />
                      <span className="text-sm">
                        Replying to: {replyToMessage.content?.substring(0, 50)}...
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyToMessage(null)}
                    >
                      ×
                    </Button>
                  </div>
                )}

                {/* Message Input */}
                <div className="flex gap-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startVoiceRecording}
                      className={isRecording ? "bg-red-100" : ""}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={shareLocation}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,application/*"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chat Name (for groups)</label>
              <Input
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="Enter chat name..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Select Team Members</label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                {allUsers
                  .filter(u => u.id !== user?.id)
                  .map((u) => (
                    <div
                      key={u.id}
                      className={`p-2 border rounded cursor-pointer ${
                        newChatUsers.includes(u.id) ? "bg-primary/10" : ""
                      }`}
                      onClick={() => {
                        setNewChatUsers(prev =>
                          prev.includes(u.id)
                            ? prev.filter(id => id !== u.id)
                            : [...prev, u.id]
                        );
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.profileImageUrl} />
                          <AvatarFallback>
                            {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={createNewChat}
                disabled={newChatUsers.length === 0 || createChatRoomMutation.isPending}
              >
                Create Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}