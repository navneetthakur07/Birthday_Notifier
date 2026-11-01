# 🎂 Birthday Reminder Application (Midnight Eve Notification Service)

A full-stack, enterprise-grade birthday reminder platform that alerts users via email at **23:50 (11:50 PM) the evening before** a loved one's birthday. This gives users a 10-minute window to prepare their messages and wish their friends or family right at the stroke of midnight (00:00).

Built with modern **Google OAuth 2.0 (Gmail REST API)** methodology for **100% free hosting and deployment** with zero outbound SMTP port blocking.

---

## 🌟 Tech Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Backend** | **Java 21 LTS + Spring Boot 3.3.4** | RESTful APIs, Spring Data JPA, Spring Task Scheduling (`@Scheduled`) |
| **Email Engine** | **Google OAuth 2.0 + Gmail REST API v1** | Modern HTTPS REST email dispatch (Port 443, no SMTP port blocking!), OAuth2 token refresh & Gmail Message ID audit logs |
| **Security** | **Spring Security 6 + JJWT** | Stateless token-based auth, Role-Based Access Control (`ROLE_USER`, `ROLE_ADMIN`), BCrypt hashing, Google OAuth 2.0 SSO |
| **Frontend** | **React.js (Vite) + Tailwind CSS** | Clean SaaS UI, Lucide icons, Axios with JWT interceptors, OAuth callback handler, responsive dashboards |
| **Database** | **PostgreSQL / Neon.tech** | Production relational storage with automated fallback to H2 for instant local development |

---

## 🚀 Key Features

### 1. The "Midnight Eve" 23:50 Notification Engine
- Daily cron trigger: `0 50 23 * * ?` (23:50:00 every night).
- Computes tomorrow's calendar date and fetches all active birthday records matching month & day.
- Asynchronously sends a rich HTML email reminder via **Google OAuth 2.0 Gmail REST API** directly to the user's registered inbox.
- Complete delivery audit logging in the `notification_logs` table with official Google Message IDs.

### 2. User Portal (`ROLE_USER`)
- **Interactive Calendar & Cards**: View birthdays categorized by relationship (Friend, Family, Colleague, Other).
- **Upcoming Birthday Banner**: Highlights birthdays occurring tomorrow with an active 23:50 reminder countdown.
- **Milestones**: Automatic calculation of turning age and days remaining until the birthday.
- **Instant Test Reminder Button**: Dispatches an immediate sample reminder email to verify OAuth 2.0 delivery.
- **Add / Edit Modal**: Set contact details, gift notes, and toggle reminders.
- **Sign in with Google (OAuth 2.0)**: Seamless 1-click SSO option alongside standard credentials.

### 3. Admin Maintenance Portal (`ROLE_ADMIN`)
- **Google OAuth 2.0 Engine Management**:
  - Live connection status badge (🟢 Connected / 🟡 Setup Needed).
  - 1-Click "Connect Gmail with Google OAuth 2.0" authorization flow.
  - Manual configuration form for Client ID, Client Secret, and Refresh Token.
  - "Test OAuth 2.0 Email" button to send a real-time verification email.
- **User Governance**: View all registered accounts, registration dates, role badges, and total tracked birthdays.
- **Account Status Toggle**: Activate or deactivate user accounts with 1 click.
- **Audit & Delivery Logs**: Full trace of all sent notifications, delivery timestamps, Google Message IDs, and error diagnostics.
- **"Trigger 23:50 Scheduler Now"**: Manually triggers tonight's reminder batch execution for instant testing without waiting for 23:50!

---

## 🔑 Pre-Configured Demo Accounts

On initial boot, the application automatically seeds the database with demo accounts:

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **User** | `user@birthday.com` | `User@123` | Seeded with 2 birthdays (including Sophia Miller's birthday tomorrow for immediate testing) |
| **Admin** | `admin@birthday.com` | `Admin@123` | Full access to Google OAuth 2.0 Engine, User Management, and Delivery Logs |

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
*The backend starts at `http://localhost:8080`. By default, it uses an embedded in-memory database with automatic schema creation.*

### 2. Start Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
*The frontend starts at `http://localhost:5173` with automatic API proxying to `http://localhost:8080`.*

---

## ☁️ 100% Free Cloud Deployment Blueprint

Detailed, step-by-step instructions with screenshots and Google Cloud Console setup are available in:
👉 [**STEP_BY_STEP_GUIDE.md**](STEP_BY_STEP_GUIDE.md)

---

## 🧪 Verification & Automated Testing

You can run the end-to-end integration verification script at any time:
```powershell
powershell -ExecutionPolicy Bypass -File test_server.ps1
```
This script validates:
- Health check ping (`/api/health`)
- Public OAuth 2.0 status check (`/api/oauth2/status`)
- Admin and User authentication & JWT generation
- Google OAuth 2.0 SSO sign-in (`/api/auth/google-login`)
- Google OAuth 2.0 credential storage & token validation
- Birthday listing and countdown calculations
- Instant test email reminder dispatch via OAuth 2.0
- Manual triggering of the 23:50 scheduler job
- Admin system statistics and notification audit logs

---

## 📁 Repository Structure

```
Birthday_Notifier/
├── backend/
│   ├── src/main/java/com/birthdaynotifier/
│   │   ├── config/             # DB seeder & configuration
│   │   ├── controller/         # Auth, Birthday, Admin, Health, OAuth2 controllers
│   │   ├── dto/                # Request & response data transfer objects
│   │   ├── entity/             # User, Role, Birthday, NotificationLog, AppConfig
│   │   ├── repository/         # Spring Data JPA repositories
│   │   ├── scheduler/          # 23:50 Midnight Eve scheduled reminder worker
│   │   ├── security/           # JWT utilities, Auth filters & SecurityConfig
│   │   └── service/            # GoogleOAuth2Service, EmailService, BirthdayService, AdminService
│   ├── src/main/resources/     # application.yml & application-postgres.yml
│   ├── Dockerfile              # Multi-stage production container build
│   └── pom.xml                 # Maven dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios instance with Bearer interceptors
│   │   ├── components/         # Navbar & AddEditBirthdayModal
│   │   ├── context/            # AuthContext (JWT & login state)
│   │   └── pages/              # Login, UserDashboard, AdminDashboard, OAuthCallback
│   ├── package.json            # Vite, React, Tailwind CSS, Lucide icons
│   ├── tailwind.config.js      # Styling theme configuration
│   └── vercel.json             # SPA routing rewrite rule
├── docker-compose.yml          # Local multi-container PostgreSQL + Backend stack
├── test_server.ps1             # End-to-end verification script
├── STEP_BY_STEP_GUIDE.md       # Comprehensive Google OAuth 2.0 setup & cloud deployment guide
└── README.md                   # Project overview & documentation
```
