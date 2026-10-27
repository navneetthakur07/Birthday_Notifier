# 🚀 Step-by-Step Execution & 100% Free Cloud Deployment Guide

This guide provides end-to-end instructions for running the **Birthday Reminder Application** locally and deploying it to the cloud at **$0 cost** for educational use.

---

## 📌 Status Confirmation

- **Backend (Spring Boot 3.3.4, Java 21)**: 100% Complete & Tested (Spring Security 6, JWT, Spring Data JPA, JavaMailSender SMTP, 23:50 Cron Scheduler, Admin maintenance).
- **Frontend (React.js, Vite, Tailwind CSS)**: 100% Complete & Built (User Dashboard with 23:50 countdown, Admin Portal, Add/Edit modals, Demo login buttons).
- **All code is committed to local Git.**

---

## 💻 Part 1: Run It Locally First (Takes 2 Minutes)

Before deploying to the cloud, run the application locally to test the UI, create birthdays, and explore the Admin Portal.

### Terminal 1 — Start the Backend
Open PowerShell in the project directory (`c:\Users\navne\Documents\Birthday_Notifier`):
```powershell
cd backend
java -jar target/birthday-notifier-backend-1.0.0.jar
```
> The backend will start on **`http://localhost:8080`**. It automatically initializes an in-memory database with pre-seeded demo accounts and sample birthdays.

---

### Terminal 2 — Start the Frontend
Open a second PowerShell window in the project directory (`c:\Users\navne\Documents\Birthday_Notifier`):
```powershell
cd frontend
npm run dev
```
> The frontend will start at **`http://localhost:5173`** and proxy API calls to port 8080.

---

### 🧪 Test the Application in Your Browser

1. Open your browser and go to: **`http://localhost:5173`**
2. **Test as User**:
   - Click the **Demo User** button (or enter `user@birthday.com` / `User@123`).
   - View the glowing **23:50 Midnight Eve Alert** banner for tomorrow's birthday.
   - Click **Test Email** on any card to simulate sending an immediate reminder.
   - Click **+ Add Birthday** to add a new contact with relationship tags and gift notes.
3. **Test as Admin**:
   - Sign out and click the **Demo Admin** button (or enter `admin@birthday.com` / `Admin@123`).
   - Click the **Admin Portal** tab in the top navigation.
   - Toggle user accounts between **Active** and **Inactive**.
   - Check the **Delivery & Audit Logs** table to see email delivery status and timestamps.
   - Click **Trigger 23:50 Scheduler Now** to simulate tonight's reminder job on demand without waiting for 23:50!

---

## ☁️ Part 2: 100% Free Cloud Deployment Plan (From 0 to Live)

Follow these steps in order to deploy the application live to the internet with **$0/month** cost.

```
+-----------------------------------------------------------------------------------+
|                           FREE CLOUD ARCHITECTURE                                 |
|                                                                                   |
|  [ Step A: GitHub ]                                                               |
|        │                                                                          |
|        ├──> [ Step D: Render.com ] ──JDBC──> [ Step B: Neon.tech (Postgres 16) ]   |
|        │    (Spring Boot Web Service)               │                             |
|        │                                            v                             |
|        │                               [ Step C: Gmail SMTP (Port 587) ]          |
|        │                                                                          |
|        └──> [ Step E: Vercel ] ────HTTPS REST────> Render Backend API             |
|             (React.js Static CDN)                                                 |
+-----------------------------------------------------------------------------------+
```

---

### Step A: Push Code to Your GitHub Account

