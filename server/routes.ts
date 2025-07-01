import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCompanySchema,
  insertPositionSchema,
  insertScheduleSchema,
  insertCheckInSchema,
  insertTimeOffRequestSchema,
  insertAnnouncementSchema,
  insertPreRegisteredEmployeeSchema,
  insertProductSchema,
  insertCheckInProductSchema,
} from "@shared/schema";
import { z } from "zod";

// Role-based middleware
const requireRole = (allowedRoles: string[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !allowedRoles.includes(user.role || "employee")) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes
  app.post('/api/users/set-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['admin', 'manager', 'employee'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(userId, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get('/api/users', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({ ...user, ...updates });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Company management routes
  app.post('/api/companies', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.get('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.patch('/api/companies/:id', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const company = await storage.updateCompany(id, updates);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCompany(id);
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Position management routes
  app.post('/api/positions', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const positionData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(positionData);
      res.json(position);
    } catch (error) {
      console.error("Error creating position:", error);
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  app.get('/api/positions', isAuthenticated, async (req: any, res) => {
    try {
      const positions = await storage.getAllPositions();
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Schedule management routes
  app.post('/api/schedules', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse({
        ...req.body,
        createdBy: req.currentUser.id
      });
      const schedule = await storage.createSchedule(scheduleData);
      res.json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.get('/api/schedules', isAuthenticated, async (req: any, res) => {
    try {
      const { employeeId } = req.query;
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (employeeId) {
        const schedules = await storage.getSchedulesByEmployee(employeeId as string);
        res.json(schedules);
      } else if (user.role === 'employee') {
        const schedules = await storage.getSchedulesByEmployee(user.id);
        res.json(schedules);
      } else {
        const schedules = await storage.getAllSchedules();
        res.json(schedules);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  // Check-in routes
  app.post('/api/check-ins', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const checkInData = insertCheckInSchema.parse({
        ...req.body,
        employeeId: userId
      });
      const checkIn = await storage.createCheckIn(checkInData);
      res.json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      res.status(500).json({ message: "Failed to create check-in" });
    }
  });

  app.get('/api/check-ins', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.role === 'employee') {
        const checkIns = await storage.getCheckInsByEmployee(user.id);
        res.json(checkIns);
      } else {
        const checkIns = await storage.getAllCheckIns();
        res.json(checkIns);
      }
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  app.get('/api/check-ins/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const activeCheckIn = await storage.getActiveCheckIn(userId);
      res.json(activeCheckIn);
    } catch (error) {
      console.error("Error fetching active check-in:", error);
      res.status(500).json({ message: "Failed to fetch active check-in" });
    }
  });

  app.patch('/api/check-ins/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const checkIn = await storage.updateCheckIn(id, updates);
      res.json(checkIn);
    } catch (error) {
      console.error("Error updating check-in:", error);
      res.status(500).json({ message: "Failed to update check-in" });
    }
  });

  // Work summary routes with voice recording support
  app.post('/api/work-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { checkInId, workNotes, products, voiceTranscription, voiceTranslation, recordingLanguage } = req.body;
      
      // Create work summary
      const workSummaryData = {
        checkInId: parseInt(checkInId),
        workNotes,
        voiceTranscription,
        voiceTranslation,
        recordingLanguage
      };
      
      const workSummary = await storage.createWorkSummary(workSummaryData);
      
      // Add selected products to check-in
      if (products) {
        const productData = JSON.parse(products);
        for (const product of productData) {
          await storage.createCheckInProduct({
            checkInId: parseInt(checkInId),
            productId: product.productId,
            quantity: product.quantity,
            notes: product.notes
          });
        }
      }
      
      // Update check-in status to checked_out
      await storage.updateCheckIn(parseInt(checkInId), { 
        checkOutTime: new Date(),
        status: 'checked_out'
      });
      
      res.json(workSummary);
    } catch (error) {
      console.error("Error creating work summary:", error);
      res.status(500).json({ message: "Failed to create work summary" });
    }
  });

  // Check-out route
  app.post('/api/check-ins/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { checkInId, notes } = req.body;
      
      const updates = {
        checkOutTime: new Date(),
        status: 'checked_out' as const,
        notes: notes || undefined
      };
      
      const checkIn = await storage.updateCheckIn(parseInt(checkInId), updates);
      res.json(checkIn);
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  // Translation API route for voice recordings
  app.post('/api/translate', isAuthenticated, async (req: any, res) => {
    try {
      const { text, from, to } = req.body;
      
      // Simple fallback translation - in production, use Google Translate API
      // For now, return the original text as translation
      const translatedText = text; // Placeholder - integrate real translation service
      
      res.json({ translatedText });
    } catch (error) {
      console.error("Error translating text:", error);
      res.status(500).json({ message: "Failed to translate text" });
    }
  });

  // Time-off request routes
  app.post('/api/time-off-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const requestData = insertTimeOffRequestSchema.parse({
        ...req.body,
        employeeId: userId
      });
      const request = await storage.createTimeOffRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating time-off request:", error);
      res.status(500).json({ message: "Failed to create time-off request" });
    }
  });

  app.get('/api/time-off-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.role === 'employee') {
        const requests = await storage.getTimeOffRequestsByEmployee(user.id);
        res.json(requests);
      } else {
        const requests = await storage.getPendingTimeOffRequests();
        res.json(requests);
      }
    } catch (error) {
      console.error("Error fetching time-off requests:", error);
      res.status(500).json({ message: "Failed to fetch time-off requests" });
    }
  });

  app.patch('/api/time-off-requests/:id', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.status === 'approved') {
        updates.approvedBy = req.currentUser.id;
        updates.approvedAt = new Date();
      }
      
      const request = await storage.updateTimeOffRequest(id, updates);
      res.json(request);
    } catch (error) {
      console.error("Error updating time-off request:", error);
      res.status(500).json({ message: "Failed to update time-off request" });
    }
  });

  // Announcement routes
  app.post('/api/announcements', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        createdBy: req.currentUser.id
      });
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.get('/api/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const announcements = await storage.getActiveAnnouncements(user.role || "employee");
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Pre-registered employee routes
  app.post('/api/pre-registered-employees', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const employeeData = insertPreRegisteredEmployeeSchema.parse({
        ...req.body,
        registeredBy: req.user.claims.sub
      });
      const employee = await storage.createPreRegisteredEmployee(employeeData);
      res.json(employee);
    } catch (error) {
      console.error("Error creating pre-registered employee:", error);
      res.status(500).json({ message: "Failed to create pre-registered employee" });
    }
  });

  app.get('/api/pre-registered-employees', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const employees = await storage.getAllPreRegisteredEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching pre-registered employees:", error);
      res.status(500).json({ message: "Failed to fetch pre-registered employees" });
    }
  });

  app.delete('/api/pre-registered-employees/:id', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePreRegisteredEmployee(id);
      res.json({ message: "Pre-registered employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting pre-registered employee:", error);
      res.status(500).json({ message: "Failed to delete pre-registered employee" });
    }
  });

  // Product management routes
  app.post('/api/products', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        addedBy: req.user.claims.sub
      });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.patch('/api/products/:id', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Custom product notification route
  app.post('/api/products/custom', isAuthenticated, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        isCustom: true,
        addedBy: req.user.claims.sub
      });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating custom product:", error);
      res.status(500).json({ message: "Failed to create custom product" });
    }
  });

  // Check-in product routes
  app.post('/api/check-ins/:checkInId/products', isAuthenticated, async (req: any, res) => {
    try {
      const checkInId = parseInt(req.params.checkInId);
      const products = req.body.products.map((product: any) => 
        insertCheckInProductSchema.parse(product)
      );
      const result = await storage.addCheckInProducts(checkInId, products);
      res.json(result);
    } catch (error) {
      console.error("Error adding check-in products:", error);
      res.status(500).json({ message: "Failed to add check-in products" });
    }
  });

  app.get('/api/check-ins/:checkInId/products', isAuthenticated, async (req: any, res) => {
    try {
      const checkInId = parseInt(req.params.checkInId);
      const products = await storage.getCheckInProducts(checkInId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching check-in products:", error);
      res.status(500).json({ message: "Failed to fetch check-in products" });
    }
  });

  // Reporting routes
  app.get('/api/reports/attendance/:employeeId', isAuthenticated, async (req: any, res) => {
    try {
      const employeeId = req.params.employeeId;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      // Employees can only access their own reports
      if (req.currentUser.role === 'employee' && req.currentUser.id !== employeeId) {
        return res.status(403).json({ message: "Forbidden: Can only access your own attendance report" });
      }
      
      const report = await storage.getEmployeeAttendanceReport(employeeId, year);
      res.json(report);
    } catch (error) {
      console.error("Error fetching attendance report:", error);
      res.status(500).json({ message: "Failed to fetch attendance report" });
    }
  });

  app.get('/api/reports/client-visits', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const report = await storage.getClientVisitReport(companyId);
      res.json(report);
    } catch (error) {
      console.error("Error fetching client visit report:", error);
      res.status(500).json({ message: "Failed to fetch client visit report" });
    }
  });

  app.get('/api/reports/billing', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const report = await storage.getBillingReport(startDate, endDate);
      res.json(report);
    } catch (error) {
      console.error("Error fetching billing report:", error);
      res.status(500).json({ message: "Failed to fetch billing report" });
    }
  });

  // Restricted periods route
  app.get('/api/restricted-periods', isAuthenticated, async (req: any, res) => {
    try {
      const periods = await storage.getRestrictedPeriods();
      res.json(periods);
    } catch (error) {
      console.error("Error fetching restricted periods:", error);
      res.status(500).json({ message: "Failed to fetch restricted periods" });
    }
  });

  // Employee management routes for admin/manager
  app.get('/api/employees', isAuthenticated, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const employees = await storage.getAllUsers();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.patch('/api/employees/:id/role', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const id = req.params.id;
      const { role } = req.body;
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Real-time features API routes for Employee-focused workflow

  // Chat API routes
  app.get('/api/chat/rooms', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const rooms = await storage.getChatRoomsByUser(userId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.post('/api/chat/rooms', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const roomData = { ...req.body, createdBy: userId };
      const room = await storage.createChatRoom(roomData);
      res.json(room);
    } catch (error) {
      console.error("Error creating chat room:", error);
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });

  app.get('/api/chat/messages/:roomId', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages = await storage.getChatMessages(roomId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/messages', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const messageData = { ...req.body, senderId: userId };
      const message = await storage.createChatMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/chat/messages/:messageId/read', isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const userId = (req as any).user.claims.sub;
      await storage.markMessageAsRead(messageId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Task API routes
  app.get('/api/tasks/assigned', isAuthenticated, async (req, res) => {
    try {
      const employeeId = (req as any).user.claims.sub;
      const tasks = await storage.getTasksByEmployee(employeeId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const assignedBy = (req as any).user.claims.sub;
      const taskData = { ...req.body, assignedBy };
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/tasks/:taskId', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks/:taskId/update', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const userId = (req as any).user.claims.sub;
      const updateData = { ...req.body, taskId, userId };
      const update = await storage.createTaskUpdate(updateData);
      res.json(update);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.post('/api/tasks/:taskId/start', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const userId = (req as any).user.claims.sub;
      const updateData = {
        taskId,
        userId,
        status: "in_progress",
        comment: "Task started"
      };
      const update = await storage.createTaskUpdate(updateData);
      res.json(update);
    } catch (error) {
      console.error("Error starting task:", error);
      res.status(500).json({ message: "Failed to start task" });
    }
  });

  app.post('/api/tasks/:taskId/complete', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const userId = (req as any).user.claims.sub;
      const updateData = { ...req.body, taskId, userId, status: "completed" };
      const update = await storage.createTaskUpdate(updateData);
      res.json(update);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  app.get('/api/tasks/:taskId/updates', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const updates = await storage.getTaskUpdates(taskId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching task updates:", error);
      res.status(500).json({ message: "Failed to fetch task updates" });
    }
  });

  // Shift API routes
  app.get('/api/shifts/employee', isAuthenticated, async (req, res) => {
    try {
      const employeeId = (req as any).user.claims.sub;
      const shifts = await storage.getShiftsByEmployee(employeeId);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get('/api/shifts', isAuthenticated, async (req, res) => {
    try {
      const shifts = await storage.getAllShifts();
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching all shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.post('/api/shifts', isAuthenticated, async (req, res) => {
    try {
      const createdBy = (req as any).user.claims.sub;
      const shiftData = { ...req.body, createdBy };
      const shift = await storage.createShift(shiftData);
      res.json(shift);
    } catch (error) {
      console.error("Error creating shift:", error);
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  app.put('/api/shifts/:shiftId', isAuthenticated, async (req, res) => {
    try {
      const shiftId = parseInt(req.params.shiftId);
      const shift = await storage.updateShift(shiftId, req.body);
      res.json(shift);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  app.delete('/api/shifts/:shiftId', isAuthenticated, async (req, res) => {
    try {
      const shiftId = parseInt(req.params.shiftId);
      await storage.deleteShift(shiftId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Shift swap requests
  app.get('/api/shifts/swap-requests', isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getShiftSwapRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      res.status(500).json({ message: "Failed to fetch swap requests" });
    }
  });

  app.post('/api/shifts/swap-requests', isAuthenticated, async (req, res) => {
    try {
      const requesterId = (req as any).user.claims.sub;
      const requestData = { ...req.body, requesterId };
      const request = await storage.createShiftSwapRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating swap request:", error);
      res.status(500).json({ message: "Failed to create swap request" });
    }
  });

  app.post('/api/shifts/swap-requests/:requestId/:action', isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const action = req.params.action;
      const userId = (req as any).user.claims.sub;
      
      let updateData: any = {};
      if (action === "accept") {
        updateData = { status: "approved", approvedBy: userId, approvedAt: new Date() };
      } else if (action === "reject") {
        updateData = { status: "rejected", approvedBy: userId, rejectionReason: req.body.reason };
      }
      
      const request = await storage.updateShiftSwapRequest(requestId, updateData);
      res.json(request);
    } catch (error) {
      console.error("Error updating swap request:", error);
      res.status(500).json({ message: "Failed to update swap request" });
    }
  });

  // Notification API routes
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:notificationId/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Poll API routes
  app.get('/api/polls', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).user.claims.sub);
      const userRole = user?.role || "employee";
      const polls = await storage.getActivePolls(userRole);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  app.post('/api/polls', isAuthenticated, async (req, res) => {
    try {
      const createdBy = (req as any).user.claims.sub;
      const pollData = { ...req.body, createdBy };
      const poll = await storage.createPoll(pollData);
      res.json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  app.post('/api/polls/:pollId/respond', isAuthenticated, async (req, res) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const userId = (req as any).user.claims.sub;
      const responseData = { ...req.body, pollId, userId };
      const response = await storage.createPollResponse(responseData);
      res.json(response);
    } catch (error) {
      console.error("Error submitting poll response:", error);
      res.status(500).json({ message: "Failed to submit poll response" });
    }
  });

  // Employee/User list for chat and collaboration
  app.get('/api/employees', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
