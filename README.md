# 🎂 Birthday Reminder Application (Midnight Eve Notification Service)

A full-stack, enterprise-grade birthday reminder platform that alerts users via email at **23:50 (11:50 PM) the evening before** a loved one's birthday. This gives users a 10-minute window to prepare their messages and wish their friends or family right at the stroke of midnight (00:00).

Built for **100% free hosting and deployment** for educational purposes.

---

## 🌟 Tech Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Backend** | **Java 21 LTS + Spring Boot 3.3.4** | RESTful APIs, Spring Data JPA, Spring Mail (SMTP), Spring Task Scheduling (`@Scheduled`) |
| **Security** | **Spring Security 6 + JJWT** | Stateless token-based auth, Role-Based Access Control (`ROLE_USER`, `ROLE_ADMIN`), BCrypt hashing |
| **Frontend** | **React.js (Vite) + Tailwind CSS** | Clean SaaS UI, Lucide icons, Axios with JWT interceptors, responsive dashboards |
| **Database** | **PostgreSQL / Neon.tech** | Production relational storage with automated fallback to H2 for instant local development |
| **Mailing** | **JavaMailSender (SMTP TLS)** | Formatted HTML email templates with personalized birthday details, notes, and turning ages |

---

## 🚀 Key Features

### 1. The "Midnight Eve" 23:50 Notification Engine
- Daily cron trigger: `0 50 23 * * ?` (23:50:00 every night).
- Computes tomorrow's calendar date and fetches all active birthday records matching month & day.
- Asynchronously sends a rich HTML email reminder to the user's registered inbox.
- Complete delivery audit logging in the `notification_logs` table (status: `SUCCESS`, `FAILED`, or `SIMULATED`).

### 2. User Portal (`ROLE_USER`)
- **Interactive Calendar & Cards**: View birthdays categorized by relationship (Friend, Family, Colleague, Other).
- **Upcoming Birthday Banner**: Highlights birthdays occurring tomorrow with an active 23:50 reminder countdown.
- **Milestones**: Automatic calculation of turning age and days remaining until the birthday.
- **Instant Test Reminder Button**: Dispatches an immediate sample reminder email to verify SMTP delivery.
- **Add / Edit Modal**: Set contact details, gift notes, and toggle reminders.

### 3. Admin Maintenance Portal (`ROLE_ADMIN`)
- **User Governance**: View all registered accounts, registration dates, role badges, and total tracked birthdays.
- **Account Status Toggle**: Activate or deactivate user accounts with 1 click.
- **Audit & Delivery Logs**: Full trace of all sent notifications, delivery timestamps, and error diagnostics.
- **System Configuration**: Inspect and update reminder cron expressions, sender names, and email subject templates.
- **"Trigger 23:50 Scheduler Now"**: Manually triggers tonight's reminder batch execution for instant testing without waiting for 23:50!

---

## 🔑 Pre-Configured Demo Accounts