1. Go to [GitHub](https://github.com) and create a new repository named `birthday-reminder` (choose Public or Private).
2. In your terminal, link your local repository and push:
   ```powershell
   git remote add origin https://github.com/<your-github-username>/birthday-reminder.git
   git branch -M main
   git push -u origin main
   ```

---

### Step B: Create a Free PostgreSQL Database on Neon.tech (2 Mins)

1. Sign up for free at [https://neon.tech](https://neon.tech).
2. Click **Create Project** and name it `birthday-db`.
3. In the project dashboard under **Connection Details**, change the dropdown to **Java / JDBC**.
4. You will get a JDBC URL formatted like:
   ```
   jdbc:postgresql://ep-xyz-123.us-east-2.aws.neon.tech/birthday-db?sslmode=require
   ```
5. Keep this tab open or copy your **Database Host, Database Name, User, and Password**.

---

### Step C: Generate a Free Gmail App Password for SMTP (2 Mins)

1. Open your Google Account Security page: [https://myaccount.google.com/security](https://myaccount.google.com/security).
2. Make sure **2-Step Verification** is turned **ON**.
3. In the top search bar, search for **App passwords** (or visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Enter an App Name (e.g. `BirthdayNotifier`) and click **Create**.
5. Google will display a **16-character password** (e.g. `abcd efgh ijkl mnop`). Copy and save this password.

---

### Step D: Deploy Backend to Render.com (Free)

1. Sign up for a free account at [https://render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `birthday-reminder`.
4. Fill in the following service settings:
   - **Name**: `birthday-notifier-api`
   - **Region**: Select the region closest to you (e.g., Frankfurt, Oregon, Singapore).
   - **Root Directory**: `backend`
   - **Environment**: `Docker` *(Render will automatically build using `backend/Dockerfile`)*
   - **Instance Type**: `Free`
5. Expand the **Environment Variables** section and add the following keys:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<neon-host>/birthday-db?sslmode=require` | Your Neon JDBC URL from Step B |
   | `SPRING_DATASOURCE_USERNAME` | `<neon-user>` | Your Neon Database Username |
   | `SPRING_DATASOURCE_PASSWORD` | `<neon-password>` | Your Neon Database Password |
   | `SPRING_DATASOURCE_DRIVER` | `org.postgresql.Driver` | PostgreSQL driver class |
   | `HIBERNATE_DIALECT` | `org.hibernate.dialect.PostgreSQLDialect` | Hibernate dialect |
   | `SPRING_MAIL_HOST` | `smtp.gmail.com` | Gmail SMTP server |
   | `SPRING_MAIL_PORT` | `587` | TLS port |
   | `SPRING_MAIL_USERNAME` | `your-email@gmail.com` | Your Gmail address |
   | `SPRING_MAIL_PASSWORD` | `abcdefghijklmnop` | 16-character App Password from Step C |
   | `APP_REMINDER_CRON` | `0 50 23 * * ?` | Cron for 23:50 (11:50 PM) every night |
   | `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | Secret key for JWT generation |

6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to complete. Render will generate your live backend API URL:
   ```
   https://birthday-notifier-api.onrender.com
   ```
   *(You can test it by visiting `https://birthday-notifier-api.onrender.com/api/health` in your browser to verify it returns `{"status":"UP"}`)*.

---

### Step E: Deploy Frontend to Vercel (Free)

1. Sign up for a free account at [https://vercel.com](https://vercel.com).
2. Click **Add New** -> **Project** and select your GitHub repository `birthday-reminder`.
3. Configure the build settings:
   - **Root Directory**: Click edit and select `frontend`.
   - **Framework Preset**: `Vite` (automatically detected).
4. Expand **Environment Variables** and add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://birthday-notifier-api.onrender.com` *(use your actual Render backend URL from Step D)*
5. Click **Deploy**.
6. Within 1 minute, Vercel will deploy the application and give you a public URL:
   ```
   https://birthday-reminder.vercel.app
   ```

---

## 🔑 Default Accounts for Testing

Once deployed, you can immediately log into the live website using the seeded credentials:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Demo User** | `user@birthday.com` | `User@123` | Add/manage birthdays, receive reminders, send test emails |
| **Demo Admin** | `admin@birthday.com` | `Admin@123` | User maintenance, delivery audit logs, trigger scheduler on demand |

---

## 🛠️ Summary Checklist

- [ ] Run Part 1 locally and verify UI and features in browser (`http://localhost:5173`).
- [ ] Push code to your GitHub account (Step A).
- [ ] Create free database on Neon.tech and copy JDBC URL (Step B).
- [ ] Create 16-character Gmail App Password (Step C).
- [ ] Deploy backend on Render.com with environment variables (Step D).
- [ ] Deploy frontend on Vercel with `VITE_API_BASE_URL` (Step E).
- [ ] Open the live Vercel URL, log in, and test adding birthdays!
