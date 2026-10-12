# Ashlyn Prashad Backend (Vuku Reading & Learning API)

<p align="center">
  <img src="assets/banner.svg" alt="Ashlyn Prashad Backend Banner" width="100%">
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js" alt="Node.js"></a>
  <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-4.21-black?style=for-the-badge&logo=express" alt="Express"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-6.13-2D3748?style=for-the-badge&logo=prisma" alt="Prisma"></a>
  <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB"></a>
  <a href="https://stripe.com"><img src="https://img.shields.io/badge/Stripe-v18-008CDD?style=for-the-badge&logo=stripe" alt="Stripe"></a>
  <a href="https://firebase.google.com"><img src="https://img.shields.io/badge/Firebase-Admin%20FCM-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="License"></a>
</p>

---

## 📖 Overview

**Ashlyn Prashad Backend (Vuku API)** is a robust microservices-ready RESTful backend built with Express.js, TypeScript, and Prisma ORM with MongoDB. Designed for scalable e-learning and interactive reading platforms, the API manages reading progress tracking, interactive quizzes, automated certification scoring, recurring Stripe subscriptions, Twilio SMS verifications, Firebase Cloud Messaging (FCM) notifications, and DigitalOcean Spaces asset management.

---

## ⚡ Key Features

- **🔐 Robust Identity & Access Management:** Full JWT authentication lifecycle, bcrypt password hashing, Twilio SMS OTP verification, and role-based access control (`Admin`, `User`).
- **📖 Reading Activity & Habit Tracker:** Persistent session tracking storing reading duration, page progress, book bookmarking, and goal completions.
- **🧠 Interactive Quiz Engine:** Multi-question quiz modules connected to book chapters, scoring algorithms, and user answer submission evaluations.
- **💳 Stripe Subscription Lifecycle:** End-to-end payment workflows supporting recurring monthly/annual billing intervals, webhook event listeners, and automated entitlement updates.
- **🔔 Real-Time Notification Pipeline:** Multi-channel alerting featuring Firebase Admin FCM push notifications, browser Web-Push APIs, and Nodemailer transactional emails.
- **☁️ Cloud Asset Storage:** Integrated DigitalOcean Spaces / AWS S3 file upload handling with Multer and AWS SDK v3.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Client[Web & Mobile Clients] -->|HTTPS / REST| Express[Express.js App Router]
    
    subgraph Middlewares ["Middleware Pipeline"]
        Express --> Auth[JWT & Role Verification]
        Auth --> Validation[Zod Request Validation]
        Validation --> Upload[Multer & DO Spaces]
    end

    subgraph Core_Services ["Application Core"]
        Upload --> UserSvc[User & Auth Service]
        Upload --> ReadSvc[Reading & Book Service]
        Upload --> QuizSvc[Quiz & Exam Engine]
        Upload --> StripeSvc[Stripe Subscription Engine]
    end

    subgraph Data_Layer ["Persistence & External Services"]
        UserSvc & ReadSvc & QuizSvc & StripeSvc --> Prisma[Prisma ORM Client]
        Prisma --> Mongo[(MongoDB Database)]
        StripeSvc --> StripeAPI[Stripe Payments]
        UserSvc --> TwilioAPI[Twilio SMS Gateway]
        UserSvc --> FCM[Firebase Cloud Messaging]
    end
```

---

## 🗂️ Project Structure

```
ashlyprashad_backend/
├── assets/
│   └── banner.svg             # Repository banner
├── prisma/
│   └── schema.prisma          # Prisma schema with MongoDB mapping
├── src/
│   ├── app/
│   │   ├── modules/           # Auth, User, Reading, Quiz, Plan, Payment
│   │   ├── middlewares/       # Auth guards, global error handler
│   │   └── routes/            # Central API route aggregators
│   ├── config/                # Environment variables, Stripe, OpenAI
│   ├── helpers/               # FCM push, Spaces uploader, JWT, Email
│   ├── shared/                # Prisma client, pagination, SMS helpers
│   ├── app.ts                 # Express application definition
│   └── server.ts              # Server bootstrapper & listener
├── package.json
└── tsconfig.json
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js 20 & Express 4** | Server runtime and high-speed web framework |
| **TypeScript 5.5** | Strongly typed code base and interfaces |
| **Prisma ORM 6.13** | Database object modeling and MongoDB connector |
| **MongoDB** | Document store for users, books, quizzes, and subscriptions |
| **Stripe SDK 18** | Subscription payments and webhook processing |
| **Firebase Admin SDK** | Server-side FCM push notification broadcasts |
| **Twilio SDK** | SMS OTP dispatch and mobile identity verification |
| **AWS SDK v3 / Spaces** | Cloud object storage for book assets and covers |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- MongoDB instance (Atlas or local replica set)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shahjalal-labs/ashlyprashad_backend.git
   cd ashlyprashad_backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Provide your MongoDB URI, JWT secrets, and service API keys.

4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

5. Run in development mode:
   ```bash
   npm run dev
   ```

6. Build and launch for production:
   ```bash
   npm run build
   npm start
   ```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
