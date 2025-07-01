# WorkForce Manager - Local Setup Guide

## Project Export Contents

This export contains:
- Complete source code for the WorkForce Manager application
- Full PostgreSQL database backup with all data
- Setup instructions for local development

## Requirements

### Software Requirements
- Node.js 20 or higher
- PostgreSQL 16 or higher
- Git (optional, for version control)

### Environment Setup

1. **Install Node.js**: Download from https://nodejs.org/
2. **Install PostgreSQL**: Download from https://postgresql.org/download/
3. **Create a local database**:
   ```bash
   # Connect to PostgreSQL as superuser
   psql -U postgres
   
   # Create database and user
   CREATE DATABASE workforce_manager;
   CREATE USER workforce_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE workforce_manager TO workforce_user;
   \q
   ```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://workforce_user:your_password@localhost:5432/workforce_manager
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

### 3. Restore Database
```bash
# Import the database backup
psql -U workforce_user -d workforce_manager < database_backup.sql
```

### 4. Push Database Schema (if needed)
```bash
npm run db:push
```

### 5. Start the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Project Structure

```
workforce-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Application pages
│   │   └── lib/           # Utilities and helpers
├── server/                # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── replitAuth.ts      # Authentication logic
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── database_backup.sql    # Complete database backup
└── package.json           # Dependencies and scripts
```

## Key Features

- **Role-based Access**: Admin, Manager, Employee roles
- **Location-based Check-ins**: GPS tracking for attendance
- **Company Management**: Client/vendor tracking
- **Real-time Chat**: Team communication
- **Task Management**: Assignment and tracking
- **Schedule Management**: Work scheduling
- **Reporting**: Attendance and billing reports

## Database Tables

The system includes 22+ tables:
- users, companies, positions
- schedules, check_ins, time_off_requests
- tasks, shifts, notifications
- chat_rooms, chat_messages
- products, announcements
- And more...

## Authentication

The system uses Replit Auth with OpenID Connect. For local development, you may need to:
1. Set up alternative authentication or
2. Configure Replit Auth for local development

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **Port Conflicts**: The app runs on port 5000 by default
3. **Missing Dependencies**: Run `npm install` to ensure all packages are installed

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push schema changes to database

## Support

This is a complete export of your WorkForce Manager application. All code, database structure, and data have been preserved.

For additional help with local setup, refer to the original project documentation or contact the development team.