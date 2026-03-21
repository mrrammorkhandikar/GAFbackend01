# GAF Backend Setup Guide

## Prerequisites
- Node.js >= 18.x
- PostgreSQL database (Supabase)
- Supabase account

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `backend/.env` in this folder. The app loads **only** this file (see `lib/loadEnv.js`); it does not read `.env.vercel` or `.env.example` at runtime.

Required variables include:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/public key
- `DATABASE_URL` - Your PostgreSQL connection string

### 3. Database Setup
Generate Prisma client and run migrations:
```bash
npm run build
npm run migrate
```

### 4. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:3001`

## Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run build` - Generate Prisma client
- `npm run migrate` - Run database migrations
- `npm run migrate:deploy` - Deploy migrations to production
- `npm run studio` - Open Prisma Studio for database browsing

## API Endpoints

### Admin Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `GET /api/admin/stats` - Get admin dashboard statistics

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Event Registrations
- `GET /api/event-registrations` - Get all event registrations
- `GET /api/event-registrations/:id` - Get registration by ID
- `POST /api/event-registrations` - Register for event

### Volunteer Opportunities
- `GET /api/volunteer-opportunities` - Get all volunteer opportunities
- `GET /api/volunteer-opportunities/:id` - Get opportunity by ID
- `POST /api/volunteer-opportunities` - Create new opportunity
- `PUT /api/volunteer-opportunities/:id` - Update opportunity
- `DELETE /api/volunteer-opportunities/:id` - Delete opportunity

### Volunteer Submissions
- `GET /api/volunteer-submissions` - Get all volunteer applications
- `GET /api/volunteer-submissions/:id` - Get application by ID
- `POST /api/volunteer-submissions` - Submit volunteer application

### Careers
- `GET /api/careers` - Get all career opportunities
- `GET /api/careers/:id` - Get career by ID
- `POST /api/careers` - Create new career opportunity
- `PUT /api/careers/:id` - Update career opportunity
- `DELETE /api/careers/:id` - Delete career opportunity

### Career Applications
- `GET /api/career-applications` - Get all career applications
- `GET /api/career-applications/:id` - Get application by ID
- `POST /api/career-applications` - Submit career application

### Team Members
- `GET /api/team` - Get all team members
- `GET /api/team/:id` - Get team member by ID
- `POST /api/team` - Create new team member
- `PUT /api/team/:id` - Update team member
- `DELETE /api/team/:id` - Delete team member

### Donations
- `GET /api/donations` - Get all donations
- `POST /api/donations` - Create new donation
- `PATCH /api/donations/:id/status` - Update donation status

### Contact Forms
- `GET /api/contact` - Get all contact submissions
- `GET /api/contact/:id` - Get contact submission by ID
- `POST /api/contact` - Submit contact form
- `PATCH /api/contact/:id/status` - Update contact status

## File Uploads
All image uploads are stored in Supabase Storage buckets:
- Campaign images: `campaigns-images` bucket
- Event images: `events-images` bucket
- Team photos: `team-photos` bucket
- Donation receipts: `receipts` bucket (private)

## Error Handling
The API includes comprehensive error handling for:
- Database errors (Prisma)
- Validation errors
- File upload errors
- Route not found errors

## Security Features
- Helmet.js for security headers
- CORS configuration
- Input validation
- File type and size restrictions