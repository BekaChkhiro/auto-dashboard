# Auto Dealer Platform - Project Plan

## Project Overview

| Field            | Value                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| **Project Name** | Auto Dealer Platform                                                                                   |
| **Description**  | Vehicle transportation tracking platform for dealers importing cars from US/Canada auctions to Georgia |
| **Project Type** | Full-Stack Web Application                                                                             |
| **Target Users** | Administrator (1), Dealers (200+)                                                                      |
| **Languages**    | Georgian, English                                                                                      |
| **Currency**     | USD                                                                                                    |
| **Status**       | In Progress                                                                                            |
| **Created**      | 2026-01-28                                                                                             |
| **Source Spec**  | auto-doc.md                                                                                            |

---

## Tech Stack

### Frontend

| Technology      | Purpose                |
| --------------- | ---------------------- |
| Next.js 14+     | Framework (App Router) |
| TypeScript      | Type Safety            |
| Tailwind CSS    | Styling                |
| shadcn/ui       | UI Components          |
| React Query     | Data Fetching          |
| Zustand         | State Management       |
| React Hook Form | Forms                  |
| Zod             | Validation             |
| next-intl       | Internationalization   |

### Backend

| Technology         | Purpose        |
| ------------------ | -------------- |
| Next.js API Routes | API            |
| Prisma             | ORM            |
| PostgreSQL         | Database       |
| NextAuth.js        | Authentication |
| Cloudflare R2      | File Storage   |

### Infrastructure

| Service       | Purpose            |
| ------------- | ------------------ |
| Railway       | Hosting (App + DB) |
| Cloudflare R2 | File Storage       |
| Resend        | Email Service      |

---

## User Roles

### Administrator (Super Admin)

- Single admin user
- Full access to all functionality
- Manage dealers, vehicles, finances
- Configure calculator prices
- View all reports and audit logs

### Dealer

- Added by admin
- Can only view own vehicles and finances
- Cannot see other dealers' data
- Cannot see own discount amount
- Can request balance top-up
- Can view invoices and transaction history

---

## Phases Overview

| Phase | Name              | Tasks        | Focus                                  |
| ----- | ----------------- | ------------ | -------------------------------------- |
| 1     | Foundation        | T1.1 - T1.8  | Project setup, auth, database          |
| 2     | Admin Core        | T2.1 - T2.10 | Admin panel, dealer/vehicle management |
| 3     | Dealer Features   | T3.1 - T3.7  | Dealer panel, balance, notifications   |
| 4     | Advanced Features | T4.1 - T4.8  | Calculator, reports, ports dashboard   |
| 5     | Polish & Deploy   | T5.1 - T5.6  | Testing, optimization, deployment      |

---

## Phase 1: Foundation

### T1.1 - Project Setup

- **Status:** DONE ✅
- **Complexity:** Medium
- **Description:** Initialize Next.js 14+ project with TypeScript, Tailwind CSS, ESLint, Prettier, Husky
- **Acceptance Criteria:**
  - Next.js App Router configured
  - TypeScript strict mode enabled
  - Tailwind CSS with custom theme
  - ESLint + Prettier configured
  - Git hooks with Husky

### T1.2 - Database Schema Setup

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T1.1
- **Description:** Create Prisma schema with all models from specification
- **Acceptance Criteria:**
  - All 19 models defined (User, Vehicle, VehiclePhoto, etc.)
  - Relations properly configured
  - Indexes for performance
  - Enum types defined

### T1.3 - Seed Data

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T1.2
- **Description:** Create seed script for initial data
- **Acceptance Criteria:**
  - Countries (USA, Canada, Georgia)
  - All US states and Canadian provinces
  - US/CA ports and Georgian ports (Poti, Batumi)
  - Auctions (Copart, IAAI, Manheim)
  - Statuses (9 predefined statuses)
  - Popular car makes and models

