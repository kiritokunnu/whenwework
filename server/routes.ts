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

  const httpServer = createServer(app);
  return httpServer;
}
