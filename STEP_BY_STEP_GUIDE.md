# 🚀 Step-by-Step Execution & 100% Free Cloud Deployment Guide (OAuth 2.0 Architecture)

This guide provides complete instructions for running the **Birthday Reminder Application** locally and deploying it to the cloud at **$0 cost** using modern **Google OAuth 2.0 (Gmail REST API)** methodology instead of legacy password-based SMTP.

---

## 💡 Why OAuth 2.0 Instead of Legacy SMTP?

1. **Security & Deprecation**: Google has completely phased out "Less Secure Apps" and basic password authentication. Modern applications use OAuth 2.0 tokens (`access_token` & `refresh_token`) with the principle of least privilege (`gmail.send` scope).
2. **Zero Port Blocking in Cloud Hosting**: Free and budget cloud providers (Render.com, AWS, DigitalOcean, etc.) block outbound SMTP ports (25, 465, 587) by default to prevent spam. With Google OAuth 2.0, emails are dispatched via **HTTPS REST (Port 443)** to `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, which is **never blocked**!
3. **Audit Trail**: Every email sent receives an official Google Message ID, logged directly in the application's audit history.

---

## 📌 Architecture Overview

```
+--------------------------------------------------------------------------------------------------+
|                                MODERN OAUTH 2.0 CLOUD ARCHITECTURE                               |
|                                                                                                  |
|   [ Frontend (React/Vite) ]                                                                      |
|      Hosted on Vercel                                                                            |
|             │                                                                                    |
|             │ HTTPS REST                                                                         |
|             v                                                                                    |
|   [ Backend (Spring Boot 3.3.4) ]                                                                |
|      Hosted on Render.com (Docker)                                                               |
|             │                                      │                                             |
|             │ JDBC / SSL                           │ HTTPS REST (OAuth 2.0 Bearer Token)         |
|             v                                      v                                             |
|   [ Neon.tech PostgreSQL 16 ]           [ Google Gmail REST API v1 ]                             |
|      Free Serverless Database             https://gmail.googleapis.com/gmail/v1/users/me/messages/send
+--------------------------------------------------------------------------------------------------+
```

---

## 💻 Part 1: Run It Locally First (Takes 2 Minutes)

Before deploying to the cloud, run the application locally to test the UI, add birthdays, and explore the OAuth 2.0 Admin Portal.

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
2. **User Portal**:
   - Click the **Demo User** button (`user@birthday.com` / `User@123`) or try the **Sign in with Google (OAuth 2.0)** button.
   - View the glowing **23:50 Midnight Eve Alert** banner for tomorrow's birthday.
   - Click **+ Add Birthday** to add a new contact with relationship tags and gift notes.
   - Click **Test Email** on any card to test the reminder notification flow.
3. **Admin Portal**:
   - Sign out and click the **Demo Admin** button (`admin@birthday.com` / `Admin@123`).
   - Click the **Admin Portal** tab in the top navigation.
   - Click the **Google OAuth 2.0 Engine** tab:
     - Check connection status.
     - View or enter your Google Client ID, Client Secret, and Refresh Token.
     - Click **Diagnose Connection** to run an automated health check verifying your token refresh with Google and checking that the Gmail API is enabled.
     - Enter your real personal email in the **Send Live Test Email to Any Inbox** field and click **Send Test Email** to verify instant email delivery.
   - Check the **Delivery & Audit Logs** table to inspect delivery statuses, timestamps, error stack traces, and Google Message IDs.
   - Click **Trigger 23:50 Scheduler Now** to simulate tonight's reminder job on demand without waiting for 23:50!

---

## ☁️ Part 2: 100% Free Cloud Deployment Plan (From 0 to Live)

Follow these steps in order to deploy the application live to the internet with **$0/month** cost.

---

### Step A: Push Code to Your GitHub Account

1. Go to [GitHub](https://github.com) and create a repository named `birthday-reminder` (choose Public or Private).
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
   jdbc:postgresql://ep-xyz-123.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Copy your **Database Host, Database Name, User, and Password**.

---

### Step C: Set Up Free Google Cloud OAuth 2.0 Credentials (3 Mins)

Google provides free access to the Gmail API for personal projects.

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Click **Select a project** (top bar) > **New Project** > Name it `Birthday-Notifier` > Click **Create**.
3. **Enable Gmail API**:
   - In the search bar at the top, type `Gmail API` and select it.
   - Click **Enable**.
4. **Configure OAuth Consent Screen**:
   - On the left navigation, click **APIs & Services** > **OAuth consent screen**.
   - Choose **External** > Click **Create**.
   - Fill in:
     - **App name**: `Birthday Notifier`
     - **User support email**: Your Gmail address
     - **Developer contact email**: Your Gmail address
   - Click **Save and Continue**.
   - Under **Scopes**, click **Add or Remove Scopes** > select `https://www.googleapis.com/auth/gmail.send` > Click **Update** > Click **Save and Continue**.
   - Under **Test Users**, click **Add Users** > Enter your Gmail address (the one that will send/receive emails) > Click **Save and Continue**.