### T1.4 - Authentication Setup

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T1.2
- **Description:** Implement NextAuth.js with credentials provider
- **Acceptance Criteria:**
  - Email/password login
  - JWT sessions (persistent)
  - Role-based access (ADMIN, DEALER)
  - Password hashing with bcrypt
  - Protected routes middleware

### T1.5 - UI Component Library Setup

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T1.1
- **Description:** Configure shadcn/ui and create base components
- **Acceptance Criteria:**
  - shadcn/ui installed and configured
  - Theme customization (colors, fonts)
  - Base components: Button, Input, Select, Table, Card, Dialog, Toast
  - Loading states components
  - Error boundary components

### T1.6 - Layout Structure

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T1.5
- **Description:** Create layout components for admin and dealer panels
- **Acceptance Criteria:**
  - Admin layout with sidebar navigation
  - Dealer layout with sidebar navigation
  - Responsive design (mobile-first)
  - Header with user menu and language switcher
  - Breadcrumbs component

### T1.7 - Internationalization Setup

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T1.1
- **Description:** Configure next-intl for Georgian/English support
- **Acceptance Criteria:**
  - Language detection and switching
  - Translation files structure
  - Date/number formatting
  - RTL not needed (both languages LTR)

### T1.8 - File Upload Infrastructure

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T1.1
- **Description:** Setup Cloudflare R2 integration for file uploads
- **Acceptance Criteria:**
  - R2 bucket configuration
  - Presigned URL generation
  - Image optimization (WebP conversion)
  - Upload progress tracking

---

## Phase 2: Admin Core Features

### T2.1 - Admin Dashboard

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T1.6
- **Description:** Create admin main dashboard with statistics
- **Acceptance Criteria:**
  - Vehicle count by status
  - Active dealers count
  - Pending balance requests count
  - Recent activity feed
  - Quick actions

### T2.2 - Dealer Management - List

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.1
- **Description:** Dealers list page with search and filters
- **Acceptance Criteria:**
  - Paginated table with dealers
  - Search by name, email, phone
  - Filter by status (Active/Blocked)
  - Sort by name, balance, created date
  - Quick actions (edit, block/unblock)

### T2.3 - Dealer Management - CRUD

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T2.2
- **Description:** Create/Edit dealer forms and logic
- **Acceptance Criteria:**
  - Add dealer form with all fields
  - Edit dealer form
  - Set hidden discount
  - Block/unblock dealer
  - Direct balance editing
  - Validation with Zod

### T2.4 - Vehicle Management - List

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.1
- **Description:** Vehicles list page with search and filters
- **Acceptance Criteria:**
  - Paginated table with vehicles
  - Search by VIN, lot number
  - Filter by status, dealer, make, year
  - Sort by date, status
  - Archived vehicles toggle

### T2.5 - Vehicle Management - Create

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T2.4, T1.8
- **Description:** Add new vehicle form
- **Acceptance Criteria:**
  - Multi-step form or tabs
  - Dealer selection
  - Basic info (VIN, make, model, year)
  - Auction info (auction, lot, link)
  - Location selection (cascading: country > state > city > port)
  - Photo upload by stage (auction, port, arrival)
  - Validation

### T2.6 - Vehicle Management - Edit/View

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T2.5
- **Description:** Vehicle detail page and edit functionality
- **Acceptance Criteria:**
  - Full vehicle details display
  - Photo gallery with stages
  - Status change with history
  - Add/edit shipping info (ship name, container, ETA)
  - Comments section
  - Archive vehicle (soft delete)

### T2.7 - Status Management

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.6
- **Description:** Vehicle status change with history tracking
- **Acceptance Criteria:**
  - Status dropdown with predefined statuses
  - Status change creates history record
  - Audit log entry
  - Notification to dealer on status change

### T2.8 - Balance Requests Management

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.3
- **Description:** Admin view and process balance requests
- **Acceptance Criteria:**
  - List of pending requests
  - View request details (amount, receipt photo, comment)
  - Approve/reject with admin comment
  - On approve: update dealer balance, create transaction
  - Notification to dealer

