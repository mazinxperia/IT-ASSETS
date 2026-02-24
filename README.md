# 🎯 AssetFlow  
### Modern IT Asset & Subscription Management Platform

---

## Overview

**AssetFlow** is a modular IT Asset and Resource Management platform designed to help organizations track physical assets, manage digital subscriptions, control employee allocations, and centralize operational oversight within a single system.

The platform combines structured data modeling, controlled transfer workflows, and administrative configuration tools with a modern, interactive interface.

AssetFlow is built for internal IT departments, growing companies, and organizations that require clear asset visibility and accountability.

---

## Technology Stack

**Frontend**
- React
- TailwindCSS
- Framer Motion

**Backend**
- FastAPI (Python)
- Async MongoDB driver (Motor)
- JWT-based authentication

**Database**
- MongoDB (Atlas compatible)

---

# Core Modules

---

## 1️⃣ Dashboard

The dashboard provides real-time operational insight into organizational assets.

### Displays

- Total Employees
- Total Assets
- Assigned Assets
- Assets in Inventory
- Assignment status breakdown
- Assets by type
- Distribution overview
- Adaptive metric widgets

Dashboard components automatically adjust based on available system data.

---

## 2️⃣ Asset Management

Comprehensive lifecycle tracking for physical IT equipment.

### Features

- Unlimited asset types (Laptop, Mobile, Tablet, etc.)
- Dynamic custom field system per asset type
- Unique asset tag enforcement
- Backend duplicate prevention
- Asset status tracking:
  - Active
  - Under Repair
  - Retired
- Warranty expiry detection with visual indicators
- Asset image uploads
- Clean model-number–focused detail view
- Employee assignment linking

All assets follow structured schemas defined per asset type.

---

## 3️⃣ Employee Management

Structured employee profiles with asset mapping.

### Features

- Unique employee ID system
- Department and designation tracking
- Assigned asset overview
- Direct navigation between employee and asset records
- Individual employee export capability
- Assignment updates via structured transfer workflow

---

## 4️⃣ Inventory

Automatic identification of unassigned assets.

### Capabilities

- Dedicated inventory view
- Asset type filtering
- Quick assignment from inventory
- Clear separation between assigned and available devices

---

## 5️⃣ Transfers

Guided multi-step asset reassignment workflow.

### Features

- Source validation (cannot select employees without assets)
- Step-based transfer wizard
- Search reset handling between steps
- Styled confirmation modal
- Complete audit trail including:
  - Standardized timestamp
  - From employee
  - To employee
  - Performed by
  - Transfer notes (popup view)
- Controlled deletion endpoint (admin-restricted)

All transfers are structured for traceability and accountability.

---

## 6️⃣ Subscriptions

Integrated SaaS and digital service tracking.

### Features

- Add and edit subscription records
- Department association
- Login URL storage
- Server-side logo fetch (CORS-safe favicon retrieval)
- Base64 file storage within MongoDB
- Clean list layout without clutter badges
- Integrated clear-data handling

Subscriptions are managed as structured organizational resources.

---

# Settings Architecture

The Settings module is fully modular and centralized.

---

## Fields

### Asset Fields
- Create and manage dynamic fields per asset type
- Field type enforcement
- Required field validation

### Employee Fields
- Extend employee schema dynamically
- Structured validation rules

---

## Personalization

- Theme configuration
- Dark mode support
- Accent consistency

---

## Branding

- Company logo upload
- Favicon configuration
- Login background customization
- Real-time preview updates

All branding assets are securely stored within MongoDB.

---

## Integration Hub

Centralized third-party integration management.

### SMTP
- TLS/SSL configuration
- Test email capability
- Export-to-email support
- Configurable sender identity

### Monday.com
- Board structure creation
- Employee-level grouping
- Asset subitem synchronization
- Corrected subitem creation logic
- Manual resync support

### Hikvision
- Device endpoint configuration
- Trailing slash normalization handling
- Structured API request management

### HRMS
- Reserved module for future HR system synchronization

### API Key
- Token-based external API access management (expandable)

---

## Database Controls

### Database
Core configuration panel.

### Database Storage
- Atlas allocated vs actual data clarity
- Storage metric visibility improvements

### Date & Time
- Standardized timestamp formatting
- Timezone handling support

### Backup & Restore
- Full system export (.assetflow format)
- ObjectId-safe serialization
- ID preservation during restore
- Assignment integrity retention

---

# Authentication Experience

AssetFlow includes a visually immersive and interactive authentication interface.

## Login Interface Highlights

### Visual Design
- Dark glassmorphism authentication panel
- Dynamic constellation background animation
- Soft particle motion with depth layering
- Subtle glow and gradient accents

### Interactive Effects
- Click-based ripple / shockwave effect
- Particle displacement interaction
- Smooth hover transitions
- Animated gradient sign-in button

### UX Enhancements
- Password visibility toggle
- Autofill styling correction for dark theme
- Responsive layout across screen sizes
- Minimal structured form layout

The login interface establishes a modern SaaS-grade experience from the first interaction.

---

# Security & Access Control

Role-Based Access Model:

### SUPER ADMIN
- Full system access
- Settings and integrations
- User management
- Asset type control

### ADMIN
- Asset and employee management
- Transfers
- Reporting
- No system-level configuration access

### USER
- Read-only access
- View dashboards and records
- No modification permissions

Additional safeguards:

- JWT expiration auto-redirect
- Self-deletion prevention
- Backend route-order validation
- Required field enforcement
- Unique asset tag validation

---

# Data Integrity Improvements

- Duplicate asset tag prevention
- Currency conversion correction
- Transfer consistency enforcement
- Backup restore assignment safeguards
- Server-side favicon fetch implementation
- Structured deletion controls

---

# Designed For

- IT departments
- Growing startups
- Mid-sized enterprises
- Organizations managing structured IT inventory
- Teams requiring traceable asset workflows

---

AssetFlow centralizes asset visibility, improves operational control, and provides a structured foundation for scalable IT resource management.