On initial boot, the application automatically seeds the database with demo accounts:

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **User** | `user@birthday.com` | `User@123` | Seeded with 2 birthdays (including Sophia Miller's birthday tomorrow for immediate testing) |
| **Admin** | `admin@birthday.com` | `Admin@123` | Full access to User Management, Delivery Logs, and System Scheduler |

---

## 💻 Local Quickstart

### Prerequisites
- Java 21 LTS
- Maven 3.9+
- Node.js 18+ and npm

### 1. Start Backend (Terminal 1)
```powershell
cd backend
mvn clean package -DskipTests
java -jar target/birthday-notifier-backend-1.0.0.jar
```
*The backend starts at `http://localhost:8080`. By default, it uses the embedded in-memory database with automatic schema creation.*

### 2. Start Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
*The frontend starts at `http://localhost:5173` with automatic API proxying to `http://localhost:8080`.*

---

## ☁️ 100% Free Cloud Deployment Blueprint

You can host this entire stack in the cloud completely free of cost with zero monthly bills:

```
+-----------------------------------------------------------------+
|                     100% FREE CLOUD ARCHITECTURE                |
|                                                                 |
|   Frontend (Vercel)  --->  Backend (Render)  --->  Database     |
|   React SPA / Vite         Spring Boot 3.x         (Neon.tech)  |
|                                |                   Postgres 16  |
|                                v                                |
|                        Gmail / Brevo SMTP                       |
+-----------------------------------------------------------------+
```

### Step 1: Provision Free PostgreSQL Database (Neon.tech)
1. Sign up for a free account at [https://neon.tech](https://neon.tech).
2. Create a project named `birthday-db`.
3. Copy the standard connection details provided in your dashboard:
   - Host, Database, User, Password, and JDBC URL:
     `jdbc:postgresql://<neon-host>/birthday-db?sslmode=require`

### Step 2: Configure Free SMTP Credentials (Gmail)
1. Log into your Google Account and navigate to **Security** (`https://myaccount.google.com/security`).
2. Ensure **2-Step Verification** is enabled.
3. Search for **App passwords** (or go to `https://myaccount.google.com/apppasswords`).
4. Generate a new app password named `BirthdayNotifier`.
5. Google will provide a **16-character password** (e.g., `abcd efgh ijkl mnop`). Save this password.

### Step 3: Deploy Backend to Render.com (Free Web Service)
1. Push your repository to GitHub.
2. Sign up at [https://render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following build settings:
   - **Root Directory**: `backend`
   - **Environment**: `Docker` (Render will automatically detect `backend/Dockerfile`)
   - **Plan Type**: `Free`
5. Under **Environment Variables**, add:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/birthday-db?sslmode=require
   SPRING_DATASOURCE_USERNAME=<neon-user>
   SPRING_DATASOURCE_PASSWORD=<neon-password>
   SPRING_DATASOURCE_DRIVER=org.postgresql.Driver
   HIBERNATE_DIALECT=org.hibernate.dialect.PostgreSQLDialect
   SPRING_MAIL_HOST=smtp.gmail.com
   SPRING_MAIL_PORT=587
   SPRING_MAIL_USERNAME=your-email@gmail.com
   SPRING_MAIL_PASSWORD=your-16-char-app-password
   APP_REMINDER_CRON=0 50 23 * * ?
   JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   ```
6. Click **Create Web Service**. Render will deploy your backend at `https://<your-app>.onrender.com`.

### Step 4: Deploy Frontend to Vercel (Free Edge CDN)
1. Sign up at [https://vercel.com](https://vercel.com) and click **Add New** -> **Project**.
2. Select your GitHub repository.
3. Set the following project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
4. Under **Environment Variables**, add:
   ```env
   VITE_API_BASE_URL=https://<your-app>.onrender.com
   ```
5. Click **Deploy**. Vercel will build and deploy your app at `https://<your-app>.vercel.app`.

---

## 🧪 Verification & Automated Testing

You can run the end-to-end integration verification script at any time:
```powershell
powershell -ExecutionPolicy Bypass -File test_server.ps1
```
This script validates:
- Health check ping (`/api/health`)
- Admin and User authentication & JWT generation
- Birthday listing and countdown calculations
- Instant test email reminder dispatch
- Manual triggering of the 23:50 scheduler job
- Admin system statistics and notification audit logs

---

## 📁 Repository Structure

```
Birthday_Notifier/
├── backend/
│   ├── src/main/java/com/birthdaynotifier/
│   │   ├── config/             # DB seeder & configuration
│   │   ├── controller/         # Auth, Birthday, Admin, Health controllers
│   │   ├── dto/                # Request & response data transfer objects
│   │   ├── entity/             # User, Role, Birthday, NotificationLog, AppConfig
│   │   ├── repository/         # Spring Data JPA repositories
│   │   ├── scheduler/          # 23:50 Midnight Eve scheduled reminder worker
│   │   ├── security/           # JWT utilities, Auth filters & SecurityConfig
│   │   └── service/            # EmailService, BirthdayService, AdminService
│   ├── src/main/resources/     # application.yml & application-postgres.yml
│   ├── Dockerfile              # Multi-stage production container build
│   └── pom.xml                 # Maven dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios instance with Bearer interceptors
│   │   ├── components/         # Navbar & AddEditBirthdayModal
│   │   ├── context/            # AuthContext (JWT & login state)
│   │   └── pages/              # Login, UserDashboard, AdminDashboard
│   ├── package.json            # Vite, React, Tailwind CSS, Lucide icons
│   ├── tailwind.config.js      # Styling theme configuration
│   └── vercel.json             # SPA routing rewrite rule
├── docker-compose.yml          # Local multi-container PostgreSQL + Backend stack
├── test_server.ps1             # End-to-end verification script
└── README.md                   # Full documentation & deployment guide
```
