# ტექნიკური დავალება - Auto Dealer Platform

## 📋 სარჩევი

1. [პროექტის მიმოხილვა](#1-პროექტის-მიმოხილვა)
2. [მომხმარებლების ტიპები](#2-მომხმარებლების-ტიპები)
3. [ფუნქციონალური მოთხოვნები](#3-ფუნქციონალური-მოთხოვნები)
4. [მონაცემთა მოდელები](#4-მონაცემთა-მოდელები)
5. [გვერდების სტრუქტურა](#5-გვერდების-სტრუქტურა)
6. [კალკულატორის მოდული](#6-კალკულატორის-მოდული)
7. [ტექნიკური სტეკი](#7-ტექნიკური-სტეკი)
8. [არაფუნქციონალური მოთხოვნები](#8-არაფუნქციონალური-მოთხოვნები)

---

## 1. პროექტის მიმოხილვა

### 1.1 აღწერა

პლატფორმა განკუთვნილია კომპანიისთვის, რომელიც მართავს მანქანების ტრანსპორტირებას ამერიკისა და კანადის აუქციონებიდან საქართველომდე. სისტემა უზრუნველყოფს დილერების მანქანების თვალყურის დევნებას, ფინანსურ აღრიცხვას და კალკულატორის ფუნქციონალს.

### 1.2 ძირითადი მახასიათებლები

| პარამეტრი       | მნიშვნელობა                |
| --------------- | -------------------------- |
| პლატფორმის ტიპი | Responsive Web Application |
| ენები           | ქართული, ინგლისური         |
| ვალუტა          | USD                        |
| მომხმარებლები   | 200+ დილერი, 1 ადმინი      |

### 1.3 ქვეყნები და ლოკაციები

- **წყარო ქვეყნები:** USA, Canada
- **დანიშნულების პორტები:** ფოთი, ბათუმი (საქართველო)

---

## 2. მომხმარებლების ტიპები

### 2.1 ადმინისტრატორი (Super Admin)

- სისტემაში **1 ადმინი**
- სრული წვდომა ყველა ფუნქციონალზე
- დილერების, მანქანების, ფინანსების მართვა

### 2.2 დილერი

- ადმინის მიერ დამატებული მომხმარებელი
- ხედავს **მხოლოდ საკუთარ** მანქანებს და ფინანსებს
- **ვერ** ხედავს სხვა დილერების მონაცემებს
- **ვერ** ხედავს საკუთარ ფასდაკლებას

### 2.3 დილერის პროფილის მონაცემები

| ველი                   | ტიპი           | სავალდებულო |
| ---------------------- | -------------- | ----------- |
| სახელი                 | String         | ✅          |
| ელ-ფოსტა               | Email          | ✅          |
| ტელეფონი               | String         | ✅          |
| მისამართი              | String         | ✅          |
| კომპანიის სახელი       | String         | ❌          |
| საიდენტიფიკაციო ნომერი | String         | ❌          |
| ფასდაკლება (დამალული)  | Number         | ❌          |
| სტატუსი                | Active/Blocked | ✅          |

---

## 3. ფუნქციონალური მოთხოვნები

### 3.1 ადმინისტრატორის პანელი

#### 3.1.1 დილერების მართვა

- ✅ დილერის დამატება
- ✅ დილერის რედაქტირება
- ✅ დილერის დეაქტივაცია/ბლოკირება
- ✅ ფასდაკლების მითითება (დამალული დილერისგან)
- ✅ დილერების სიის ნახვა და ძიება
- ✅ დილერის ბალანსის პირდაპირი რედაქტირება

#### 3.1.2 მანქანების მართვა

- ✅ მანქანის დამატება
- ✅ დილერის მითითება
- ✅ სტატუსის ცვლილება
- ✅ ლოკაციის მითითება (ქვეყანა → შტატი → ქალაქი → პორტი)
- ✅ ფოტოების ატვირთვა ეტაპებით
- ✅ კომენტარების დამატება
- ✅ გემის/კონტეინერის ინფორმაცია
- ✅ ETA (სავარაუდო ჩამოსვლის თარიღი)
- ✅ მანქანის არქივირება (Soft Delete)
- ✅ ძიება და ფილტრაცია

#### 3.1.3 ფინანსების მართვა

- ✅ ბალანსის შევსების მოთხოვნების ნახვა
- ✅ მოთხოვნის დადასტურება/უარყოფა
- ✅ ინვოისის შექმნა (ხელით)
- ✅ ინვოისის PDF გენერაცია
- ✅ ბალანსის პირდაპირი რედაქტირება

#### 3.1.4 პორტების Dashboard

- ✅ პორტების ნახვა ქვეყანა → შტატი → პორტი იერარქიით
- ✅ თითოეულ პორტზე სტატისტიკა:
  - გზაში პორტისკენ (ევაკუატორით)
  - პორტში
  - ჩატვირთული
  - წამოსული (გზაში საქართველოსკენ)
- ✅ პორტზე დაჭერით → იქ მყოფი მანქანების სია

#### 3.1.5 კალკულატორის კონფიგურაცია

- ✅ შიდა გადაზიდვის ფასები (ქალაქი → პორტი)
- ✅ ზღვის ფრახტის ფასები (US/CA პორტი → GE პორტი)
- ✅ დაზღვევის ფასები (ფასის დიაპაზონებით)
- ✅ ბაზისური ტრანსპორტირების ფასი

#### 3.1.6 რეპორტები და სტატისტიკა

- ✅ Dashboard სტატისტიკით
- ✅ დილერების ბალანსების რეპორტი
- ✅ მანქანების სტატუსების რეპორტი
- ✅ Excel/PDF ექსპორტი

#### 3.1.7 სისტემის პარამეტრები

- ✅ ლოკაციების მართვა (წინასწარ განსაზღვრული)
- ✅ მარკების/მოდელების სია
- ✅ აუქციონების სია
- ✅ სტატუსების სია

#### 3.1.8 აუდიტ ლოგი

- ✅ ყველა მოქმედების ლოგირება (ვინ, რა, როდის)

---

### 3.2 დილერის პანელი

#### 3.2.1 Dashboard

- ✅ სტატისტიკა (მანქანების რაოდენობა სტატუსებით)
- ✅ მიმდინარე ბალანსი
- ✅ ბოლო შეტყობინებები

#### 3.2.2 მანქანების ნახვა

- ✅ საკუთარი მანქანების სია (ცხრილით)
- ✅ ძიება და ფილტრაცია (VIN, მარკა, სტატუსი, თარიღი)
- ✅ მანქანის დეტალური გვერდი:
  - ძირითადი მონაცემები
  - ფოტოები (Fullscreen Gallery, ეტაპებით)
  - სტატუსის Timeline
  - ფინანსური ინფორმაცია
  - დოკუმენტები (თუ ატვირთულია)

#### 3.2.3 ბალანსი და ფინანსები

- ✅ მიმდინარე ბალანსის ნახვა
- ✅ ბალანსის შევსების მოთხოვნა:
  - თანხის შეყვანა
  - ქვითრის ფოტოს ატვირთვა
  - კომენტარის დამატება
- ✅ ტრანზაქციების ისტორია (შევსებები, ჩამოჭრები)
- ✅ ინვოისების ისტორია (წარსული, მიმდინარე)
- ✅ ინვოისის PDF ჩამოტვირთვა

#### 3.2.4 შეტყობინებები

- ✅ აპში შეტყობინებები (In-App Notifications)
- ✅ სტატუსის ცვლილებების შეტყობინებები

#### 3.2.5 პროფილი

- ✅ პროფილის ნახვა/რედაქტირება
- ✅ პაროლის შეცვლა

---

## 4. მონაცემთა მოდელები

### 4.1 User (მომხმარებელი)

```
User {
  id: UUID
  email: String (unique)
  password: String (hashed)
  role: Enum (ADMIN, DEALER)

  // დილერის მონაცემები
  name: String
  phone: String
  address: String
  companyName: String?
  identificationNumber: String?

  // ფინანსური
  balance: Decimal (default: 0, can be negative)
  discount: Decimal (default: 0) // დამალული დილერისგან

  // სტატუსი
  status: Enum (ACTIVE, BLOCKED)

  // მეტა
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 4.2 Vehicle (მანქანა)

```
Vehicle {
  id: UUID

  // ძირითადი მონაცემები
  vin: String (unique)
  makeId: UUID (FK → Make)
  modelId: UUID (FK → Model)
  year: Integer

  // აუქციონის მონაცემები
  auctionId: UUID (FK → Auction)
  lotNumber: String
  auctionLink: String?

  // ტექნიკური
  damageType: Enum (CLEAN, SALVAGE, REBUILT, ...)
  hasKeys: Boolean

  // ლოკაცია
  countryId: UUID (FK → Country)
  stateId: UUID (FK → State)
  cityId: UUID (FK → City)
  portId: UUID (FK → Port)

  // ტრანსპორტირება
  shipName: String?
  containerNumber: String?
  eta: Date?

  // ფასი
  transportationPrice: Decimal // საბოლოო (ბაზისური - ფასდაკლება)

  // კავშირები
  dealerId: UUID (FK → User)
  statusId: UUID (FK → Status)

  // მეტა
  isArchived: Boolean (default: false)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 4.3 VehiclePhoto (მანქანის ფოტო)

```
VehiclePhoto {
  id: UUID
  vehicleId: UUID (FK → Vehicle)
  url: String
  stage: Enum (AUCTION, PORT, ARRIVAL) // ეტაპი
  order: Integer
  createdAt: DateTime
}
```

### 4.4 VehicleStatusHistory (სტატუსის ისტორია)

```
VehicleStatusHistory {
  id: UUID
  vehicleId: UUID (FK → Vehicle)
  statusId: UUID (FK → Status)
  changedAt: DateTime
  changedBy: UUID (FK → User)
}
```

### 4.5 VehicleComment (კომენტარი)

```
VehicleComment {
  id: UUID
  vehicleId: UUID (FK → Vehicle)
  userId: UUID (FK → User)
  content: String
  createdAt: DateTime
}
```

### 4.6 Status (სტატუსი)

```
Status {
  id: UUID
  name_ka: String
  name_en: String
  order: Integer
  color: String?
}
```

**წინასწარ განსაზღვრული სტატუსები:**

1. დამატებული (default)
2. აუქციონზე
3. გზაში პორტისკენ
4. პორტში
5. ჩატვირთული
6. გზაში საქართველოსკენ
7. ფოთის პორტში / ბათუმის პორტში
8. დასრულებული

### 4.7 Country (ქვეყანა)

```
Country {
  id: UUID
  name_ka: String
  name_en: String
  code: String (US, CA, GE)
}
```

### 4.8 State (შტატი/პროვინცია)

```
State {
  id: UUID
  countryId: UUID (FK → Country)
  name_ka: String
  name_en: String
  code: String
}
```

### 4.9 City (ქალაქი)

```
City {
  id: UUID
  stateId: UUID (FK → State)
  name: String
}
```

### 4.10 Port (პორტი)

```
Port {
  id: UUID
  stateId: UUID (FK → State)
  name: String
  isDestination: Boolean // true = საქართველოს პორტი
}
```

### 4.11 Make & Model (მარკა და მოდელი)

```
Make {
  id: UUID
  name: String
}

Model {
  id: UUID
  makeId: UUID (FK → Make)
  name: String
}
```

### 4.12 Auction (აუქციონი)

```
Auction {
  id: UUID
  name: String (Copart, IAAI, Manheim, ...)
}
```

### 4.13 Invoice (ინვოისი)

```
Invoice {
  id: UUID
  dealerId: UUID (FK → User)
  invoiceNumber: String (unique)

  totalAmount: Decimal
  status: Enum (PENDING, PAID, CANCELLED)

  paidAt: DateTime?
  paidFromBalance: Boolean

  createdAt: DateTime
  createdBy: UUID (FK → User)
}
```

### 4.14 InvoiceItem (ინვოისის პუნქტი)

```
InvoiceItem {
  id: UUID
  invoiceId: UUID (FK → Invoice)
  vehicleId: UUID (FK → Vehicle)
  amount: Decimal
  description: String?
}
```

### 4.15 BalanceRequest (ბალანსის შევსების მოთხოვნა)

```
BalanceRequest {
  id: UUID
  dealerId: UUID (FK → User)
  amount: Decimal
  receiptUrl: String // ქვითრის ფოტო
  comment: String?

  status: Enum (PENDING, APPROVED, REJECTED)

  processedAt: DateTime?
  processedBy: UUID? (FK → User)
  adminComment: String?

  createdAt: DateTime
}
```

### 4.16 Transaction (ტრანზაქცია)

```
Transaction {
  id: UUID
  dealerId: UUID (FK → User)

  type: Enum (DEPOSIT, WITHDRAWAL, INVOICE_PAYMENT, ADJUSTMENT)
  amount: Decimal // + ან -
  balanceAfter: Decimal

  referenceType: String? // 'invoice', 'balance_request', 'manual'
  referenceId: UUID?

  description: String?
  createdAt: DateTime
  createdBy: UUID (FK → User)
}
```

### 4.17 Notification (შეტყობინება)

```
Notification {
  id: UUID
  userId: UUID (FK → User)

  title_ka: String
  title_en: String
  message_ka: String
  message_en: String

  type: Enum (STATUS_CHANGE, BALANCE, INVOICE, SYSTEM)

  isRead: Boolean (default: false)

  referenceType: String?
  referenceId: UUID?

  createdAt: DateTime
}
```

### 4.18 AuditLog (აუდიტ ლოგი)

```
AuditLog {
  id: UUID
  userId: UUID (FK → User)

  action: String
  entityType: String
  entityId: UUID

  oldData: JSON?
  newData: JSON?

  ipAddress: String?
  userAgent: String?

  createdAt: DateTime
}
```

### 4.19 კალკულატორის მოდელები

```
TowingPrice (შიდა გადაზიდვის ფასი) {
  id: UUID
  cityId: UUID (FK → City)
  portId: UUID (FK → Port)
  price: Decimal
}

ShippingPrice (ზღვის ფრახტის ფასი) {
  id: UUID
  originPortId: UUID (FK → Port) // US/CA პორტი
  destinationPortId: UUID (FK → Port) // GE პორტი (ფოთი/ბათუმი)
  price: Decimal
}

InsurancePrice (დაზღვევის ფასი) {
  id: UUID
  minValue: Decimal
  maxValue: Decimal
  price: Decimal
}

SystemSettings (სისტემის პარამეტრები) {
  id: UUID
  key: String (unique)
  value: String
}
// მაგ: BASE_TRANSPORTATION_PRICE = 1200
```

---

## 5. გვერდების სტრუქტურა

### 5.1 საერთო გვერდები

- `/login` - ავტორიზაცია
- `/forgot-password` - პაროლის აღდგენა
- `/reset-password` - პაროლის შეცვლა

### 5.2 ადმინის გვერდები

```
/admin
├── /dashboard                    # მთავარი Dashboard
├── /dealers                      # დილერების სია
│   ├── /new                      # დილერის დამატება
│   └── /[id]                     # დილერის რედაქტირება
├── /vehicles                     # მანქანების სია
│   ├── /new                      # მანქანის დამატება
│   └── /[id]                     # მანქანის რედაქტირება
├── /ports                        # პორტების Dashboard
│   └── /[portId]/vehicles        # პორტის მანქანები
├── /finance
│   ├── /balance-requests         # ბალანსის მოთხოვნები
│   ├── /invoices                 # ინვოისები
│   │   ├── /new                  # ინვოისის შექმნა
│   │   └── /[id]                 # ინვოისის ნახვა
│   └── /transactions             # ტრანზაქციები
├── /calculator                   # კალკულატორის კონფიგურაცია
│   ├── /towing                   # შიდა გადაზიდვის ფასები
│   ├── /shipping                 # ზღვის ფრახტის ფასები
│   └── /insurance                # დაზღვევის ფასები
├── /settings
│   ├── /locations                # ქვეყნები, შტატები, ქალაქები, პორტები
│   ├── /makes-models             # მარკები და მოდელები
│   ├── /auctions                 # აუქციონები
│   └── /statuses                 # სტატუსები
├── /audit-log                    # აუდიტ ლოგი
└── /reports                      # რეპორტები
```

### 5.3 დილერის გვერდები

```
/dealer
├── /dashboard                    # მთავარი Dashboard
├── /vehicles                     # მანქანების სია
│   └── /[id]                     # მანქანის დეტალები
├── /balance                      # ბალანსი
│   ├── /deposit                  # შევსების მოთხოვნა
│   └── /history                  # ტრანზაქციების ისტორია
├── /invoices                     # ინვოისები
│   └── /[id]                     # ინვოისის ნახვა/ჩამოტვირთვა
├── /notifications                # შეტყობინებები
└── /profile                      # პროფილი
    └── /change-password          # პაროლის შეცვლა
```

---

## 6. კალკულატორის მოდული

### 6.1 აღწერა

კალკულატორი არის **გარე მოდული** რომელიც განთავსდება სხვა დომენზე (Landing Page). ადმინის პანელიდან ხდება ფასების კონფიგურაცია, ხოლო API-თ მონაცემები გადაეცემა გარე საიტს.

### 6.2 კალკულატორის ლოგიკა

```
მთლიანი ფასი = შიდა გადაზიდვა + ზღვის ფრახტი + დაზღვევა (optional)
```

### 6.3 კალკულატორის ფორმა (გარე საიტზე)

| ველი               | ტიპი     | აღწერა                  |
| ------------------ | -------- | ----------------------- |
| ქვეყანა            | Dropdown | USA / Canada            |
| შტატი              | Dropdown | დამოკიდებული ქვეყანაზე  |
| ქალაქი             | Dropdown | დამოკიდებული შტატზე     |
| გამგზავრების პორტი | Dropdown | US/CA პორტი             |
| ჩამოსვლის პორტი    | Dropdown | ფოთი / ბათუმი           |
| მანქანის ფასი      | Input    | დაზღვევის გამოსათვლელად |
| დაზღვევა           | Checkbox | Optional                |

### 6.4 API Endpoints (კალკულატორისთვის)

```
GET /api/calculator/countries
GET /api/calculator/states?countryId=XXX
GET /api/calculator/cities?stateId=XXX
GET /api/calculator/ports?stateId=XXX
GET /api/calculator/destination-ports

POST /api/calculator/calculate
Body: {
  cityId: UUID,
  originPortId: UUID,
  destinationPortId: UUID,
  vehiclePrice: Number,
  includeInsurance: Boolean
}

Response: {
  towingPrice: Number,
  shippingPrice: Number,
  insurancePrice: Number | null,
  totalPrice: Number
}
```

---

## 7. ტექნიკური სტეკი

### 7.1 Frontend

| ტექნოლოგია      | მიზანი                   |
| --------------- | ------------------------ |
| Next.js 14+     | Framework (App Router)   |
| TypeScript      | Type Safety              |
| Tailwind CSS    | სტილიზაცია               |
| shadcn/ui       | UI კომპონენტები          |
| React Query     | Data Fetching            |
| Zustand         | State Management         |
| React Hook Form | ფორმები                  |
| Zod             | ვალიდაცია                |
| next-intl       | მრავალენოვანი მხარდაჭერა |

### 7.2 Backend

| ტექნოლოგია         | მიზანი           |
| ------------------ | ---------------- |
| Next.js API Routes | API              |
| Prisma             | ORM              |
| PostgreSQL         | Database         |
| NextAuth.js        | ავტორიზაცია      |
| Cloudflare R2      | ფაილების შენახვა |

### 7.3 Infrastructure

| სერვისი       | მიზანი                  |
| ------------- | ----------------------- |
| Railway       | Hosting (App + DB)      |
| Cloudflare R2 | File Storage            |
| Resend        | Email (პაროლის აღდგენა) |

### 7.4 Development Tools

| ინსტრუმენტი | მიზანი          |
| ----------- | --------------- |
| ESLint      | Code Linting    |
| Prettier    | Code Formatting |
| Husky       | Git Hooks       |

---

## 8. არაფუნქციონალური მოთხოვნები

### 8.1 უსაფრთხოება

- ✅ პაროლების ჰეშირება (bcrypt)
- ✅ JWT ტოკენები (უვადო session)
- ✅ CSRF Protection
- ✅ Rate Limiting
- ✅ Input Validation (Zod)
- ✅ SQL Injection Protection (Prisma)

### 8.2 Performance

- ✅ გვერდის ჩატვირთვა < 3 წამი
- ✅ ფოტოების ოპტიმიზაცია (WebP, lazy loading)
- ✅ Database ინდექსები

### 8.3 UX/UI

- ✅ Responsive Design (Mobile-first)
- ✅ მინიმალისტური/მოდერნული დიზაინი
- ✅ Loading States
- ✅ Error Handling
- ✅ მრავალენოვანი (KA/EN)

### 8.4 მონაცემთა შენახვა

- ✅ Soft Delete (არქივირება)
- ✅ აუდიტ ლოგი
- ✅ სტატუსის ისტორია
- ✅ ტრანზაქციების ისტორია

---

## 9. Seed Data (საწყისი მონაცემები)

### 9.1 ქვეყნები

- USA, Canada, Georgia

### 9.2 შტატები/პროვინციები

- USA: California, Texas, Georgia, Florida, New Jersey, ... (ყველა შტატი)
- Canada: British Columbia, Ontario, Quebec, ... (ყველა პროვინცია)

### 9.3 პორტები (USA)

- Los Angeles, Long Beach, Houston, Savannah, Newark, ...

### 9.4 პორტები (საქართველო)

- ფოთი, ბათუმი

### 9.5 აუქციონები

- Copart, IAAI, Manheim

### 9.6 სტატუსები

1. დამატებული
2. აუქციონზე
3. გზაში პორტისკენ
4. პორტში (USA/CA)
5. ჩატვირთული
6. გზაში საქართველოსკენmd
7. ფოთის პორტში
8. ბათუმის პორტში
9. დასრულებული

### 9.7 პოპულარული მარკები

- Toyota, Honda, BMW, Mercedes-Benz, Ford, Chevrolet, Lexus, Audi, Nissan, Hyundai, Kia, Volkswagen, ...

---

## 10. დამატებითი შენიშვნები

### 10.1 ფასდაკლების ლოგიკა

```
საბოლოო_ფასი = ბაზისური_ფასი - დილერის_ფასდაკლება

მაგალითი:
- ბაზისური ფასი: $1,200
- დილერის ფასდაკლება: $200
- საბოლოო ფასი: $1,000

დილერი ხედავს მხოლოდ $1,000-ს
```

### 10.2 ინვოისის ლოგიკა

```
1. ადმინი ქმნის ინვოისს (ირჩევს მანქანებს)
2. ინვოისის სტატუსი: PENDING
3. გადახდისას ბალანსიდან ჩამოიჭრება თანხა
4. სტატუსი იცვლება: PAID
5. იქმნება Transaction ჩანაწერი
```

### 10.3 ბალანსის შევსების ლოგიკა

```
1. დილერი ქმნის მოთხოვნას (თანხა + ქვითრის ფოტო + კომენტარი)
2. ადმინს ეჩვენება შეტყობინება
3. ადმინი ამოწმებს და ადასტურებს/უარყოფს
4. დადასტურებისას: ბალანსი იზრდება, იქმნება Transaction
```

---

## 11. სამომავლო განვითარება (Out of Scope)

შემდეგი ფუნქციონალი **არ შედის** პირველ ვერსიაში:

- ❌ მობილური აპლიკაცია
- ❌ Push Notifications
- ❌ SMS შეტყობინებები
- ❌ ონლაინ გადახდა
- ❌ ჩატი
- ❌ Bulk Operations
- ❌ Excel Import
- ❌ მრავალი ადმინი
- ❌ დოკუმენტების ატვირთვა (Title, BoL)
- ❌ Dark Mode

---

**დოკუმენტის ვერსია:** 1.0
**შექმნის თარიღი:** 2026-01-15
**ავტორი:** Claude AI