### T2.9 - Invoice Management

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T2.6
- **Description:** Create and manage invoices
- **Acceptance Criteria:**
  - Create invoice form (select dealer, vehicles)
  - Invoice number generation
  - Calculate total from vehicle prices
  - PDF generation
  - Mark as paid (deduct from balance)
  - Invoice status tracking

### T2.10 - System Settings

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.1
- **Description:** Manage system configuration
- **Acceptance Criteria:**
  - Locations management (countries, states, cities, ports)
  - Makes and models management
  - Auctions list management
  - Status configuration (order, colors)

---

## Phase 3: Dealer Features

### T3.1 - Dealer Dashboard

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T1.6
- **Description:** Dealer main dashboard
- **Acceptance Criteria:**
  - Vehicle count by status (own vehicles only)
  - Current balance display
  - Recent notifications
  - Quick links to common actions

### T3.2 - Dealer Vehicle List

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T3.1
- **Description:** Dealer's own vehicles list
- **Acceptance Criteria:**
  - Table view of own vehicles
  - Search by VIN, make
  - Filter by status, date range
  - Click to view details

### T3.3 - Dealer Vehicle Details

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T3.2
- **Description:** Vehicle detail page for dealers
- **Acceptance Criteria:**
  - Basic vehicle info
  - Photo gallery with fullscreen (by stages)
  - Status timeline visualization
  - Financial info (transportation price only, no discount shown)
  - Documents (if uploaded)

### T3.4 - Balance Management

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T3.1
- **Description:** Dealer balance view and top-up requests
- **Acceptance Criteria:**
  - Current balance display
  - Request top-up form (amount, receipt upload, comment)
  - Request history with statuses
  - Transaction history (deposits, withdrawals)

### T3.5 - Dealer Invoices

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T3.1
- **Description:** Invoice viewing for dealers
- **Acceptance Criteria:**
  - List of invoices (pending, paid)
  - View invoice details
  - Download PDF
  - Pay from balance button

### T3.6 - Notifications

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T3.1
- **Description:** In-app notifications for dealers
- **Acceptance Criteria:**
  - Notification list page
  - Mark as read
  - Notification types: status change, balance, invoice, system
  - Notification bell in header with unread count

### T3.7 - Dealer Profile

- **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T3.1
- **Description:** Profile viewing and password change
- **Acceptance Criteria:**
  - View profile info
  - Edit allowed fields (phone, address)
  - Change password form
  - Cannot see discount

---

## Phase 4: Advanced Features

### T4.1 - Calculator Configuration (Admin)

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T2.10
- **Description:** Admin panel for calculator prices
- **Acceptance Criteria:**
  - Towing prices (city to port) management
  - Shipping prices (US/CA port to GE port) management
  - Insurance prices (by value ranges) management
  - Base transportation price setting

### T4.2 - Calculator API

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T4.1
- **Description:** Public API for external calculator
- **Acceptance Criteria:**
  - GET endpoints for locations (cascading)
  - POST endpoint for price calculation
  - CORS configuration for external domain
  - Rate limiting

### T4.3 - Ports Dashboard

- **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T2.6
- **Description:** Visual ports overview with vehicle counts
- **Acceptance Criteria:**
  - Hierarchical view: Country > State > Port
  - Statistics per port (en route, at port, loaded, shipped)
  - Click port to see vehicles there
  - Visual indicators (colors, counts)

### T4.4 - Reports - Dashboard

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.1
- **Description:** Enhanced admin dashboard with reports
- **Acceptance Criteria:**
  - Dealer balances summary
  - Vehicle status distribution chart
  - Monthly trends
  - Customizable date ranges

