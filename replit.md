# WorkForce Manager

## Overview

WorkForce Manager is a comprehensive workforce management application designed for field workers, managers, and administrators. The system provides location-based check-ins, company visit tracking, schedule management, and team oversight capabilities. Built with a modern tech stack featuring React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

### Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Tables**:
  - `users` - User profiles with role-based access
  - `companies` - Client companies/vendors
  - `positions` - Job positions and roles
  - `schedules` - Employee work schedules
  - `check_ins` - Location-based attendance tracking
  - `time_off_requests` - Leave management
  - `announcements` - Company communications
  - `sessions` - Authentication session storage

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **Role-Based Access**: Three-tier system (admin, manager, employee)
- **Authorization**: Middleware-based role checking for API endpoints

### Location Services
- **GPS Integration**: Browser geolocation API for check-in/check-out
- **Location Tracking**: Coordinate storage for attendance verification
- **Company Mapping**: Location-based company visit tracking

### User Management
- **Role Selection**: Initial role assignment flow for new users
- **Profile Management**: User information and company assignment
- **Team Organization**: Hierarchical user management by role

### Schedule Management
- **Schedule Creation**: Time-based work scheduling
- **Status Tracking**: Active, completed, and cancelled schedule states
- **Employee Assignment**: Schedule assignment to specific users

### Check-in System
- **Location Verification**: GPS-based attendance tracking
- **Company Association**: Check-ins linked to specific companies
- **Time Tracking**: Automatic duration calculation
- **Notes Support**: Optional notes for check-in context

## Data Flow

### Authentication Flow
1. User accesses application
2. Replit Auth redirects to OpenID Connect provider
3. User authentication and token exchange
4. Session creation and storage in PostgreSQL
5. Role-based dashboard routing

### Check-in Flow
1. Employee requests geolocation permission
2. Location coordinates captured via browser API
3. Company selection from assigned companies
4. Check-in record creation with location data
5. Real-time status updates and dashboard refresh

### Schedule Management Flow
1. Manager creates schedules for employees
2. Schedule data stored with time and company information
3. Employees view assigned schedules on dashboard
4. Status updates tracked throughout schedule lifecycle

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Web application framework
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for Node.js

## Deployment Strategy

### Development Environment
- **Server**: Node.js with tsx for TypeScript execution
- **Frontend**: Vite development server with HMR
- **Database**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth development configuration

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild compilation to `dist/index.js`
- **Database**: Drizzle migrations via `drizzle-kit push`
- **Assets**: Static file serving from build output

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Allowed domains for authentication
- **ISSUER_URL**: OpenID Connect provider URL

## Changelog

Recent Major Updates:
- July 01, 2025. Enhanced with comprehensive Employee-focused real-time collaboration features
  ✓ Real-time chat system with group/direct messaging, file sharing, and voice notes
  ✓ Task management with photo/video proof, location verification, and time tracking
  ✓ Enhanced shift management with peer-to-peer swap requests and coverage
  ✓ Real-time notifications system for all activities
  ✓ Poll and announcement broadcast capabilities
  ✓ Comprehensive database schema with 15+ new tables
  ✓ Mobile-optimized UI components for field workers
  ✓ Full API backend supporting all Employee workflow features

- July 01, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.