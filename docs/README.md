# Proxima - Business Management Software Documentation

## Overview

Proxima is a comprehensive business management platform that integrates CRM, inventory, invoicing, quoting, and accounting features. This documentation provides an overview of all available modules and features.

---

## Main Features Overview

### Feature Categories for Landing Pages

| Category | Feature | Description | Key Capabilities |
|----------|---------|-------------|------------------|
| **Sales Management** | Quotes & Estimates | Create and manage quotes with digital acceptance | • Multi-status workflow (draft, sent, accepted)<br>• Digital signature integration<br>• Quote-to-invoice conversion<br>• Option management<br>• Client portal access |
| **Sales Management** | Invoicing | Professional invoice creation and tracking | • Multiple invoice types (standard, credit notes)<br>• Recurring/subscription invoicing<br>• Payment tracking<br>• Multi-currency support<br>• Late payment reminders<br>• EN16931 e-invoicing compliance |
| **Sales Management** | Purchase Orders | Manage supplier orders and purchases | • Supplier quote management<br>• Purchase order creation<br>• Delivery tracking<br>• Cost management |
| **CRM** | Sales Pipeline | Visual kanban-style opportunity management | • Customizable pipeline stages (new, qualified, proposal, won, lost)<br>• Drag-and-drop interface<br>• Opportunity value tracking<br>• Team collaboration<br>• Contact association |
| **CRM** | Contact Management | Comprehensive customer & supplier database | • Company and individual contacts<br>• Hierarchical contact relationships<br>• Multiple addresses (billing, delivery)<br>• Communication history<br>• Custom fields support<br>• Contact segmentation |
| **Inventory** | Stock Management | Real-time inventory tracking and traceability | • Serial number tracking<br>• Multi-location management<br>• Stock movements (received, reserved, in-transit, delivered)<br>• Batch/lot management<br>• Low stock alerts<br>• Inventory valuation |
| **Inventory** | Product Catalog | Centralized product and service management | • Products, services, and consumables<br>• Multi-supplier pricing<br>• Internal and supplier references<br>• Tax configuration<br>• Subscription products<br>• Custom fields |
| **Accounting** | Chart of Accounts | Full accounting integration | • Multi-standard support (PCG, IFRS)<br>• Automatic account creation<br>• Client/supplier account management<br>• Transaction tracking |
| **Accounting** | Financial Reports | Comprehensive financial reporting | • Revenue analysis by category<br>• Expense tracking<br>• Profit/loss calculations<br>• Period comparisons<br>• Year-over-year trends<br>• Custom report builder |
| **Accounting** | Transactions | Complete financial transaction management | • Double-entry bookkeeping<br>• Payment recording<br>• Bank reconciliation<br>• Multi-currency transactions<br>• Invoice payment linking |
| **Project Management** | Service Tracking | Task and project management | • Service task workflow (backlog, todo, in-progress, review, done)<br>• Time tracking integration<br>• Quote integration<br>• Resource assignment<br>• Project documentation |
| **Project Management** | Time Tracking | Log and track billable hours | • Time entry by task<br>• Billable hours calculation<br>• Team member time logs<br>• Reporting and analysis |
| **E-Invoicing** | Electronic Invoicing | Compliant e-invoicing (Peppol, PPF) | • SuperPDP integration<br>• EN16931 standard compliance<br>• Automatic sending/receiving<br>• Peppol network support<br>• French PPF support |
| **E-Invoicing** | Invoice Reception | Automatic incoming invoice processing | • Auto-import supplier invoices<br>• Invoice validation<br>• Automatic supplier invoice creation<br>• Status tracking |
| **Documents** | Digital Signatures | Electronic signature workflow | • Quote acceptance signatures<br>• Multi-signer support<br>• Email verification<br>• Certificate generation<br>• Audit trail |
| **Documents** | Document Management | Centralized file storage and organization | • S3-compatible storage<br>• Document versioning<br>• Thumbnail generation<br>• Access control<br>• Document linking |
| **Communication** | Email Integration | Built-in email communication | • Custom SMTP configuration<br>• Email templates<br>• Document sending<br>• Delivery tracking<br>• Email history |
| **Communication** | Notifications | Real-time notification system | • In-app notifications<br>• Email notifications<br>• Activity feed<br>• Mention system (@user)<br>• Assignment notifications |
| **Communication** | Comments & Activity | Collaboration and communication tools | • Threaded comments<br>• Activity timeline<br>• Event logging<br>• Team mentions<br>• Document attachments |
| **Analytics** | Dashboard | Real-time business metrics | • Revenue and expense tracking<br>• Profit calculations<br>• Document status overview<br>• Visual charts and graphs<br>• Period comparisons<br>• Trend analysis |
| **Analytics** | Custom Reports | Flexible reporting system | • Multi-dimensional analysis<br>• Export capabilities<br>• Period selection<br>• Category breakdown<br>• Custom metrics |
| **Customization** | Custom Fields | Flexible data model extensions | • Per-entity custom fields<br>• Multiple field types<br>• Configuration per client<br>• Search integration |
| **Customization** | Tags & Labels | Organize and categorize data | • Color-coded tags<br>• Multi-tag support<br>• Tag-based filtering<br>• Tag hierarchy |
| **Customization** | Branding | Company branding customization | • Custom logo<br>• Invoice templates<br>• Email templates<br>• Multi-language support |
| **Automation** | Recurring Invoices | Automated subscription billing | • Flexible scheduling (daily, weekly, monthly, yearly)<br>• Automatic invoice generation<br>• Subscription management<br>• End-date configuration<br>• Auto-send options |
| **Automation** | Payment Reminders | Automatic late payment follow-ups | • Configurable reminder schedules<br>• Email automation<br>• Escalation workflows<br>• Reminder history |
| **Automation** | Background Tasks | Automated workflow processing | • Task scheduling<br>• Event-driven automation<br>• Async processing<br>• Job queue management |
| **Security** | User Management | Multi-user collaboration with access control | • Role-based permissions (68+ roles)<br>• User invitation system<br>• Multi-factor authentication (MFA)<br>• Activity audit trail |
| **Security** | Multi-tenancy | Secure client isolation | • Client-based data separation<br>• Per-client configuration<br>• Cross-client security<br>• Independent databases per tenant |
| **Security** | Audit Trail | Complete change history | • All modifications tracked<br>• Before/after snapshots<br>• User attribution<br>• Request tracing<br>• Restoration capability |
| **Integration** | API Access | REST API for integrations | • RESTful endpoints<br>• JSON data format<br>• Authentication<br>• Webhooks (implied)<br>• Rate limiting |
| **Integration** | Import/Export | Data portability | • CSV export<br>• PDF generation<br>• Bulk import capabilities<br>• Data migration tools |
| **Localization** | Multi-language | International business support | • French and English<br>• Localized interfaces<br>• Localized documents<br>• Date/number formatting |