### T4.5 - Reports - Export

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T4.4
- **Description:** Export data to Excel/PDF
- **Acceptance Criteria:**
  - Export dealers list
  - Export vehicles list
  - Export transactions
  - PDF and Excel formats

### T4.6 - Audit Log

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.1
- **Description:** System-wide audit logging
- **Acceptance Criteria:**
  - Log all CRUD operations
  - Store old/new data
  - User, action, timestamp, IP
  - Searchable audit log page
  - Filter by user, action type, date

### T4.7 - Login Pages

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T1.4
- **Description:** Authentication pages
- **Acceptance Criteria:**
  - Login page
  - Forgot password page
  - Reset password page (with token)
  - Email sending via Resend

### T4.8 - Error Handling & Loading States

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** All previous
- **Description:** Global error handling and UX polish
- **Acceptance Criteria:**
  - Error boundary components
  - Toast notifications for actions
  - Loading skeletons
  - Empty states
  - 404 and error pages

---

## Phase 5: Polish & Deploy

### T5.1 - Performance Optimization

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** Phase 4
- **Description:** Optimize for < 3s page load
- **Acceptance Criteria:**
  - Image lazy loading
  - Code splitting
  - Database query optimization
  - Caching strategy

### T5.2 - Security Hardening

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** Phase 4
- **Description:** Implement security measures
- **Acceptance Criteria:**
  - CSRF protection
  - Rate limiting on sensitive endpoints
  - Input validation on all forms
  - SQL injection protection (Prisma)
  - Secure headers

### T5.3 - Responsive Testing

- **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** Phase 4
- **Description:** Test and fix mobile responsiveness
- **Acceptance Criteria:**
  - Mobile layouts work correctly
  - Touch-friendly interactions
  - Tables scroll horizontally on mobile
  - Forms usable on mobile

### T5.4 - Translation Completion

- **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** Phase 4
- **Description:** Complete all translations
- **Acceptance Criteria:**
  - All UI text in both languages
  - Error messages translated
  - Dates/numbers formatted per locale

### T5.5 - Deployment Setup

- **Status:** IN_PROGRESS 🔄
- **Complexity:** Medium
- **Dependencies:** T5.1, T5.2
- **Description:** Configure Railway deployment
- **Acceptance Criteria:**
  - Production environment variables
  - Database connection
  - R2 storage connection
  - Domain configuration
  - SSL certificate

### T5.6 - Final Testing & Launch

- **Status:** TODO
- **Complexity:** High
- **Dependencies:** T5.5
- **Description:** End-to-end testing and launch
- **Acceptance Criteria:**
  - All features tested
  - Admin workflow validated
  - Dealer workflow validated
  - Performance verified
  - Production launch

---

## Out of Scope (v1)

The following features are explicitly excluded from this version:

- Mobile application
- Push notifications
- SMS notifications
- Online payment integration
- Chat functionality
- Bulk operations
- Excel import
- Multiple admin support
- Document uploads (Title, BoL)
- Dark mode

---

## Specification Analysis

**Source Document:** auto-doc.md

### Extracted Requirements

- Full dealer management with hidden discounts
- Vehicle tracking through 9 status stages
- Financial system with balance requests and invoices
- Calculator module as external service
- Multi-language support (KA/EN)
- Comprehensive audit logging
- Soft delete for archiving

### Technical Decisions

- Next.js 14+ with App Router (as specified)
- PostgreSQL via Prisma ORM (as specified)
- Railway for hosting (as specified)
- Cloudflare R2 for files (as specified)
- NextAuth.js for authentication (as specified)

### Key Business Rules

1. Dealers cannot see their discount amount
2. Single admin user
3. Balance can go negative
4. Final price = Base price - Dealer discount
5. Vehicle photos organized by stages (Auction, Port, Arrival)
6. 9 predefined status stages for vehicle tracking

---

## Next Steps

1. Review this plan and adjust task details as needed
2. Start development with: Phase 1 - Foundation tasks
3. Track progress by updating task statuses
