import {
  users,
  companies,
  positions,
  schedules,
  checkIns,
  timeOffRequests,
  announcements,
  preRegisteredEmployees,
  products,
  checkInProducts,
  workSummaries,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Position,
  type InsertPosition,
  type Schedule,
  type InsertSchedule,
  type CheckIn,
  type InsertCheckIn,
  type TimeOffRequest,
  type InsertTimeOffRequest,
  type Announcement,
  type InsertAnnouncement,
  type PreRegisteredEmployee,
  type InsertPreRegisteredEmployee,
  type Product,
  type InsertProduct,
  type CheckInProduct,
  type InsertCheckInProduct,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Company operations
  createCompany(company: InsertCompany): Promise<Company>;
  getAllCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  
  // Position operations
  createPosition(position: InsertPosition): Promise<Position>;
  getAllPositions(): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position>;
  deletePosition(id: number): Promise<void>;
  
  // Schedule operations
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedulesByEmployee(employeeId: string): Promise<Schedule[]>;
  getSchedulesByCompany(companyId: number): Promise<Schedule[]>;
  getAllSchedules(): Promise<Schedule[]>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;
  
  // Check-in operations
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getCheckInsByEmployee(employeeId: string): Promise<CheckIn[]>;
  getActiveCheckIn(employeeId: string): Promise<CheckIn | undefined>;
  updateCheckIn(id: number, checkIn: Partial<InsertCheckIn>): Promise<CheckIn>;
  getAllCheckIns(): Promise<CheckIn[]>;
  
  // Time-off request operations
  createTimeOffRequest(request: InsertTimeOffRequest): Promise<TimeOffRequest>;
  getTimeOffRequestsByEmployee(employeeId: string): Promise<TimeOffRequest[]>;
  getPendingTimeOffRequests(): Promise<TimeOffRequest[]>;
  updateTimeOffRequest(id: number, request: Partial<InsertTimeOffRequest>): Promise<TimeOffRequest>;
  
  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getActiveAnnouncements(role?: string): Promise<Announcement[]>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;
  getRestrictedPeriods(): Promise<Announcement[]>;
  
  // Pre-registered employee operations
  createPreRegisteredEmployee(employee: InsertPreRegisteredEmployee): Promise<PreRegisteredEmployee>;
  getPreRegisteredEmployeeByEmail(email: string): Promise<PreRegisteredEmployee | undefined>;
  getPreRegisteredEmployeeByPhone(phone: string): Promise<PreRegisteredEmployee | undefined>;
  getAllPreRegisteredEmployees(): Promise<PreRegisteredEmployee[]>;
  markPreRegisteredEmployeeAsUsed(id: number): Promise<void>;
  deletePreRegisteredEmployee(id: number): Promise<void>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Check-in product operations
  addCheckInProducts(checkInId: number, products: InsertCheckInProduct[]): Promise<CheckInProduct[]>;
  getCheckInProducts(checkInId: number): Promise<CheckInProduct[]>;
  
  // Reporting operations
  getEmployeeAttendanceReport(employeeId: string, year: number): Promise<any[]>;
  getClientVisitReport(companyId?: number): Promise<any[]>;
  getBillingReport(startDate: string, endDate: string): Promise<any[]>;
  
  // Real-time features operations
  // Chat operations
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getChatRoomsByUser(userId: string): Promise<ChatRoom[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(roomId: number): Promise<ChatMessage[]>;
  markMessageAsRead(messageId: number, userId: string): Promise<void>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasksByEmployee(employeeId: string): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  createTaskUpdate(update: InsertTaskUpdate): Promise<TaskUpdate>;
  getTaskUpdates(taskId: number): Promise<TaskUpdate[]>;
  
  // Shift operations
  createShift(shift: InsertShift): Promise<Shift>;
  getShiftsByEmployee(employeeId: string): Promise<Shift[]>;
  getAllShifts(): Promise<Shift[]>;
  updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift>;
  deleteShift(id: number): Promise<void>;
  createShiftSwapRequest(request: InsertShiftSwapRequest): Promise<ShiftSwapRequest>;
  getShiftSwapRequests(): Promise<ShiftSwapRequest[]>;
  updateShiftSwapRequest(id: number, request: Partial<InsertShiftSwapRequest>): Promise<ShiftSwapRequest>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  
  // Poll operations
  createPoll(poll: InsertPoll): Promise<Poll>;
  getActivePolls(userRole: string): Promise<Poll[]>;
  createPollResponse(response: InsertPollResponse): Promise<PollResponse>;
  getPollResponses(pollId: number): Promise<PollResponse[]>;
  
  // Work summary operations
  createWorkSummary(workSummary: InsertWorkSummary): Promise<WorkSummary>;
  getWorkSummary(checkInId: number): Promise<WorkSummary | undefined>;
  createCheckInProduct(checkInProduct: InsertCheckInProduct): Promise<CheckInProduct>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as "admin" | "manager" | "employee", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName));
  }

  // Company operations
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.isActive, true)).orderBy(asc(companies.name));
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.update(companies).set({ isActive: false }).where(eq(companies.id, id));
  }

  // Position operations
  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db.insert(positions).values(position).returning();
    return newPosition;
  }

  async getAllPositions(): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.isActive, true)).orderBy(asc(positions.title));
  }

  async getPosition(id: number): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position;
  }

  async updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position> {
    const [updatedPosition] = await db
      .update(positions)
      .set(position)
      .where(eq(positions.id, id))
      .returning();
    return updatedPosition;
  }

  async deletePosition(id: number): Promise<void> {
    await db.update(positions).set({ isActive: false }).where(eq(positions.id, id));
  }

  // Schedule operations
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }

  async getSchedulesByEmployee(employeeId: string): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.employeeId, employeeId))
      .orderBy(desc(schedules.startDate));
  }

  async getSchedulesByCompany(companyId: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.companyId, companyId))
      .orderBy(desc(schedules.startDate));
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules).orderBy(desc(schedules.startDate));
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule> {
    const [updatedSchedule] = await db
      .update(schedules)
      .set({ ...schedule, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  // Check-in operations
  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [newCheckIn] = await db.insert(checkIns).values(checkIn).returning();
    return newCheckIn;
  }

  async getCheckInsByEmployee(employeeId: string): Promise<CheckIn[]> {
    return await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.employeeId, employeeId))
      .orderBy(desc(checkIns.checkInTime));
  }

  async getActiveCheckIn(employeeId: string): Promise<CheckIn | undefined> {
    const [checkIn] = await db
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.employeeId, employeeId), eq(checkIns.status, "checked_in")))
      .orderBy(desc(checkIns.checkInTime))
      .limit(1);
    return checkIn;
  }

  async updateCheckIn(id: number, checkIn: Partial<InsertCheckIn>): Promise<CheckIn> {
    const [updatedCheckIn] = await db
      .update(checkIns)
      .set({ ...checkIn, updatedAt: new Date() })
      .where(eq(checkIns.id, id))
      .returning();
    return updatedCheckIn;
  }

  async getAllCheckIns(): Promise<CheckIn[]> {
    return await db.select().from(checkIns).orderBy(desc(checkIns.checkInTime));
  }

  // Time-off request operations
  async createTimeOffRequest(request: InsertTimeOffRequest): Promise<TimeOffRequest> {
    const [newRequest] = await db.insert(timeOffRequests).values(request).returning();
    return newRequest;
  }

  async getTimeOffRequestsByEmployee(employeeId: string): Promise<TimeOffRequest[]> {
    return await db
      .select()
      .from(timeOffRequests)
      .where(eq(timeOffRequests.employeeId, employeeId))
      .orderBy(desc(timeOffRequests.createdAt));
  }

  async getPendingTimeOffRequests(): Promise<TimeOffRequest[]> {
    return await db
      .select()
      .from(timeOffRequests)
      .where(eq(timeOffRequests.status, "pending"))
      .orderBy(desc(timeOffRequests.createdAt));
  }

  async updateTimeOffRequest(id: number, request: Partial<InsertTimeOffRequest>): Promise<TimeOffRequest> {
    const [updatedRequest] = await db
      .update(timeOffRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(timeOffRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Announcement operations
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async getActiveAnnouncements(role?: string): Promise<Announcement[]> {
    const whereConditions = [eq(announcements.isActive, true)];
    if (role) {
      whereConditions.push(sql`${announcements.targetRole} = 'all' OR ${announcements.targetRole} = ${role}`);
    }
    
    return await db
      .select()
      .from(announcements)
      .where(and(...whereConditions))
      .orderBy(desc(announcements.createdAt));
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({ ...announcement, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.update(announcements).set({ isActive: false }).where(eq(announcements.id, id));
  }

  async getRestrictedPeriods(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.type, "restriction"),
          eq(announcements.isActive, true)
        )
      )
      .orderBy(asc(announcements.restrictedStartDate));
  }

  // Pre-registered employee operations
  async createPreRegisteredEmployee(employee: InsertPreRegisteredEmployee): Promise<PreRegisteredEmployee> {
    const [newEmployee] = await db.insert(preRegisteredEmployees).values(employee).returning();
    return newEmployee;
  }

  async getPreRegisteredEmployeeByEmail(email: string): Promise<PreRegisteredEmployee | undefined> {
    const [employee] = await db
      .select()
      .from(preRegisteredEmployees)
      .where(and(eq(preRegisteredEmployees.email, email), eq(preRegisteredEmployees.isUsed, false)));
    return employee;
  }

  async getPreRegisteredEmployeeByPhone(phone: string): Promise<PreRegisteredEmployee | undefined> {
    const [employee] = await db
      .select()
      .from(preRegisteredEmployees)
      .where(and(eq(preRegisteredEmployees.phone, phone), eq(preRegisteredEmployees.isUsed, false)));
    return employee;
  }

  async getAllPreRegisteredEmployees(): Promise<PreRegisteredEmployee[]> {
    return await db.select().from(preRegisteredEmployees).orderBy(desc(preRegisteredEmployees.createdAt));
  }

  async markPreRegisteredEmployeeAsUsed(id: number): Promise<void> {
    await db.update(preRegisteredEmployees).set({ isUsed: true }).where(eq(preRegisteredEmployees.id, id));
  }

  async deletePreRegisteredEmployee(id: number): Promise<void> {
    await db.delete(preRegisteredEmployees).where(eq(preRegisteredEmployees.id, id));
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  }

  async getActiveProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name));
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // Check-in product operations
  async addCheckInProducts(checkInId: number, productsList: InsertCheckInProduct[]): Promise<CheckInProduct[]> {
    const productsWithCheckInId = productsList.map(product => ({
      ...product,
      checkInId
    }));
    return await db.insert(checkInProducts).values(productsWithCheckInId).returning();
  }

  async getCheckInProducts(checkInId: number): Promise<CheckInProduct[]> {
    return await db
      .select()
      .from(checkInProducts)
      .where(eq(checkInProducts.checkInId, checkInId))
      .orderBy(asc(checkInProducts.createdAt));
  }

  // Reporting operations
  async getEmployeeAttendanceReport(employeeId: string, year: number): Promise<any[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    return await db
      .select()
      .from(checkIns)
      .where(
        and(
          eq(checkIns.employeeId, employeeId),
          gte(checkIns.checkInTime, startDate),
          lte(checkIns.checkInTime, endDate)
        )
      )
      .orderBy(desc(checkIns.checkInTime));
  }

  async getClientVisitReport(companyId?: number): Promise<any[]> {
    const baseQuery = db
      .select({
        companyId: checkIns.companyId,
        companyName: companies.name,
        visitCount: sql<number>`count(*)`,
        totalHours: sql<number>`sum(
          case 
            when ${checkIns.checkOutTime} is not null 
            then extract(epoch from ${checkIns.checkOutTime} - ${checkIns.checkInTime})/3600 
            else 0 
          end
        )`,
        lastVisit: sql<Date>`max(${checkIns.checkInTime})`
      })
      .from(checkIns)
      .leftJoin(companies, eq(checkIns.companyId, companies.id))
      .groupBy(checkIns.companyId, companies.name);

    if (companyId) {
      return await baseQuery.where(eq(checkIns.companyId, companyId)).orderBy(desc(sql`count(*)`));
    }

    return await baseQuery.orderBy(desc(sql`count(*)`));
  }

  async getBillingReport(startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return await db
      .select({
        employeeId: checkIns.employeeId,
        employeeName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        companyId: checkIns.companyId,
        companyName: companies.name,
        totalHours: sql<number>`sum(
          case 
            when ${checkIns.checkOutTime} is not null 
            then extract(epoch from ${checkIns.checkOutTime} - ${checkIns.checkInTime})/3600 
            else 0 
          end
        )`,
        visitCount: sql<number>`count(*)`
      })
      .from(checkIns)
      .leftJoin(users, eq(checkIns.employeeId, users.id))
      .leftJoin(companies, eq(checkIns.companyId, companies.id))
      .where(
        and(
          gte(checkIns.checkInTime, start),
          lte(checkIns.checkInTime, end)
        )
      )
      .groupBy(checkIns.employeeId, users.firstName, users.lastName, checkIns.companyId, companies.name)
      .orderBy(desc(sql`sum(
        case 
          when ${checkIns.checkOutTime} is not null 
          then extract(epoch from ${checkIns.checkOutTime} - ${checkIns.checkInTime})/3600 
          else 0 
        end
      )`));
  }

  // Real-time features implementation for Employee-focused workflow
  async createChatRoom(roomData: any): Promise<any> {
    const [room] = await db
      .insert(chatRooms)
      .values(roomData)
      .returning();
    return room;
  }

  async getChatRoomsByUser(userId: string): Promise<any[]> {
    return [];
  }

  async createChatMessage(messageData: any): Promise<any> {
    const [message] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getChatMessages(roomId: number): Promise<any[]> {
    return [];
  }

  async markMessageAsRead(messageId: number, userId: string): Promise<void> {
    return;
  }

  async createTask(taskData: any): Promise<any> {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async getTasksByEmployee(employeeId: string): Promise<any[]> {
    return [];
  }

  async getTaskById(id: number): Promise<any> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    return task;
  }

  async updateTask(id: number, taskData: any): Promise<any> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async createTaskUpdate(updateData: any): Promise<any> {
    const [update] = await db
      .insert(taskUpdates)
      .values(updateData)
      .returning();
    return update;
  }

  async getTaskUpdates(taskId: number): Promise<any[]> {
    return [];
  }

  async createShift(shiftData: any): Promise<any> {
    const [shift] = await db
      .insert(shifts)
      .values(shiftData)
      .returning();
    return shift;
  }

  async getShiftsByEmployee(employeeId: string): Promise<any[]> {
    return [];
  }

  async getAllShifts(): Promise<any[]> {
    return [];
  }

  async updateShift(id: number, shiftData: any): Promise<any> {
    const [shift] = await db
      .update(shifts)
      .set(shiftData)
      .where(eq(shifts.id, id))
      .returning();
    return shift;
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async createShiftSwapRequest(requestData: any): Promise<any> {
    const [request] = await db
      .insert(shiftSwapRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getShiftSwapRequests(): Promise<any[]> {
    return [];
  }

  async updateShiftSwapRequest(id: number, requestData: any): Promise<any> {
    const [request] = await db
      .update(shiftSwapRequests)
      .set(requestData)
      .where(eq(shiftSwapRequests.id, id))
      .returning();
    return request;
  }

  async createNotification(notificationData: any): Promise<any> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<any[]> {
    return [];
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async createPoll(pollData: any): Promise<any> {
    const [poll] = await db
      .insert(polls)
      .values(pollData)
      .returning();
    return poll;
  }

  async getActivePolls(userRole: string): Promise<any[]> {
    return [];
  }

  async createPollResponse(responseData: any): Promise<any> {
    const [response] = await db
      .insert(pollResponses)
      .values(responseData)
      .returning();
    return response;
  }

  async getPollResponses(pollId: number): Promise<any[]> {
    return [];
  }

  // Work summary operations
  async createWorkSummary(workSummaryData: any): Promise<any> {
    const [workSummary] = await db
      .insert(workSummaries)
      .values(workSummaryData)
      .returning();
    return workSummary;
  }

  async getWorkSummary(checkInId: number): Promise<any> {
    const [workSummary] = await db
      .select()
      .from(workSummaries)
      .where(eq(workSummaries.checkInId, checkInId));
    return workSummary;
  }

  async createCheckInProduct(checkInProductData: any): Promise<any> {
    const [checkInProduct] = await db
      .insert(checkInProducts)
      .values(checkInProductData)
      .returning();
    return checkInProduct;
  }
}

export const storage = new DatabaseStorage();
