# BDA-Cali Design Documentation

**Project:** Food Bank Donation Management Application
**Organization:** Banco de Alimentos (BDA) Cali, Colombia
**Version:** 1.0.0
**Last Updated:** December 5, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture](#architecture)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Core Features](#core-features)
6. [Data Models](#data-models)
7. [Technology Stack](#technology-stack)
8. [Screen Flows](#screen-flows)
9. [Backend Services](#backend-services)
10. [Security & Authentication](#security--authentication)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### Project Background

The BDA-Cali application is a comprehensive mobile solution developed by the Frugal Innovation Hub at Santa Clara University to streamline donation tracking and invoice generation for Banco de Alimentos in Cali, Colombia. The application addresses the critical need for efficient food donation management, enabling seamless coordination between donors, warehouse staff, and delivery drivers.

### Team

**Development Team:**
- Alex Fang - Web Design & Engineering
- Arren Leung - Computer Engineering
- Adrian Ramirez - Web Design & Engineering
- Rodrigo Mejia - Web Design & Engineering

**Faculty Advisors:**
- Angela Musurlian
- Allan Baez Morales

### Key Objectives

1. **Digitize Donation Tracking:** Replace manual paper-based processes with a mobile-first digital solution
2. **Automate Invoice Generation:** Generate tax-deductible receipts automatically from donation data
3. **Optimize Logistics:** Enable efficient driver assignment and pickup coordination
4. **Improve Data Accuracy:** Use OCR technology to extract donation details from receipts
5. **Enhance Transparency:** Provide real-time visibility into donation pipeline status

---

## System Overview

### Problem Statement

Food banks in developing countries often struggle with:
- Manual paperwork for tracking donations
- Time-consuming invoice generation for tax deductions
- Inefficient driver coordination and pickup logistics
- Data entry errors from manual transcription
- Lack of real-time visibility into donation status

### Solution

BDA-Cali provides a unified mobile application with role-based interfaces for:

1. **Warehouse Staff:** Manage incoming donation requests, assign drivers, track inventory
2. **Drivers:** View assigned pickups, navigate to locations, complete deliveries with photo documentation
3. **Administrators:** Oversee all operations, manage user accounts, generate reports

### Core Value Propositions

- **95% reduction** in manual data entry through OCR receipt scanning
- **Real-time tracking** of donations from request to warehouse delivery
- **Automated invoice generation** with tax deduction calculations
- **GPS-integrated navigation** for efficient driver routing
- **Digital signature capture** for proof of delivery
- **Multi-language support** (English/Spanish) for Colombian context

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
│                   (React Native + Expo)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Warehouse  │  │    Driver    │  │  Admin Portal    │   │
│  │  Interface  │  │  Interface   │  │                  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Services                         │
│  ┌────────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Authentication │  │  Firestore  │  │ Cloud Storage   │  │
│  │   (Auth)       │  │  (NoSQL DB) │  │ (Images/Files)  │  │
│  └────────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Cloud Functions (Serverless Backend)           │ │
│  │  - OCR Processing (GPT-4 Vision)                       │ │
│  │  - Invoice Generation                                  │ │
│  │  - Notification Management                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  OpenAI API  │  │  Google Maps │  │  Push Notifs    │   │
│  │  (GPT-4o)    │  │  (Navigation)│  │  (Expo)         │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
src/
├── screens/               # UI screens organized by feature
│   ├── donations/         # Donation management screens
│   │   ├── pending/       # Pending donation requests
│   │   ├── accepted/      # Accepted & driver-assigned donations
│   │   ├── pickedup/      # Completed pickups
│   │   └── driver/        # Driver-specific screens
│   ├── login/             # Authentication screens
│   ├── settings/          # User settings & admin
│   └── HomeScreen.js      # Main dashboard
├── components/            # Reusable UI components
│   ├── pickup/            # Pickup-related components
│   │   ├── PackagingSelector.tsx
│   │   ├── WeightInputRow.tsx
│   │   └── AccessInfoCard.tsx
│   ├── PickupItemsListV3.tsx
│   └── ...
├── services/              # Business logic & API calls
│   └── ocrService.ts      # OCR processing service
├── redux/                 # State management
├── firebase/              # Firebase configuration
│   └── config.ts
├── types/                 # TypeScript type definitions
│   ├── pickup.types.ts
│   └── pickupItem.types.ts
└── constants/             # App-wide constants
```

### Data Flow Pattern

The application follows a unidirectional data flow:

1. **User Interaction** → UI Component
2. **Component** → Redux Action / Firebase Service
3. **Service** → Firebase Backend (Firestore / Cloud Functions)
4. **Backend** → Process & Return Data
5. **Service** → Update Redux State
6. **State Change** → Component Re-render

---

## User Roles & Permissions

### 1. Warehouse Staff

**Responsibilities:**
- Review incoming donation requests
- Accept/reject donation offers
- Assign drivers to accepted donations
- Track donation inventory
- Generate invoices for donors

**Access Rights:**
- Read/Write: Pending donations
- Read/Write: Accepted donations
- Read: Driver profiles
- Read: Completed pickups
- Write: Invoice generation

**Key Screens:**
- Pending Donations List
- Accepted Donations Dashboard
- Driver Assignment Interface
- Inventory Management

### 2. Driver

**Responsibilities:**
- View assigned pickup tasks
- Navigate to donor locations
- Complete pickups with documentation
- Capture receipt photos & signatures
- Record donation details (weight, items, value)

**Access Rights:**
- Read: Assigned donations only
- Write: Update pickup status
- Write: Upload photos/signatures
- Write: Complete pickup records

**Key Screens:**
- My Assigned Pickups
- Pickup Navigation (GPS)
- Pickup Completion Screen
- Receipt Scanner (OCR)
- Signature Capture

### 3. Administrator

**Responsibilities:**
- Manage user accounts (drivers, warehouse staff)
- Configure system settings
- Generate reports & analytics
- Monitor all operations
- Manage warehouse locations

**Access Rights:**
- Full Read/Write access to all collections
- User management privileges
- System configuration access
- Analytics & reporting

**Key Screens:**
- User Management
- Analytics Dashboard
- System Configuration
- Warehouse Management

---

## Core Features

### Feature 1: Donation Request Management

**Description:**
Warehouse staff can review incoming donation requests, evaluate them based on food bank criteria, and accept/reject offers.

**User Flow:**
1. Donation request appears in "Pending" tab
2. Staff reviews donor information, donation details
3. Staff accepts or rejects with optional notes
4. Accepted donations move to "Accepted" tab
5. System sends notification to donor

**Technical Implementation:**
- Firestore collection: `pending`
- Real-time updates via Firestore listeners
- Status transitions: `pending` → `accepted` / `rejected`

**Key Components:**
- `src/screens/donations/pending/` - Pending donation screens

---

### Feature 2: Driver Assignment & Routing

**Description:**
Warehouse staff assign drivers to accepted donations. Drivers receive notifications and can navigate to donor locations using integrated GPS.

**User Flow:**
1. Staff selects accepted donation
2. Staff assigns available driver
3. Driver receives push notification
4. Driver views pickup details & location
5. Driver taps "Navigate" to open Google Maps
6. Driver arrives and completes pickup

**Technical Implementation:**
- Firestore collection: `accepted`
- Driver assignment field: `pickup.driver` (UID reference)
- GPS coordinates: `location.latitude`, `location.longitude`
- Navigation integration: `react-native-open-maps`

**Key Components:**
- Driver assignment modal
- `react-native-maps` for location display
- Push notifications via Expo

---

### Feature 3: OCR Receipt Scanning

**Description:**
Drivers can photograph donation receipts and automatically extract item details, quantities, and values using GPT-4 Vision AI.

**User Flow:**
1. Driver captures receipt photo via camera
2. Tap "Scan Receipt to Auto-Fill Items"
3. Image uploads to Firebase Storage
4. Cloud Function processes with GPT-4 Vision
5. Extracted items populate pickup form
6. Driver reviews/edits items
7. Confidence badges show OCR accuracy

**Technical Implementation:**
- **Frontend:** `src/services/ocrService.ts`
- **Backend:** Cloud Function `processReceiptOCR`
- **AI Model:** OpenAI GPT-4o with vision capabilities
- **Storage:** Firebase Storage for receipt images
- **Prompt Engineering:** Custom instructions for Spanish receipts

**OCR Workflow:**

```
┌─────────────┐
│   Driver    │
│  Captures   │
│  Receipt    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Upload to Firebase     │
│  Storage (JPEG)         │
│  iOS: XMLHttpRequest    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Cloud Function:        │
│  processReceiptOCR      │
│  (Node.js 20, 512MB)    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  OpenAI GPT-4 Vision    │
│  - Parse table structure│
│  - Extract items        │
│  - Identify categories  │
│  - Calculate values     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Return JSON:           │
│  - Items array          │
│  - Confidence scores    │
│  - Categories           │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Auto-populate Form     │
│  + Confidence Badges    │
│  (Green/Yellow/Red)     │
└─────────────────────────┘
```

**GPT-4 Vision Prompt:**

```
Analyze this food donation receipt image.

INSTRUCTIONS:
1. IGNORE the header, store name, address, phone numbers, and zip codes.
2. Look for a TABLE structure with columns like "QTY", "DESCRIPTION", "ITEM", and "VALUE" or "PRICE".
3. Extract items row by row from the table.
4. For each item, identify:
   - Quantity (number of units)
   - Description/Name
   - Unit price or total value
   - Food category (produce, dairy, bakery, canned_goods, dry_goods, meat, frozen, or other)
5. Ignore subtotals, tax, and payment information.

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "items": [
    {
      "description": "item name",
      "category": "produce|dairy|bakery|canned_goods|dry_goods|meat|frozen|other",
      "quantity": 2,
      "unitPrice": 5.99,
      "totalValue": 11.98
    }
  ],
  "overallConfidence": 0.95
}
```

**Confidence Badge System:**
- **Green (≥85%)**: High confidence - data likely accurate
- **Yellow (75-84%)**: Medium confidence - recommend verification
- **Red (<75%)**: Low confidence - manual review required

**Error Handling:**
- Network failures: Retry logic with exponential backoff
- OCR failures: Graceful fallback to manual entry
- Low confidence: Alert driver with verification prompt
- Invalid receipts: User-friendly error messages

**Cost Tracking:**
- Free tier: 1,000 requests/month
- After free tier: $1.50 per 1,000 requests
- Expected monthly cost (500 pickups): $0 (under free tier)

**Key Files:**
- `src/services/ocrService.ts` - Frontend OCR service
- `functions/index.js` - `processReceiptOCR` Cloud Function
- `src/screens/donations/driver/PickupCompleteScreenV2.tsx` - OCR UI integration
- `src/components/PickupItemsListV3.tsx` - Confidence badges

---

### Feature 4: Pickup Completion & Documentation

**Description:**
Drivers complete pickups by recording donation details, capturing photos, and obtaining donor signatures.

**User Flow:**
1. Driver arrives at donor location
2. Captures receipt photo (optional OCR scan)
3. Records donation items:
   - Category (produce, dairy, meat, etc.)
   - Packaging type (boxes, bags, pallets)
   - Quantity & weight
   - Estimated value
4. Captures donor signature
5. Uploads photo documentation
6. Submits completed pickup
7. Record moves to `pickedup` collection

**Technical Implementation:**
- Weight-based calculations
- Multi-item entry with dynamic form
- Signature canvas: `react-native-signature-canvas`
- Image picker: `expo-image-picker`
- Validation: Required fields, format checks

**Data Captured:**

```typescript
interface PickupRecord {
  id: string;
  donorInfo: {
    name: string;
    nit: string;
    address: string;
    phone: string;
  };
  pickup: {
    driver: string;        // Driver UID
    completedAt: Timestamp;
    signature: string;     // Storage URL
    receiptPhoto: string;  // Storage URL
  };
  items: PickupItem[];    // Array of donated items
  totalWeight: number;     // kg
  totalValue: number;      // COP
  taxDeductionAmount: number;
}
```

**Key Components:**
- `src/screens/donations/driver/PickupCompleteScreenV2.tsx`
- `src/components/PickupItemsListV3.tsx`
- `src/components/pickup/PackagingSelector.tsx`
- `src/components/pickup/WeightInputRow.tsx`

---

### Feature 5: Invoice Generation

**Description:**
Automatic generation of tax-deductible receipts for donors based on pickup data.

**User Flow:**
1. Pickup completed and submitted
2. System calculates tax deduction (based on Colombian tax law)
3. Invoice generated with donation details
4. PDF created and stored
5. Donor receives invoice via email/download link

**Invoice Components:**
- Donor information (name, NIT/tax ID)
- Donation date & location
- Itemized list of donated goods
- Total weight & estimated value
- Tax deduction calculation
- BDA official signature/seal
- Legal compliance text

**Technical Implementation:**
- PDF generation library (future implementation)
- Template-based invoice design
- Email delivery service integration
- Invoice storage in Firebase Storage

**Tax Deduction Formula:**
```
Tax Deduction = Total Donation Value × Colombian Deduction Rate
```

---

### Feature 6: Real-Time Notifications

**Description:**
Push notifications keep users informed of status changes and assignments.

**Notification Triggers:**
- Driver assigned to pickup → Driver receives notification
- Pickup completed → Warehouse staff notified
- Donation request status change → Donor notified
- New donation request → Warehouse staff notified

**Technical Implementation:**
- Expo Push Notifications
- Device token management
- Firestore triggers for status changes
- Notification scheduling

---

## Data Models

### Users Collection

```typescript
interface User {
  uid: string;
  email: string;
  type: 'admin' | 'warehouse' | 'driver';
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Driver-specific fields
  licenseNumber?: string;
  vehicleType?: string;

  // Warehouse-specific fields
  warehouseId?: string;

  // Notification settings
  pushToken?: string;
  notificationsEnabled: boolean;
}
```

**Collection:** `users`
**Security:** Role-based access control

---

### Pending Donations Collection

```typescript
interface PendingDonation {
  id: string;
  donorInfo: {
    name: string;
    nit: string;           // Colombian tax ID
    address: string;
    phone: string;
    email?: string;
  };
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  donationDetails: {
    estimatedWeight: string;
    estimatedValue: string;
    foodCategories: string[];
    notes?: string;
  };
  status: 'pending';
  createdAt: Timestamp;
  requestedPickupDate?: Timestamp;
}
```

**Collection:** `pending`
**Access:** Warehouse staff (read/write)

---

### Accepted Donations Collection

```typescript
interface AcceptedDonation extends PendingDonation {
  status: 'accepted' | 'assigned' | 'in_progress';
  acceptedAt: Timestamp;
  acceptedBy: string;      // Warehouse staff UID

  pickup: {
    driver?: string;        // Driver UID (when assigned)
    assignedAt?: Timestamp;
    scheduledDate?: Timestamp;
    estimatedArrival?: string;
  };

  warehouseNotes?: string;
}
```

**Collection:** `accepted`
**Access:**
- Warehouse staff (read/write)
- Assigned driver (read, update status)

---

### Completed Pickups Collection

```typescript
interface CompletedPickup extends AcceptedDonation {
  status: 'completed';

  pickup: {
    driver: string;
    assignedAt: Timestamp;
    completedAt: Timestamp;

    // Documentation
    signature: string;       // Firebase Storage URL
    receiptPhoto: string;    // Firebase Storage URL
    additionalPhotos?: string[];
  };

  items: PickupItem[];

  totals: {
    totalWeight: number;     // kg
    totalValue: number;      // COP
    taxDeductionAmount: number;
  };

  invoice?: {
    id: string;
    generatedAt: Timestamp;
    pdfUrl: string;
  };
}
```

**Collection:** `pickedup`
**Access:**
- Warehouse staff & admin (read/write)
- Driver who completed (read only)

---

### Pickup Item Model

```typescript
interface PickupItem {
  id: string;
  category: DonationCategory;
  packaging: PackagingDetail[];
  totalWeight: string;      // kg
  totalValue: string;       // COP

  // OCR-specific fields
  confidence?: number;      // 0-1 (OCR confidence score)
  rawText?: string;         // Original OCR text for debugging
}

type DonationCategory =
  | 'produce'
  | 'dairy'
  | 'bakery'
  | 'canned_goods'
  | 'dry_goods'
  | 'meat'
  | 'frozen'
  | 'other';

interface PackagingDetail {
  type: 'Boxes' | 'Bags' | 'Pallets' | 'Units';
  quantity: string;
  unitPrice: string;        // COP per unit
}
```

---

### Warehouses Collection

```typescript
interface Warehouse {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: {
    maxWeight: number;      // kg
    currentWeight: number;
  };
  contactInfo: {
    phone: string;
    email: string;
    manager: string;
  };
  operatingHours: {
    weekday: string;
    weekend: string;
  };
  active: boolean;
}
```

**Collection:** `warehouses`
**Access:** Admin & warehouse staff

---

## Technology Stack

### Frontend (Mobile Application)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Native** | 0.71.14 | Cross-platform mobile framework |
| **Expo** | ~48.0.21 | Development platform & build tools |
| **TypeScript** | ^5.9.3 | Type-safe JavaScript |
| **React Navigation** | ^6.0.6 | Navigation & routing |
| **Redux Toolkit** | ^1.8.1 | State management |
| **Formik** | ^2.2.9 | Form handling & validation |

### UI Components & Libraries

| Library | Purpose |
|---------|---------|
| `react-native-elements` | Pre-built UI components |
| `react-native-vector-icons` | Icon library |
| `react-native-maps` | Google Maps integration |
| `react-native-signature-canvas` | Digital signature capture |
| `expo-image-picker` | Camera & photo library access |
| `react-native-modal-datetime-picker` | Date/time selection |

### Backend Services

| Service | Purpose |
|---------|---------|
| **Firebase Authentication** | User authentication & sessions |
| **Cloud Firestore** | NoSQL real-time database |
| **Firebase Storage** | Photo & file storage |
| **Cloud Functions** | Serverless backend logic (Node.js 20) |
| **Secret Manager** | Secure API key storage |

### External APIs

| API | Purpose | Cost |
|-----|---------|------|
| **OpenAI GPT-4o** | OCR receipt scanning | $0.005 per image (1K free/month) |
| **Google Maps API** | Navigation & geocoding | Free tier (28K requests/month) |
| **Expo Push Notifications** | Mobile notifications | Free |

### Development Tools

| Tool | Purpose |
|------|---------|
| `firebase-tools` | Firebase CLI for deployment |
| `@faker-js/faker` | Test data generation |
| `patch-package` | NPM package patching |
| `expo-dev-client` | Custom development builds |

---

## Screen Flows

### 1. Login Flow

```
┌─────────────┐
│ App Launch  │
└──────┬──────┘
       │
       ▼
  ┌─────────┐
  │ Logged  │
  │   In?   │
  └────┬────┘
       │
   ┌───┴───┐
   │       │
  Yes      No
   │       │
   │       ▼
   │  ┌─────────────┐
   │  │ Login Screen│
   │  └──────┬──────┘
   │         │
   │         ▼
   │  ┌──────────────────┐
   │  │ Email/Password   │
   │  │ Authentication   │
   │  └──────┬───────────┘
   │         │
   └─────────┘
       │
       ▼
┌────────────────┐
│  Check Role    │
└────┬───────────┘
     │
  ┌──┴────┬────────┐
  │       │        │
Driver Warehouse Admin
  │       │        │
  ▼       ▼        ▼
```

**Implementation:** `src/screens/login/`

---

### 2. Driver Pickup Flow

```
┌─────────────────┐
│ Driver Dashboard│
│ (Assigned       │
│  Pickups List)  │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ Select Pickup    │
│ - Donor info     │
│ - Location       │
│ - Estimated value│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Navigate Button  │
│ (Opens Maps)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Arrive at        │
│ Location         │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Pickup Completion Screen │
│                          │
│ 1. Capture Receipt Photo │
│ 2. Scan Receipt (OCR)    │◄── Optional
│ 3. Review/Edit Items     │
│ 4. Enter Weights/Values  │
│ 5. Capture Signature     │
│ 6. Upload Documentation  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────┐
│ Submit Pickup    │
│ → Firestore      │
│ → Storage        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Confirmation     │
│ "Pickup Complete"│
└──────────────────┘
```

**Key Screens:**
- `src/screens/donations/driver/PickupCompleteScreenV2.tsx`
- `src/components/PickupItemsListV3.tsx`

---

### 3. Warehouse Staff Flow

```
┌─────────────────┐
│ Warehouse       │
│ Dashboard       │
└────┬────────────┘
     │
  ┌──┴────────┬──────────┐
  │           │          │
  ▼           ▼          ▼
Pending   Accepted   Completed
  │           │          │
  ▼           ▼          ▼
```

**Pending Tab:**
```
┌──────────────────┐
│ Pending Requests │
│ - Donor info     │
│ - Estimated value│
│ - Location       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Review Details   │
│                  │
│ [Accept] [Reject]│
└────────┬─────────┘
         │
      Accept
         │
         ▼
┌──────────────────┐
│ Move to Accepted │
│ Collection       │
└──────────────────┘
```

**Accepted Tab:**
```
┌──────────────────┐
│ Accepted         │
│ Donations        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Assign Driver    │
│ - Select driver  │
│ - Set schedule   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Notify Driver    │
│ (Push Notif)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Track Status     │
│ - Assigned       │
│ - In Progress    │
│ - Completed      │
└──────────────────┘
```

---

### 4. OCR Receipt Scanning Flow

```
┌─────────────────────┐
│ Capture Receipt     │
│ Photo (Camera)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ "Scan Receipt"      │
│ Button Pressed      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Upload to Firebase Storage  │
│ - iOS: XMLHttpRequest        │
│ - MIME type: image/jpeg      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Call Cloud Function         │
│ processReceiptOCR({url})    │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ GPT-4 Vision Processing     │
│ - Extract table structure   │
│ - Parse item rows           │
│ - Identify categories       │
│ - Calculate values          │
│ - Return JSON + confidence  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Check Confidence Threshold  │
└──────┬──────────────────────┘
       │
   ┌───┴────┐
   │        │
High (>70%) Low (<70%)
   │        │
   │        ▼
   │   ┌─────────────────────┐
   │   │ Alert: Low          │
   │   │ Confidence          │
   │   │ [Use Data] [Manual] │
   │   └─────────────────────┘
   │
   ▼
┌─────────────────────────────┐
│ Auto-populate Items Form    │
│ - Items with quantities     │
│ - Estimated values          │
│ - Food categories           │
│ - Confidence badges         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Driver Reviews/Edits Items  │
│ - Adjust quantities         │
│ - Correct categories        │
│ - Update weights            │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Submit Final Pickup Data    │
└─────────────────────────────┘
```

---

## Backend Services

### Cloud Functions

#### processReceiptOCR

**Purpose:** Extract donation items from receipt photos using AI vision

**Trigger:** HTTPS Callable (from mobile app)

**Configuration:**
- Runtime: Node.js 20
- Memory: 512 MiB
- Timeout: 60 seconds
- Region: us-central1
- Secrets: `OPENAI_API_KEY`

**Input:**
```typescript
{
  receiptImageUrl: string  // Firebase Storage download URL
}
```

**Output:**
```typescript
{
  success: boolean;
  items: PickupItem[];
  overallConfidence: number;
  rawText: string;
  itemCount: number;
}
```

**Process Flow:**
1. Validate authentication
2. Retrieve OpenAI API key from Secret Manager
3. Send receipt image URL to GPT-4 Vision API
4. Parse JSON response
5. Map extracted data to PickupItem structure
6. Infer packaging types based on descriptions
7. Return structured items with confidence scores

**Error Handling:**
- `unauthenticated`: User must be logged in
- `invalid-argument`: Missing receipt URL
- `failed-precondition`: API key not configured
- `internal`: Processing errors (network, parsing)

**Cost Optimization:**
- Single API call per receipt
- 60-second timeout prevents long-running charges
- Cached confidence scores to avoid re-processing

**Key Code:** `functions/index.js` (lines 21-178)

---

### Firebase Security Rules

**Current Status:** Testing mode (allow all read/write)

**Production Rules (To Be Enabled):**

```javascript
// User read access
match /users/{uid} {
  allow read: if request.auth.uid == uid || isAdminOrWarehouse();
  allow create: if isAdminOrWarehouse();
  allow update, delete: if request.auth.uid == uid || isAdminOrWarehouse();
}

// Pending donations
match /pending/{docId} {
  allow read, write: if isAdminOrWarehouse();
}

// Accepted donations
match /accepted/{docId} {
  allow read, write: if isAdminOrWarehouse();
  allow read, update: if isDriver() && resource.data.pickup.driver == request.auth.uid;
}

// Completed pickups
match /pickedup/{docId} {
  allow read, write: if isAdminOrWarehouse();
  allow create: if isDriver() && request.resource.data.pickup.driver == request.auth.uid;
  allow read: if isDriver() && resource.data.pickup.driver == request.auth.uid;
}
```

**Security Functions:**
- `isSignedIn()` - Verify authentication
- `userRole()` - Get user's role from Firestore
- `isAdmin()`, `isWarehouse()`, `isDriver()` - Role checks
- `isAdminOrWarehouse()` - Combined permission check

---

## Security & Authentication

### Authentication Flow

**Method:** Firebase Email/Password Authentication

**Registration:**
1. Admin creates user account via admin portal
2. User receives email with temporary password
3. User logs in and changes password on first use

**Session Management:**
- Persistent sessions (device-local storage)
- Automatic token refresh
- Session timeout: 30 days (configurable)

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- Special characters recommended

### Data Security

**Encryption:**
- All data encrypted in transit (HTTPS/TLS)
- Firestore data encrypted at rest (AES-256)
- Secrets stored in Google Cloud Secret Manager

**Access Control:**
- Role-based access control (RBAC)
- Firestore security rules enforce permissions
- Cloud Function authentication checks

**Sensitive Data Handling:**
- NIT (tax ID) numbers stored encrypted
- Phone numbers masked in UI
- Signatures stored in private Firebase Storage buckets
- Receipt photos access-controlled by driver UID

**API Key Security:**
- OpenAI API key stored in Secret Manager (not in code)
- API key retrieved at runtime via `defineSecret()`
- No API keys in version control or client-side code

---

## Deployment & Infrastructure

### Mobile App Distribution

**Development:**
- Expo Go app for quick testing
- Expo Dev Client for custom native modules

**Production:**
- iOS: TestFlight (beta) → App Store
- Android: Google Play Console (internal testing) → Production

**Build Process:**
```bash
# Development build
expo build:ios --type simulator
expo build:android --type apk

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Firebase Deployment

**Cloud Functions:**
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:processReceiptOCR
```

**Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

**Storage Rules:**
```bash
firebase deploy --only storage
```

### Environment Configuration

**Development:**
- Firebase project: `bda-cali-dev`
- API keys: Development tier
- Testing mode security rules

**Production:**
- Firebase project: `bda-cali`
- API keys: Production tier with rate limits
- Strict security rules enabled

**Secrets Management:**
```bash
# Set OpenAI API key
echo "sk-proj-..." | firebase functions:secrets:set OPENAI_API_KEY

# View secrets
firebase functions:secrets:access OPENAI_API_KEY
```

### Monitoring & Logging

**Firebase Console:**
- Function logs: https://console.firebase.google.com/project/bda-cali/functions/logs
- Firestore usage: Database dashboard
- Storage usage: Storage dashboard
- Authentication: Users list

**Error Tracking:**
- Cloud Function errors logged automatically
- Client-side errors: Console logging (future: Sentry integration)

**Performance Monitoring:**
- Firebase Performance Monitoring (planned)
- Analytics: Firebase Analytics (planned)

---

## Future Enhancements

### Phase 1: Core Improvements (Q1 2026)

1. **Invoice PDF Generation**
   - Automated PDF creation from pickup data
   - Colombian tax compliance formatting
   - Email delivery to donors

2. **Advanced Analytics Dashboard**
   - Donation trends over time
   - Driver performance metrics
   - Warehouse capacity planning
   - Monthly/annual reports

3. **Multi-Warehouse Support**
   - Route optimization for multiple warehouses
   - Warehouse-specific driver assignments
   - Inter-warehouse transfers

4. **Offline Mode**
   - Cache accepted pickups for offline access
   - Queue uploads when internet unavailable
   - Sync when connection restored

### Phase 2: Enhanced Features (Q2 2026)

5. **Donor Portal**
   - Self-service donation requests
   - Track pickup status
   - Download tax receipts
   - Donation history

6. **Inventory Management**
   - Real-time stock tracking
   - Expiration date monitoring
   - Distribution tracking
   - Low-stock alerts

7. **Route Optimization**
   - AI-powered route planning for multiple pickups
   - Traffic-aware ETA calculations
   - Fuel cost optimization

8. **Advanced OCR Features**
   - Support for handwritten receipts
   - Multi-language receipt support
   - Itemized tax calculations
   - Historical receipt search

### Phase 3: Expansion (Q3-Q4 2026)

9. **Web Admin Portal**
   - Desktop interface for warehouse management
   - Bulk operations (multi-pickup assignment)
   - Advanced reporting & exports
   - User management interface

10. **Integration APIs**
    - Accounting software integration (QuickBooks, etc.)
    - Government tax reporting APIs
    - Third-party food bank networks

11. **Mobile App Enhancements**
    - Dark mode support
    - Accessibility improvements (screen readers)
    - Tablet-optimized layouts
    - Push notification customization

12. **Machine Learning**
    - Predictive donation value estimation
    - Automatic category classification improvements
    - Fraud detection (duplicate receipts)
    - Demand forecasting for warehouse planning

---

## Appendix

### File Structure Reference

```
BDA-Cali/
├── src/                          # Application source code
│   ├── components/               # Reusable UI components
│   │   ├── pickup/
│   │   │   ├── AccessInfoCard.tsx
│   │   │   ├── PackagingSelector.tsx
│   │   │   └── WeightInputRow.tsx
│   │   ├── PickupItemsList.tsx
│   │   ├── PickupItemsListV2.tsx
│   │   └── PickupItemsListV3.tsx
│   ├── constants/                # App-wide constants
│   ├── firebase/                 # Firebase configuration
│   │   └── config.ts
│   ├── redux/                    # Redux state management
│   ├── screens/                  # Application screens
│   │   ├── donations/
│   │   │   ├── accepted/
│   │   │   ├── pending/
│   │   │   ├── pickedup/
│   │   │   └── driver/
│   │   │       ├── PickupCompleteScreen.tsx
│   │   │       └── PickupCompleteScreenV2.tsx
│   │   ├── login/
│   │   ├── settings/
│   │   │   ├── admin/
│   │   │   └── editAccount/
│   │   └── HomeScreen.js
│   ├── services/                 # Business logic services
│   │   └── ocrService.ts
│   └── types/                    # TypeScript type definitions
│       ├── pickup.types.ts
│       └── pickupItem.types.ts
├── functions/                    # Firebase Cloud Functions
│   ├── index.js                  # processReceiptOCR function
│   ├── package.json
│   └── package-lock.json
├── scripts/                      # Utility scripts
│   ├── seedPending.js
│   ├── seedAccepted.js
│   ├── seedDrivers.js
│   ├── seedWarehouses.js
│   └── seedDriverPickups.js
├── docs/                         # Documentation
│   └── research/
│       └── interviews/
├── App.js                        # Application entry point
├── package.json                  # NPM dependencies
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Firestore security rules
├── README.md                     # Project overview
├── OCR_IMPLEMENTATION_PLAN.md    # OCR feature plan
├── OCR_STATUS.md                 # OCR implementation status
└── DESIGN_DOCUMENTATION.md       # This file
```

### Glossary

| Term | Definition |
|------|------------|
| **BDA** | Banco de Alimentos (Food Bank in Spanish) |
| **NIT** | Número de Identificación Tributaria (Colombian Tax ID) |
| **COP** | Colombian Peso (currency) |
| **OCR** | Optical Character Recognition |
| **GPT-4o** | OpenAI's GPT-4 Omni model with vision capabilities |
| **Firestore** | Google's NoSQL cloud database |
| **Cloud Function** | Serverless backend code execution |
| **Expo** | React Native development platform |
| **Firebase Storage** | Cloud object storage for files/images |
| **Secret Manager** | Google Cloud service for API key storage |
| **UID** | User ID (Firebase Authentication unique identifier) |

### Contact Information

**Project Repository:**
https://github.com/yoyo1109/BDA-Cali

**Firebase Project:**
https://console.firebase.google.com/project/bda-cali

**Support:**
For technical issues or questions, contact the development team via GitHub issues.

---

**Document Version:** 1.0.0
**Last Updated:** December 5, 2025
**Authors:** BDA-Cali Development Team + Claude Code