### Quick Feature Highlights

**For Sales Teams:**
- Visual sales pipeline with drag-and-drop
- Professional quote and invoice generation
- Digital signature collection
- Customer portal for quote acceptance
- Automated follow-ups and reminders

**For Operations:**
- Real-time inventory tracking
- Multi-location warehouse management
- Purchase order management
- Delivery tracking
- Stock alerts and reporting

**For Accounting:**
- Automated bookkeeping
- Multi-standard chart of accounts
- Financial reporting and analysis
- Payment tracking and reconciliation
- E-invoicing compliance (Peppol/PPF)

**For Management:**
- Real-time business dashboard
- Revenue and profitability analysis
- Team performance tracking
- Custom reports and analytics
- Complete audit trail

**For Teams:**
- Project and task management
- Time tracking for billable work
- Team collaboration tools
- Document sharing
- Activity notifications

---

## Table of Contents

1. [Dashboard](#dashboard)
2. [Sales Module](#sales-module)
   - [Quotes (Devis)](#quotes-devis)
   - [Invoices (Factures)](#invoices-factures)
3. [Inventory Module](#inventory-module)
   - [Articles](#articles)
   - [Stock Management](#stock-management)
4. [CRM Module](#crm-module)
5. [Contact Management](#contact-management)
6. [Accounting Module](#accounting-module)
7. [Additional Features](#additional-features)

---

## Dashboard

**Navigation:** Tableau de bord

### Key Metrics Display
- **Revenue Metrics (Chiffre d'affaires):** €591,104.16
  - Shows total revenue with comparison to previous period (+11% vs 2025)
  - Estimated closing revenue displayed
  
- **Expenses (Charges):** €215,095.07
  - Total expenses with period comparison (+28% vs 2025)
  - Estimated closing expenses

- **Profit (Résultat):** €376,009.09
  - Net profit calculation
  - Period comparison showing trend (-65% vs 2025)

### Document Status Overview
- **Signed Quotes:** 39 out of 68 total
- **Sent Quotes:** 68 documents
- **Paid Invoices:** 810 out of 1,295 total
- **Overdue Invoices:** 226 out of 359
- **Pending Orders:** 16 awaiting fulfillment
- **Orders to Pay:** 276 requiring payment

### Visual Analytics
- **Revenue vs Expenses Chart:** Line graph comparing monthly revenue and expenses trends
- **Year-over-Year Comparison:** Chart showing 2026/2025 performance comparison by month
- **Period Selection:** Dropdown to select fiscal year (Exercice 2026)

---

## Sales Module

### Quotes (Devis)

**Navigation:** Devis (66 documents in sidebar)

#### Quote List View
- **Status Tabs:**
  - All quotes (Tous)
  - Draft (Brouillons) - 4
  - Sent (Envoyés) - 170
  - Accepted (Acceptés) - 66
  - Subscriptions (Abonnements) - 676
  - To Invoice (À facturer) - 19
  - Completed (Terminés)

#### Quote Information Display
- Issue date and reference number (e.g., S015046, S015100)
- Client information with location
- Quote description/title
- Associated labels/tags
- Amount (with tax breakdown)
- Status indicators (percentage of completion, payment status)
- Delivery status badges

#### Quote Detail View (Example: S015046)

**Header Information:**
- Quote reference number
- Issue date and acceptance date
- Client name and contact information
- Warning banner for partial completion status
- Status badge (e.g., "Accepté")

**Content Section:**
- **Line Items Table:**
  - Article description
  - Supplier reference
  - Quantity
  - Unit price (Prix U.)
  - Total excluding tax (Résumé HT)
  - Product icons/images

**Related Documents:**
- Linked quotes (Quote origin)
- Linked orders showing fulfillment status
- Progress indicators (0%, 100%, etc.)

**Actions:**
- "Fournir les produits" (Supply products) button
- "Facturer" (Invoice) button

---

### Invoices (Factures)

**Navigation:** Factures (226 documents in sidebar)

#### Invoice List View

**Filter Tabs:**
- Accounting view (Comptabilisé)
- Draft invoices (Brouillons) - 245
- Sent invoices (Envoyés) - 133
- Unpaid (Impayés) - 226
- Completed (Terminés)

**Invoice Information Display:**
- Issue date (Émis le)
- Invoice reference (e.g., FAC/2026/01112)
- Invoice description
- Origin information (quote/order reference)
- Client name and location
- Labels/tags (e.g., "Abonnement")
- Payment status indicators
- Amount (with tax breakdown)
- Payment method indicator (blue dot for payment pending)

#### Invoice Detail View (Example: FAC/2026/01112)

**Header Section:**
- Payment status badge ("Paiement en attente" - Payment pending)
- Invoice number and dates (issue date, payment due date, acceptance date)
- Client information

**Content Section - Items Table:**
| Column | Description |
|--------|-------------|
| Article | Product/service description |
| Réf. Fournisseur | Supplier reference |
| Quantité | Quantity |
| Prix U. | Unit price |
| Résumé HT | Total excluding tax |

**Example Item:**
- Desktop Computer - Brand Name Model
- Detailed specifications (Product Reference)
- Unit price: 999,00 € (TVA 20%)
- Total: 999,00 € (Cost 760,00 €)

**Additional Services:**
- Forfait d'intervention sur site (Service fee)
- Unit price: 180,00 € (TVA 20%)
- Total: 180,00 €

**Financial Summary:**
- Total HT (Excluding tax): 1,179,00 €
- TVA (Tax): 235,80 €
- Total TTC (Including tax): 1,414,80 €
- Coût estimé HT (Estimated cost): 760,00 €

**Delivery Information (Livraison):**
- Delivery timeframe (e.g., "dans 30 jours" - within 30 days)
- Delivery address with street and postal code

**Format, Payment & Other:**
- Language selection (Français)
- Invoice/quote format options
- Payment terms configuration

**Payments Section:**
- Table showing payment history
  - Date
  - Reference
  - Documents
  - Accounts (Comptes)
  - Amount (Montant)
- "Enregistrer un paiement" (Record payment) button

**Origin (Origine):**
- Links to source documents
- Quote reference with client name and description
- Order reference with description
- Status: "Accepté" with completion indicators (100%)

**Related Orders (Devis lié):**
- Order number and issue date (e.g., #S014996, 30/03/2026)
- Order description and reference
- Origin quote information
- Client details
- Supplier information (e.g., Ingram Micro)
- Status indicators showing completion percentage

**Internal Notes:**
- Section for internal notes and documents
- "Aucune note" (No notes) placeholder

**Activity Feed:**
- User activity log
- Document creation and modification history
- Email sending records
- Timestamps (e.g., "about 2 hours ago")
- User identification

**Action Buttons:**
- Copy link button
- Print button
- Edit button
- More options menu (...)
- "Créer un avoir" (Create credit note) button
- "Enregistrer un paiement" (Record payment) button

#### Invoice Detail View (Example: FAC/2026/01107)

**Header:**
- Client information with reference number
- Invoice references for multiple line items
- Dates (30/04/2024, 31/03/2024, 29/02/2024)

**Line Items:**
- Multiple recurring items (Maintenance informatique, Abonnement...)
- Labels showing subscription type ("Abonnement")
- Payment percentage indicators (0%)
- Billing frequency ("Mensuel" - Monthly)

**Navigation:**
- Back button
- Navigation arrows
- Element counter (Element 5 sur 16715)
- Copy, link, print, edit buttons
- "Créer un avoir" (Create credit note) action

---

## Inventory Module

### Articles

**Navigation:** Articles (3,130 articles found)

#### Article List View

**Search & Filtering:**
- Advanced search bar with filter option (⌘F shortcut)
- "Filtrer les éléments ⌘F (recherche avancée ⌘⇧F)" filter prompt
- Total count display (3130 articles trouvés)

**Table Columns:**
| Column | Description |
|--------|-------------|
| # | Row number |
| Type | Article type (Consommable - Consumable) |
| Nom | Article name/description |
| Étiquettes | Labels/tags (e.g., "Logiciel CEE") |
| Prix d'achat | Purchase price |
| Prix de vente | Selling price |

**Example Articles:**
- ADOBE STOCK 750 photos
  - Label: Logiciel CEE
  - Purchase: €2,069.71 (1724,76 € HT)
  - Sale: €2,175.55 (1812,96 € HT)

- ADOBE STOCK 750 photos 1mois
  - Purchase: 172,58 € (143,82 € HT)
  - Sale: 181,30 € (151,08 € HT)

- Phone/mobile subscriptions with various data plans
  - Different tiers: 1 Go, 5 Go, 20 Go, 40 Go, 60 Go, 100 Go, 200 Go
  - Labeled as "Mensuel" (Monthly) and "Téléphonie" (Telephony)
  - Prices ranging from 7,80 € to 82,80 €

**Actions:**
- "Ajouter un article" (Add article) button

**Article Type Indicator:**
- Icon showing consumable type (⚙️ Consommable)

---

### Stock Management

**Navigation:** Stock

#### Stock Item Detail View (Example: CND54603YZ)

**Header:**
- Item reference number (CND54603YZ)
- Status badge: "En stock" (In stock)
- Element position indicator (Élément 24 sur 10373)

**Réception (Reception) Section:**
- **Article Information:**
  - Product icon
  - Full product description: "Ordinateur Portable - HP 250R G9 - Écran 39,6 cm (15,6") - Full HD - Intel Core 5 120U - 16 Go - 512 Go SSD - Argent cendré foncé - Intel Morceau - 1920 x 1080 - Windows 11 Pro - Intel - Appareil photo/Webcam - IEEE 802.11ax Norme du réseau sans-fil - Wi"
  - Item code: CND54603YZ
  - Quantity: 1 unité

**Origin and Assignment (Origine et affectation):**
- **Source Order:**
  - Order reference: P001413, Tech Data
  - Product description with supplier reference
  - Status: "Réceptionné" (Received) - 100% completion
  
- **Destination Quote:**
  - Quote reference: S014990, France Auto
  - Product description
  - Status: "Terminé" (Completed) - 0% indicators
  
- **Contact Assignment:**
  - Contact: France Auto
  - Assignment indicator showing connection

**Documents and Notes (Documents et notes):**
- "Aucune note" (No notes) placeholder

**Traçabilité (Traceability):**
- Historical usage tracking section
- Message: "Retrouvez l'historique d'utilisation de la pièce, lot d'origine ou article d'origine en cas de pièce détachée"
- "Subdiviser le lot" (Divide batch) button
- Item listing showing:
  - Reference: CND54603YZ
  - Description: Ordinateur Portable - HP 250R G9 specifications
  - Quantity: 1 unité

**Activity Section:**
- User activity log
- Document creation timestamp: "about 1 month ago"
- User identification

**Action Buttons:**
- Copy button
- Link button
- Edit button
- More options menu

---

## CRM Module

**Navigation:** CRM (453 documents found)

### Pipeline View (Kanban Board)

#### Pipeline Stages:
1. **Nouveau (New)** - 7 opportunities
2. **Qualifié (Qualified)** - 0 opportunities
3. **Proposition (Proposal)** - 171 opportunities

#### Card Information Display:
Each opportunity card shows:
- Contact/company name
- Opportunity title/description
- Value estimate
- Associated user avatars (multiple users can be assigned)
- Status indicators

**Example Opportunities:**

**Stage: Nouveau**
- Client Association A
  - "Software license request for new association member"
  - Multiple user avatars shown

- Individual Client B
  - "Laptop request with specific specifications"
  - Single user avatar

- Client Company C
  - "Hardware replacement request for docking station"
  - "Equipment link provided"
  - Multiple user avatars

**Stage: Proposition**
- Client Company D
  - "Quote request for headset replacement"
  - Single user avatar

- Client Company E
  - "Quote request for laptop charger replacement"
  - Specific model details provided
  - Multiple specifications listed

- Client Company F
  - "Computer upgrade request"
  - "RAM and charger specifications provided"
  - Laptop model details
  - Serial and service details
  - User avatar

### CRM Features:
- Drag and drop functionality between stages
- Visual pipeline management
- Contact association
- Value tracking
- Multi-user collaboration
- Document attachment (multiple avatars indicate shared access)
- Stage progression tracking

---

## Contact Management

**Navigation:** Contacts (2,457 contacts found)

### Contact List View

**Filter Options:**
- Active filter showing: "Client ⊗ Type d'entité ⊗"Company""
- Filter button with search shortcut (⌘K)
- Total count: "2457 contacts trouvés"

**Table Columns:**
| Column | Description |
|--------|-------------|
| # | Row number |
| Type | Contact type (Client - with building icon) |
| Nom | Company name |
| Étiquettes | Labels/tags |
| Relations | Associated contacts/users |

**Contact Types:**
- Client (🏢 icon) - Company/organization

**Example Contacts:**

1. **Company A**
   - Type: Client (Company)
   - Has associated contact

2. **Company B**
   - Type: Client (Company)
   - No visible relations

3. **Company C**
   - Type: Client (Company)
   - Has contact information
   - No visible relations

4. **Company D**
   - Type: Client (Company)
   - Has associated contact

5. **Company E**
   - Type: Client (Company)
   - Has associated contact

6. **Company F**
   - Type: Client (Company)
   - Has associated contact

7. **Company G**
   - Type: Client (Company)
   - Has contact information
   - Has associated contact

8. **Company H**
   - Type: Client (Company)
   - No visible relations

9. **Company I**
   - Type: Client (Company)
   - Has contact information
   - Has associated contact

10. **Company J**
    - Type: Client (Company)
    - Has contact information
    - No visible relations

11. **Company K**
    - Type: Client (Company)
    - Has associated contact

12. **Company L**
    - Type: Client (Company)
    - Has contact information
    - No visible relations

13. **Company M**
    - Type: Client (Company)
    - Has contact information
    - Has associated contact

14. **Company N**
    - Type: Client (Company)
    - Has contact information
    - Has associated contact

15. **Company O**
    - Type: Client (Company)
    - Has contact information
    - No visible relations

**Actions:**
- "Ajouter un contact" (Add a contact) button

### Contact Features:
- Company type identification
- Email and phone display
- Related person associations
- Bulk contact management
- Search and advanced filtering

---

## Accounting Module

**Navigation:** Opérations > Tableaux (Comptabilité)

### Financial Reports

#### Report Selection:
- **Report Type Dropdown:** "Chiffre d'affaires catégorisé" (Categorized Revenue)
- **Period Dropdown:** "2026" (Fiscal year selection)

### Categorized Revenue Report

**Table Structure:**

**Columns (Categories):**
- Date (Month)
- Acronis Cyber Protect Cloud
- All / SERVICE
- Déplacement (Travel)
- Envoi (Shipping)
- Installation
- IntLoc (Internal Location)
- Intnom (Internal Name)
- Logiciel CEE (CEE Software)
- Maintenance
- Matériel CEE (CEE Hardware)
- Sauvegarde (Backup)
- Additional categories (truncated)

**Data by Month (2026):**

| Month | Acronis | All/SERVICE | Déplacement | Envoi | Installation | IntLoc | Intnom | Logiciel CEE | Maintenance | Matériel CEE | Sauvegarde |
|-------|---------|-------------|-------------|-------|--------------|--------|--------|--------------|-------------|--------------|------------|
| January 2026 | 3573,82 € | 32,00 € | 190,00 € | 48,00 € | 298,50 € | 4508,20 € | 208,90 € | 27434,62 € | 31588,42 € | 252158,50 € | 4559,85 € |
| February 2026 | 3908,72 € | 0,00 € | 20,00 € | 0,00 € | 589,50 € | 1590,20 € | 336,00 € | 16055,80 € | 21600,98 € | 41443,01 € | 4446,19 € |
| March 2026 | 5981,72 € | 0,00 € | 450,00 € | 35,00 € | 702,50 € | 908,40 € | 283,60 € | 21812,26 € | 45419,44 € | 32174,88 € | 5781,04 € |
| April 2026 | 3202,02 € | 0,00 € | 35,00 € | 136,00 € | 390,00 € | 416,70 € | 0,00 € | 23771,96 € | 23853,89 € | 39145,15 € | 2074,02 € |
| May-December 2026 | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € |

**Total Row:**
- Acronis Cyber Protect Cloud: 16666,28 €
- All / SERVICE: 32,00 €
- Déplacement: 695,00 €
- Envoi: 219,00 €
- Installation: 1980,50 €
- IntLoc: 7423,50 €
- Intnom: 828,50 €
- Logiciel CEE: 89074,64 €
- Maintenance: 122462,73 €
- Matériel CEE: 364921,54 €
- Sauvegarde: 16881,10 €
- Additional totals (truncated)

### Accounting Features:
- Multi-dimensional revenue analysis
- Category-based breakdown
- Monthly trend tracking
- Year-to-date totals
- Customizable report types
- Period selection
- Export capabilities (implied by table format)

---

## Additional Features

### Global Navigation
**Sidebar Sections:**

**Ventes (Sales):**
- Tableau de bord (Dashboard)
- Notifications (4 unread)
- Devis (Quotes) - 66
- Factures (Invoices) - 226
- Avoirs (Credit Notes)

**Achats (Purchases):**
- Commandes (Orders) - 16
- Factures d'achat (Purchase Invoices) - 276

**Activité (Activity):**
- Service
- Stock
- Articles
- Contacts
- CRM

**Comptabilité (Accounting):**
- Opérations (Operations)
- Tableaux (Reports)

**Entreprise (Company):**
- Utilisateurs (Users)
- Paramètres (Settings)

### Document Count Indicators
- Real-time document counts displayed next to each module
- Badge indicators for pending notifications

### Search Functionality
- Global search bar: "Aller à..." with ⌘K shortcut
- Advanced search in list views with ⌘⇧F shortcut

### Action Buttons (Consistent across modules)
- Copy link
- Print document
- Edit document
- More options menu (...)
- Module-specific primary actions

### User Interface Features
- Clean, modern design
- Icon-based navigation
- Color-coded status indicators
- Responsive table layouts
- Modal/sidebar detail views
- Breadcrumb navigation
- Element pagination counters

### Multi-language Support
- Interface appears to be in French
- Language selection available in document formats

### Status Indicators
- Percentage completion badges
- Color-coded status tags
- Progress bars
- Payment status icons
- Delivery status badges

### Notification System
- Notification counter in sidebar (4 notifications)
- Activity feed in document details
- Email notification tracking

---

## System Capabilities Summary

Based on the visible features, Proxima offers:

### Document Management
- Quote creation and tracking
- Invoice generation and management
- Credit note handling
- Order processing
- Automated document workflows

### Customer Relationship Management
- Pipeline management with visual kanban board
- Opportunity tracking
- Multi-stage deal progression
- Team collaboration on deals

### Inventory & Stock Control
- Product catalog management
- Stock level tracking
- Traceability and batch management
- Reception and fulfillment tracking

### Financial Management
- Multi-dimensional accounting reports
- Revenue categorization
- Expense tracking
- Profit calculation
- Payment recording and tracking

### Contact & Company Management
- Centralized contact database
- Company and individual contact types
- Relationship mapping
- Contact history

### Analytics & Reporting
- Real-time dashboard with KPIs
- Visual charts and graphs
- Period comparisons
- Trend analysis
- Custom report generation

### Collaboration Features
- Multi-user assignments
- Activity feeds
- Internal notes
- Notification system

---

## Data Model & Architecture

### Core Entities

The system is built around the following primary entities:

#### 1. Users (`users`)
**Purpose:** System user accounts and authentication

**Key Fields:**
- `id`: Unique user identifier
- `id_email`: Email-based identifier
- `id_phone`: Phone-based identifier
- `role`: User role (USER, DISABLED, SYSADMIN, SYSAGENT)
- `full_name`: Display name
- `mfas`: Multi-factor authentication configuration (email, phone, app, password)
- `preferences`: User preferences (avatar, language)

#### 2. Clients (`clients`)
**Purpose:** Company/organization accounts (multi-tenancy)

**Key Fields:**
- `id`: Unique client identifier
- `company`: Company information (name, legal_name, registration_number, tax_number)
- `address`: Company address details
- `invoices_counters`: Document reference counters by type
- `payment`: Default payment terms and banking information
- `invoices`: Default invoice format settings
- `recurring`: Subscription invoice settings
- `preferences`: Company preferences (logo, language, currency)
- `smtp`: Email configuration

**Related Entities:**
- `clients_users`: User-client associations with role-based permissions

#### 3. Contacts (`contacts`)
**Purpose:** Customer and supplier contact management

**Key Fields:**
- `type`: "person" or "company"
- `is_supplier`: Supplier flag
- `is_client`: Client flag
- `has_parents`: Sub-contact flag
- `parents`: Parent contact references
- `business_name`: Company name
- `business_registered_name`: Legal company name
- `business_registered_id`: Registration number (SIRET, etc.)
- `business_tax_id`: Tax identification number
- `person_first_name`, `person_last_name`: Individual contact names
- `email`, `emails`: Contact email addresses
- `phone`, `phones`: Contact phone numbers
- `address`: Primary address
- `other_addresses`: Delivery, billing, and other addresses
- `billing`: Banking information (IBAN, BIC, payment methods)
- `invoices`: Invoice format overrides
- `payment`: Payment term overrides
- `e_invoices_identifier`: E-invoicing identifier
- `e_invoices_active`: E-invoicing enabled flag
- `notes`: Internal notes
- `documents`: Attached files
- `tags`: Categorization tags

#### 4. Articles (`articles`)
**Purpose:** Product, service, and consumable catalog

**Key Fields:**
- `type`: "product", "service", or "consumable"
- `name`: Article name
- `description`: Article description
- `internal_reference`: Internal SKU/reference
- `supplier_reference`: Supplier's reference
- `suppliers`: Associated supplier contacts
- `suppliers_details`: Supplier-specific pricing and delivery details
- `price`: Selling price
- `unit`: Unit of measure
- `tva`: Tax/VAT rate
- `subscription`: Subscription type (daily, weekly, monthly, yearly)
- `accounting`: Accounting codes for buying and selling
- `notes`: Internal notes
- `documents`: Product documentation
- `tags`: Categorization tags

**Sub-entities:**
- `SuppliersDetails`: Reference, price, delivery time, delivery quantity per supplier

#### 5. Invoices (`invoices`)
**Purpose:** Unified document management (quotes, invoices, credit notes, supplier documents)

**Key Fields:**
- `type`: Document type
  - Client-facing: "quotes", "invoices", "credit_notes"
  - Supplier-facing: "supplier_quotes", "supplier_invoices", "supplier_credit_notes"
- `state`: Document state
  - Quotes: "draft", "sent", "purchase_order", "completed", "closed"
  - Invoices/Credit Notes: "draft", "sent", "closed"
  - Recurring: "recurring"
- `name`: Document title
- `reference`: Document reference number
- `alt_reference`: Alternative reference
- `supplier`: Supplier contact (for supplier documents)
- `client`: Client contact (for client documents)
- `contact`: Person contact within the company
- `emit_date`: Issue date
- `wait_for_completion_since`: Quote acceptance date
- `language`: Document language
- `currency`: Currency code
- `delivery_address`: Delivery address
- `delivery_date`: Expected delivery date
- `delivery_delay`: Delivery delay in days
- `content`: Invoice lines (items, quantities, prices)
- `discount`: Document-level discount
- `total`: Pre-computed totals (tax, amounts)
- `articles`: Referenced articles and tags
- `transactions`: Payment records
- `invoiced`: For quotes, list of generated invoices
- `payment_information`: Payment terms and banking details
- `format`: Invoice format preferences
- `recipients`: Email recipients
- `reminders`: Payment reminder configuration
- `next_reminder`: Next reminder date
- `subscription`: Recurring invoice configuration
- `from_subscription`: Origin subscription information
- `subscription_next_invoice_date`: Next invoice generation date
- `attachments`: Customer-visible attachments
- `en16931`: EN16931-compliant invoice data for e-invoicing
- `notes`: Internal notes
- `documents`: Internal documents
- `tags`: Categorization tags

**Related Fields:**
- `from_rel_invoice`: For credit notes, original invoice reference
- `from_rel_quote`: For invoices, original quote reference

**Sub-entities:**
- `InvoiceLine`: Individual line item
- `InvoiceDiscount`: Discount configuration
- `InvoiceTotal`: Computed totals
- `PaymentComputed`: Payment status
- `InvoicedComputed`: Invoicing status for quotes
- `Payment`: Payment terms
- `InvoiceFormat`: Document format settings
- `Recipient`: Email recipient
- `InvoiceReminder`: Reminder configuration
- `InvoiceSubscription`: Recurring subscription settings
- `FromSubscription`: Subscription origin tracking

#### 6. Stock Items (`stock_items`)
**Purpose:** Inventory and stock tracking

**Key Fields:**
- `state`: Stock state
  - "bought": Purchased from supplier
  - "stock": In warehouse/stock
  - "reserved": Reserved for client
  - "in_transit": Being delivered
  - "delivered": Delivered to client
  - "depleted": Consumed (for consumables)
- `article`: Referenced article
- `serial_number`: Unique serial/lot number
- `type`: Type override (product, service, consumable)
- `quantity`: Current quantity available
- `client`: Client contact
- `for_rel_quote`: Associated quote/invoice
- `for_rel_quote_content_index`: Line item index in quote
- `from_rel_supplier_quote`: Source supplier quote
- `location`: Storage location
- `from_rel_original_stock_items`: Parent stock items (when split)
- `assigned`: Assigned users
- `notes`: Internal notes
- `documents`: Documentation
- `tags`: Categorization tags

#### 7. Stock Locations (`stock_locations`)
**Purpose:** Warehouse and storage location hierarchy

**Key Fields:**
- `type`: "warehouse" or "shelf"
- `name`: Location name
- `parent`: Parent location reference

#### 8. CRM Items (`crm_items`)
**Purpose:** Sales pipeline and opportunity management

**Key Fields:**
- `state`: Pipeline stage
  - "new": New opportunity
  - "qualified": Qualified lead
  - "proposal": Proposal sent
  - "won": Deal won
  - "lost": Deal lost
- `contacts`: Associated contacts
- `notes`: Opportunity notes (HTML)
- `contact_summaries`: Cached contact information
- `seller`: Primary salesperson
- `assigned`: Assigned team members
- `tags`: Categorization tags

#### 9. Service Items (`service_items`)
**Purpose:** Service task and project management

**Key Fields:**
- `state`: Task state
  - "backlog": Planned but not scheduled
  - "todo": Scheduled
  - "in_progress": Active work
  - "in_review": Under review
  - "done": Completed
  - "cancelled": Cancelled
- `title`: Task title
- `article`: Service article reference
- `quantity_expected`: Estimated hours
- `quantity_spent`: Actual hours (computed from time entries)
- `started_at`: Start date
- `signatures`: Digital signatures
- `client`: Client contact
- `for_rel_quote`: Associated quote/invoice
- `for_no_quote`: Task not linked to any quote
- `from_rel_original_service_item`: Parent task (for sub-tasks)
- `assigned`: Assigned users
- `notes`: Task notes
- `documents`: Documentation
- `tags`: Categorization tags

#### 10. Service Times (`service_times`)
**Purpose:** Time tracking for services

**Key Fields:**
- `description`: Time entry description
- `quantity`: Time quantity
- `unit`: Unit of measure
- `date`: Entry date
- `service`: Associated service item
- `assigned`: User who logged time

#### 11. Accounting Accounts (`accounting_accounts`)
**Purpose:** Chart of accounts

**Key Fields:**
- `type`: "client", "supplier", or "internal"
- `contact`: Associated contact
- `standard_identifier`: Account code (e.g., PCG number)
- `standard`: Accounting standard (PCG, IFRS)
- `name`: Account name
- `notes`: Account notes

#### 12. Accounting Transactions (`accounting_transactions`)
**Purpose:** Financial transaction records

**Key Fields:**
- `transaction_date`: Transaction date
- `reference`: Transaction reference
- `credit`: Credit account
- `debit`: Debit account
- `amount`: Transaction amount
- `currency`: Currency code
- `rel_invoices`: Related invoices
- `assigned`: Assigned users
- `notes`: Transaction notes
- `documents`: Supporting documents
- `tags`: Categorization tags

#### 13. Tags (`tags`)
**Purpose:** Categorization and labeling

**Key Fields:**
- `name`: Tag name
- `color`: Tag color for UI display

#### 14. Files (`files`)
**Purpose:** File storage and attachment management

**Key Fields:**
- `rel_table`: Related entity table name
- `rel_id`: Related entity ID
- `rel_field`: Related field name
- `rel_unreferenced`: Orphaned file flag
- `key`: S3 storage key
- `name`: File name
- `mime`: MIME type
- `size`: File size in bytes
- `has_thumbnail`: Thumbnail availability flag

#### 15. Comments (`comments`)
**Purpose:** Activity feed and commenting system

**Key Fields:**
- `item_entity`: Referenced entity type
- `item_id`: Referenced entity ID
- `content`: Comment text (HTML)
- `documents`: Attached files
- `type`: "comment" or "event"
- `event_type`: Event type for system events
- `reactions`: User reactions to comments
- `metadata`: Event-specific metadata

**Event Types:**
- `invoice_sent`: Invoice sent to recipients
- `quote_sent`: Quote sent to recipients
- `quote_signed`: Quote signed by client
- `quote_refused`: Quote refused by client
- `smtp_failed`: Email delivery failure
- `invoice_back_to_draft`: Invoice reverted to draft

#### 16. Threads (`threads`)
**Purpose:** Comment thread subscriptions

**Key Fields:**
- `item_entity`: Referenced entity type
- `item_id`: Referenced entity ID
- `subscribers`: Subscribed users

#### 17. Notifications (`notifications`)
**Purpose:** User notification system

**Key Fields:**
- `user_id`: Recipient user
- `entity`: Referenced entity type
- `entity_id`: Referenced entity ID
- `entity_display_name`: Display name for entity
- `type`: Notification type
  - "mentioned": User mentioned in comment
  - "assigned": Entity assigned to user
  - "modified": Entity modified
  - "commented": New comment on entity
  - Plus all event types from comments
- `metadata`: Notification details (user, field, content)
- `also`: Grouped similar notifications
- `last_notified_at`: Last notification timestamp
- `read`: Read status

#### 18. Fields (`fields`)
**Purpose:** Custom field definitions

**Key Fields:**
- `document_type`: Entity type
- `code`: Field code
- `name`: Field display name
- `type`: Field data type
- `options`: Field configuration

#### 19. E-Invoicing Configuration (`e_invoicing_config`)
**Purpose:** E-invoicing platform integration (SuperPDP)

**Key Fields:**
- `pdp_provider`: Platform provider (SuperPDP)
- `integration_client_id`: OAuth client ID
- `integration_client_secret_encrypted`: Encrypted client secret
- `access_token_encrypted`: Encrypted OAuth access token
- `refresh_token_encrypted`: Encrypted OAuth refresh token
- `token_expires_at`: Token expiration timestamp
- `superpdp_company_id`: SuperPDP company identifier
- `superpdp_company`: Company information from SuperPDP
- `superpdp_directory_entries`: Directory entries (Peppol, PPF)
- `connection_status`: "not_configured", "connected", or "error"
- `receive_enabled`: Auto-fetch received invoices
- `send_enabled`: Auto-send invoices via e-invoicing

#### 20. Received E-Invoices (`received_e_invoices`)
**Purpose:** Incoming e-invoices from suppliers

**Key Fields:**
- `state`: "new", "rejected", or "attached"
- `superpdp_invoice_id`: SuperPDP invoice ID
- `direction`: "in" or "out"
- `invoice_number`: Invoice reference
- `issue_date`: Invoice date
- `type_code`: Invoice type code (380=invoice, 381=credit note)
- `currency_code`: Currency
- `seller_name`, `seller_vat`, `seller_address`: Seller information
- `buyer_name`, `buyer_vat`: Buyer information
- `total_amount`: Amount excluding tax
- `total_tax_amount`: Tax amount
- `total_amount_with_tax`: Total including tax
- `status`: "received", "validated", or "error"
- `en_invoice`: Raw EN16931 invoice data
- `processed`: Processing flag
- `supplier_invoice_id`: Created supplier invoice ID
- `processing_error`: Processing error message

#### 21. Signing Sessions (`signing_sessions`)
**Purpose:** Document signature workflow management

**Key Fields:**
- `invoice_id`: Related invoice
- `external_id`: External signing service ID
- `invoice_snapshot`: Invoice snapshot at signing time
- `recipient_email`: Signer email
- `recipient_role`: "signer" or "viewer"
- `state`: Session state
- `upload_url`: Document upload URL
- `signing_url`: Signing interface URL
- `reason`: Signature reason/purpose
- `recipient_token`: Access token
- `expired`: Expiration flag

#### 22. E-Sign Sessions (`e_sign_sessions`)
**Purpose:** Electronic signature session details

**Key Fields:**
- `signing_session_id`: Parent signing session
- `document_id`: Document identifier
- `recipient_email`: Signer email
- `recipient_name`: Signer name
- `status`: "pending", "viewed", "signed", "expired", "cancelled"
- `document_pdf`: Original PDF (S3 key)
- `signature_image`: Signature image (Base64)
- `signed_document_pdf`: Final signed PDF
- `signature_date`: Signature timestamp
- `certificate_data`: Certificate metadata
- `token`: Unique access token
- `expires_at`: Expiration timestamp
- `verification_code`: Email verification code
- `is_verified`: Verification status

#### 23. Events (`events`)
**Purpose:** Audit trail and change history

**Key Fields:**
- `client_id`: Client identifier
- `created_at`: Event timestamp
- `created_by`: User who triggered event
- `req_id`: Request identifier
- `path`: Request path
- `doc_table`: Affected table
- `doc_action`: Action type ("create", "update", "delete")
- `doc_pk`: Document primary key
- `doc_before`: Document state before change
- `doc_after`: Document state after change

#### 24. Tasks (`tasks`)
**Purpose:** Background job queue

**Key Fields:**
- `type`: Task type
- `executed`: Execution flag
- `planned_at`: Scheduled execution time
- `id`: Task identifier
- `client_id`: Client context
- `created_at`: Creation timestamp
- `created_by`: User who created task
- `req_id`: Request identifier
- `path`: Request path
- `data`: Task payload

### Entity Relationships

```
Clients
  ├─ Users (via clients_users) [Many-to-Many]
  ├─ Contacts [One-to-Many]
  ├─ Articles [One-to-Many]
  ├─ Invoices [One-to-Many]
  ├─ Stock Items [One-to-Many]
  ├─ Stock Locations [One-to-Many]
  ├─ CRM Items [One-to-Many]
  ├─ Service Items [One-to-Many]
  ├─ Accounting Accounts [One-to-Many]
  ├─ Accounting Transactions [One-to-Many]
  └─ Tags [One-to-Many]

Contacts
  ├─ Parent Contacts [Many-to-Many Self-Reference]
  ├─ Invoices (as client/supplier) [One-to-Many]
  ├─ Stock Items [One-to-Many]
  ├─ CRM Items [Many-to-Many]
  ├─ Service Items [One-to-Many]
  └─ Accounting Accounts [One-to-One]

Articles
  ├─ Suppliers (Contacts) [Many-to-Many]
  ├─ Invoice Lines (via content) [One-to-Many]
  ├─ Stock Items [One-to-Many]
  └─ Service Items [One-to-Many]

Invoices
  ├─ Client/Supplier (Contact) [Many-to-One]
  ├─ Contact Person [Many-to-One]
  ├─ Articles (via content) [Many-to-Many]
  ├─ Related Invoices (from_rel_invoice) [Many-to-One]
  ├─ Related Quotes (from_rel_quote) [Many-to-One]
  ├─ Stock Items [One-to-Many]
  ├─ Service Items [One-to-Many]
  ├─ Accounting Transactions [Many-to-Many]
  ├─ Signing Sessions [One-to-Many]
  ├─ Files (attachments/documents) [Many-to-Many]
  ├─ Tags [Many-to-Many]
  └─ Comments/Events [One-to-Many]

Stock Items
  ├─ Article [Many-to-One]
  ├─ Client (Contact) [Many-to-One]
  ├─ Quote/Invoice [Many-to-One]
  ├─ Supplier Quote [Many-to-One]
  ├─ Location [Many-to-One]
  ├─ Original Stock Items [Many-to-Many Self-Reference]
  ├─ Assigned Users [Many-to-Many]
  ├─ Files [Many-to-Many]
  └─ Tags [Many-to-Many]

CRM Items
  ├─ Contacts [Many-to-Many]
  ├─ Seller (User) [Many-to-One]
  ├─ Assigned Users [Many-to-Many]
  └─ Tags [Many-to-Many]

Service Items
  ├─ Article [Many-to-One]
  ├─ Client (Contact) [Many-to-One]
  ├─ Quote/Invoice [Many-to-One]
  ├─ Original Service Item [Many-to-One Self-Reference]
  ├─ Service Times [One-to-Many]
  ├─ Assigned Users [Many-to-Many]
  ├─ Files [Many-to-Many]
  └─ Tags [Many-to-Many]
```

### Common Entity Patterns

All REST entities inherit from `RestEntity` which provides:

**Standard Fields:**
- `id`: Unique identifier (UUID)
- `client_id`: Multi-tenant isolation
- `created_at`: Creation timestamp
- `created_by`: Creator user ID
- `updated_at`: Last update timestamp
- `updated_by`: Last updater user ID
- `is_deleted`: Soft delete flag
- `revisions`: Revision counter
- `restored_from`: Restoration source version
- `comment_id`: Associated comment/event ID
- `fields`: Custom field values (JSONB)
- `display_name`: Generated display name
- `searchable`: Searchable text content
- `searchable_generated`: Generated full-text search index (tsvector)

**Auditing:**
- All entities are auditable via the `events` table
- Changes are tracked with before/after snapshots
- All modifications are associated with a request ID and user

**Search:**
- Multi-language full-text search (French, English, Simple)
- Weighted search priorities (A > B > C > D)
- Accent-insensitive search
- Entity-specific searchable field configuration

---

## Technical Architecture

### Backend Stack

**Runtime:**
- Node.js with TypeScript
- Babel for transpilation
- Gulp for build automation

**Database:**
- PostgreSQL with JSONB support
- Full-text search (tsvector)
- Generated columns for computed values
- Composite primary keys for multi-tenancy

**Key Libraries:**
- Lodash for utility functions
- Express for REST API (implied)
- PostgreSQL client for database access

**Platform Services:**
- AMQP for message queuing
- Redis for caching and session storage
- S3 for file storage
- Email service (SMTP, push notifications)
- SMS/text message service
- i18n for internationalization
- Socket.io for real-time communication
- Cron for scheduled tasks
- Analytics integration
- CAPTCHA protection
- Lock management for concurrency
- Triggers and event system

### Security Features

**Authentication:**
- Multi-factor authentication (MFA)
  - Email-based
  - Phone-based (SMS)
  - App-based (TOTP)
  - Password
- Role-based access control (RBAC)
- User roles: USER, DISABLED, SYSADMIN, SYSAGENT

**Authorization:**
- Granular permission system (68 role types)
- Resource-level permissions (READ, WRITE, MANAGE)
- Multi-tenant isolation via `client_id`

**Data Protection:**
- Field-level encryption (AES) for sensitive data
  - OAuth tokens
  - API secrets
  - Client credentials
- Soft delete with restoration capability
- Audit trail for all changes
- Request tracking via `req_id`

### Integration Capabilities

**E-Invoicing:**
- SuperPDP platform integration
- EN16931 standard compliance
- Peppol network support
- PPF (French public platform) support
- Automatic invoice reception
- Automatic invoice transmission

**Email:**
- Custom SMTP configuration per client
- Email template system (Twig)
- HTML and plain text formats
- Email tracking and delivery status
- Grouped notification emails

**File Storage:**
- S3-compatible object storage
- Thumbnail generation
- MIME type detection
- Orphaned file cleanup

**Export Formats:**
- PDF generation (React PDF)
- CSV export capability
- EN16931 XML format
- Localized content (French, English)

### API Structure

**REST API:**
- Resource-based URLs
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Label and search field generation
- Automatic display name generation
- Paginated responses (implied)

**Real-time:**
- Socket.io for live updates
- Push notifications

**Background Processing:**
- Task queue system
- Scheduled task execution
- Event-driven architecture

### Performance Optimizations

**Database:**
- Composite indexes for common queries
- GIN indexes for full-text search
- GIST indexes for date ranges
- Generated columns for computed values
- JSONB for flexible schema extensions

**Caching:**
- Cache fields on entities (e.g., `cache.article_name`)
- Pre-computed totals on invoices
- Redis caching layer
- Full-text search index generation

**Search:**
- Weighted full-text search
- Accent-insensitive matching
- Multi-language tokenization
- Relevance ranking (A > B > C > D weights)

---

## Configuration

### Environment Variables

The application uses a hierarchical configuration system via node-config:

**Configuration Files:**
- `config/default.json` - Default settings
- `config/development.json` - Development environment
- `config/production.json` - Production environment
- `config/test.json` - Test environment
- `config/tests.json` - Test suite settings
- `config/custom-environment-variables.json` - Environment variable mapping

**Localization:**
- French (fr.json)
- English (en.json)

### Docker Support

**Containers:**
- Backend service (Node.js)
- Frontend service (React + Vite)
- Database (PostgreSQL)
- Redis cache
- Message queue (AMQP)

**Compose Files:**
- `docker-compose.yml` - Development
- `docker-compose.prod.yml` - Production
- `docker-compose.tests.yml` - Testing

---

*Last Updated: May 6, 2026*
*Documentation Version: 2.0 (UI + Data Model Analysis)*