5. **Create OAuth 2.0 Client ID**:
   - On the left navigation, click **Credentials** > **Create Credentials** > **OAuth Client ID**.
   - Application type: **Web application**.
   - Name: `Birthday Notifier Web Client`.
   - Under **Authorized redirect URIs**, add these three URIs:
     1. `http://localhost:5173/oauth2/callback` *(for local development)*
     2. `https://developers.google.com/oauthplayground` *(for 60-second instant token generation)*
     3. `https://<your-vercel-app>.vercel.app/oauth2/callback` *(replace with your Vercel URL after Step E)*
   - Click **Create**.
   - Copy your **Client ID** (e.g., `xxxx.apps.googleusercontent.com`) and **Client Secret** (e.g., `GOCSPX-xxxx`).

---

### Step D: Generate the Google OAuth 2.0 Refresh Token (60 Seconds)

You can obtain the permanent `refresh_token` in 60 seconds using Google's official OAuth Playground:

1. Open [https://developers.google.com/oauthplayground](https://developers.google.com/oauthplayground).
2. Click the **Gear icon (OAuth 2.0 configuration)** in the top right:
   - Check the box: **Use your own OAuth credentials**.
   - Paste your **OAuth Client ID** and **OAuth Client Secret** from Step C.
3. Under **Step 1 (Select & authorize APIs)** on the left:
   - Scroll down to **Gmail API v1**.
   - Select `https://www.googleapis.com/auth/gmail.send`.
   - Click the blue **Authorize APIs** button.
   - Sign in with your Gmail account and click **Continue** (allow permissions).
4. Under **Step 2 (Exchange authorization code for tokens)**:
   - Click **Exchange authorization code for tokens**.
   - Copy the value of the **Refresh token** field (starts with `1//0...`).

> 🎉 **Done!** You now have:
> - `GOOGLE_OAUTH_CLIENT_ID`
> - `GOOGLE_OAUTH_CLIENT_SECRET`
> - `GOOGLE_OAUTH_REFRESH_TOKEN`
> - `GOOGLE_OAUTH_CONNECTED_EMAIL` (your Gmail address)

#### ⚠️ Common Google OAuth 2.0 Pitfalls & Solutions:
1. **`invalid_grant` error**:
   - **Reason**: In Google OAuth Playground, you forgot to check the **Gear icon > Use your own OAuth credentials** before authorizing. Without this, the token is generated using Google's client and will be rejected when refreshed with your `client_id`.
   - **Fix**: Open OAuth Playground, click the Gear icon, paste your `Client ID` and `Client Secret`, and re-authorize.
2. **`Gmail API has not been used... or it is disabled`**:
   - **Reason**: The Gmail API is not enabled in your Google Cloud Project.
   - **Fix**: Go to Google Cloud Console > **APIs & Services** > **Library**, search for **Gmail API**, and click **Enable**.
3. **`Access blocked: app has not completed verification` / 403**:
   - **Reason**: While your app is in "Testing" publishing status, only approved accounts can authenticate.
   - **Fix**: Go to Google Cloud Console > **APIs & Services** > **OAuth consent screen** > **Test users**, and add your Gmail address.
4. **Use the "Diagnose Connection" Button**:
   - In the application's Admin Dashboard under **Google OAuth 2.0 Engine**, click the **Diagnose Connection** button at any time. It will test token exchange and Gmail profile access, giving you an exact real-time diagnosis.

---

### Step E: Deploy Backend to Render.com (Free)

1. Sign up for a free account at [https://render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `birthday-reminder`.
4. Configure service settings:
   - **Name**: `birthday-notifier-api`
   - **Region**: Closest to you (e.g., Oregon, Frankfurt, Singapore)
   - **Root Directory**: `backend`
   - **Environment**: `Docker` *(Render will build using `backend/Dockerfile`)*
   - **Instance Type**: `Free`
5. Expand **Environment Variables** and add the following keys:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<neon-host>/neondb?sslmode=require` | Your Neon JDBC URL from Step B |
   | `SPRING_DATASOURCE_USERNAME` | `<neon-user>` | Your Neon Database Username |
   | `SPRING_DATASOURCE_PASSWORD` | `<neon-password>` | Your Neon Database Password |
   | `SPRING_DATASOURCE_DRIVER` | `org.postgresql.Driver` | PostgreSQL driver class |
   | `HIBERNATE_DIALECT` | `org.hibernate.dialect.PostgreSQLDialect` | Hibernate dialect |
   | `GOOGLE_OAUTH_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Google Client ID from Step C |
   | `GOOGLE_OAUTH_CLIENT_SECRET` | `GOCSPX-xxxx` | Google Client Secret from Step C |
   | `GOOGLE_OAUTH_REFRESH_TOKEN` | `1//0xxxx` | Refresh Token from Step D |
   | `GOOGLE_OAUTH_CONNECTED_EMAIL` | `your-email@gmail.com` | Your Gmail address |
   | `APP_REMINDER_CRON` | `0 50 23 * * ?` | Cron for 23:50 (11:50 PM) every night |
   | `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | Secret key for JWT auth |

6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to finish. Render will provide your public backend API URL:
   ```
   https://birthday-notifier-api.onrender.com
   ```
   *(Verify by opening `https://birthday-notifier-api.onrender.com/api/health` in your browser; it will return `{"status":"UP"}`)*.

---

### Step F: Deploy Frontend to Vercel (Free)

1. Sign up for a free account at [https://vercel.com](https://vercel.com).
2. Click **Add New** -> **Project** and select your GitHub repository `birthday-reminder`.
3. Configure build settings:
   - **Root Directory**: Click edit and select `frontend`.
   - **Framework Preset**: `Vite` (automatically detected).
4. Expand **Environment Variables** and add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://birthday-notifier-api.onrender.com` *(your Render backend URL from Step E)*
5. Click **Deploy**.
6. Within 1 minute, Vercel will deploy your live website:
   ```
   https://birthday-reminder.vercel.app
   ```
7. *(Optional)* Return to **Google Cloud Console > Credentials** and ensure `https://birthday-reminder.vercel.app/oauth2/callback` is listed under Authorized Redirect URIs.

---

## 🔑 Default Accounts for Testing

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Demo User** | `user@birthday.com` | `User@123` | Add birthdays, receive 23:50 reminders, send test notifications |
| **Demo Admin** | `admin@birthday.com` | `Admin@123` | Google OAuth 2.0 Engine controls, user governance, audit logs, trigger scheduler on demand |

---

## 🛠️ Summary Checklist

- [ ] Run Part 1 locally and verify UI and features in browser (`http://localhost:5173`).
- [ ] Push code to your GitHub account (Step A).
- [ ] Create free database on Neon.tech and copy JDBC URL (Step B).
- [ ] Create Google Cloud project, enable Gmail API, and create OAuth Client ID (Step C).
- [ ] Generate Refresh Token via OAuth Playground or Admin UI (Step D).
- [ ] Deploy backend on Render.com with Google OAuth and Neon environment variables (Step E).
- [ ] Deploy frontend on Vercel with `VITE_API_BASE_URL` (Step F).
- [ ] Log in as Admin on the live site, click **Test OAuth 2.0 Email**, and confirm delivery in your inbox!
