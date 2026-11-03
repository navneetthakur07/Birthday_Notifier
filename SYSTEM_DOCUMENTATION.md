# 📘 Birthday Reminder Application — System Architecture, OAuth 2.0 & RCA Documentation

> **Complete Technical Guide, Architectural Specification, Data Flow, and Root Cause Analysis (RCA)**  
> *Educational Reference for Spring Boot 3.3.4, React.js, PostgreSQL, and Google OAuth 2.0 (Gmail REST API)*

---

## 📑 Table of Contents

1. [Project Overview & Business Logic](#1-project-overview--business-logic)
2. [OAuth 2.0 vs Legacy SMTP Deep Dive](#2-oauth-20-vs-legacy-smtp-deep-dive)
3. [User vs Admin Roles & Workflows](#3-user-vs-admin-roles--workflows)
4. [Data Flow: From UI to PostgreSQL to Gmail API](#4-data-flow-from-ui-to-postgresql-to-gmail-api)
5. [Root Cause Analysis (RCA): Why Mail Failed to Send](#5-root-cause-analysis-rca-why-mail-failed-to-send)
6. [Codebase Fixes & Enhancements Implemented](#6-codebase-fixes--enhancements-implemented)
7. [Step-by-Step Setup & Operational Runbook](#7-step-by-step-setup--operational-runbook)
8. [Database Schema & Configurations](#8-database-schema--configurations)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

## 1. Project Overview & Business Logic

### The Core Goal
The Birthday Reminder Application solves a common social problem: people forget to wish their friends or family right when their birthday begins. 
Instead of sending a reminder on the birthday morning (when it may already be too late to be the "first to wish"), this application sends an automated email notification at **23:50 (11:50 PM) on the evening BEFORE the birthday**. This gives the user a 10-minute window to prepare their message, call, or gift right at the stroke of midnight (00:00).

### Key Architectural Requirements:
1. **Zero Cost / 100% Free**: Designed to run entirely on free-tier cloud infrastructure (Neon PostgreSQL, Render Docker Web Service, Vercel SPA Hosting).
2. **Modern Security**: Uses Google OAuth 2.0 and the official Gmail REST API v1 over HTTPS rather than insecure, deprecated password-based SMTP.
3. **Role Separation**:
   - **User**: Tracks loved ones' birthdays, receives reminders, triggers sample notifications.
   - **Admin**: Centrally configures and monitors the Google OAuth 2.0 delivery engine, audits delivery logs, and triggers the reminder scheduler on demand.

---

## 2. OAuth 2.0 vs Legacy SMTP Deep Dive

### Why SMTP Was Deprecated and Why OAuth 2.0 Was Chosen

| Feature | Legacy SMTP (Port 587 / 465) | Modern Google OAuth 2.0 (Port 443 HTTPS REST) |
| :--- | :--- | :--- |
| **Authentication** | Username + raw account password (or 16-character App Password). | Cryptographic bearer tokens (`access_token`, `refresh_token`). |
| **Cloud Hosting Compatibility** | ❌ **Blocked by default** on free cloud tiers (Render, AWS, DigitalOcean, Heroku) to prevent spam. | ✅ **Never blocked**; communicates via standard outbound HTTPS REST API (Port 443). |
| **Security Principle** | All-or-nothing access to the entire Google account. | **Principle of Least Privilege**: limited to `https://www.googleapis.com/auth/gmail.send`. |
| **Password Storage** | Password must be saved in server config/database. | Server **never** sees or stores your Google password. |
| **Traceability** | Basic SMTP acknowledgment. | Official Google Message ID (`id` & `threadId`) logged in audit history. |

### How OAuth 2.0 Works Internally

```
+--------------------------------------------------------------------------------------------------+
|                                    OAUTH 2.0 TOKEN LIFECYCLE                                     |
|                                                                                                  |
|   1. Admin UI                 2. Spring Boot Backend                 3. Google Cloud API         |
|   +---------------+           +--------------------+                 +------------------+        |
|   | Enter:        |  POST     | Stored in DB       |                 |                  |        |
|   | Client ID     | --------> | (app_configs)      |                 |                  |        |
|   | Client Secret | /config   |                    |                 |                  |        |
|   | Refresh Token |           | Every send request:|  POST /token    |                  |        |
|   +---------------+           | Refresh Token      | --------------> | Validates &      |        |
|                               | Client Secret      | <-------------- | Returns:         |        |
|                               |                    |  Access Token   | (Short-lived)    |        |
|                               |                    |  (valid 1 hr)   |                  |        |
|                               |                    |                 |                  |        |
|                               | Constructs MIME    |  POST /messages |                  |        |
|                               | RFC 2822 email     | --------------> | Gmail dispatches |        |
|                               | + Bearer Token     | <-------------- | Returns:         |        |
|                               |                    |  HTTP 200 (OK)  | Google Msg ID    |        |
|                               +--------------------+  + Message ID   +------------------+        |
+--------------------------------------------------------------------------------------------------+
```

1. **Client ID & Client Secret**: The identity keys generated inside Google Cloud Console representing our application.
2. **Refresh Token (Long-lived)**: Generated during the one-time authorization step. It never expires unless revoked and is securely stored in the PostgreSQL `app_configs` table.
3. **Access Token (Short-lived, 1 hour)**: When an email is ready to send, the backend calls `https://oauth2.googleapis.com/token` presenting the `refresh_token`, `client_id`, and `client_secret`. Google returns a temporary `access_token`.
4. **MIME Construction & Base64URL**: The email body is assembled as an RFC 2822 MIME message (with `From`, `To`, `Subject`, `Content-Type: text/html`), encoded using URL-safe Base64 without line breaks, and POSTed to:
   ```
   POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
   Authorization: Bearer <access_token>
   Content-Type: application/json

   { "raw": "PD94bWwgdmVyc2lvbj0..." }
   ```

---

## 3. User vs Admin Roles & Workflows

### The User (`ROLE_USER`)
The regular user is purely an **end-consumer** of the service.
- **Does NOT need a Google Cloud account**: Users do not generate tokens or configure APIs.
- **Actions**:
  1. Register / Sign in (via standard email/password or "Sign in with Google" SSO).
  2. Add, update, or remove birthdays (Name, Date of Birth, Relationship, Gift Ideas/Notes).
  3. View the dashboard:
     - Upcoming birthdays categorized with color-coded tags (`FAMILY`, `FRIEND`, `COLLEAGUE`, `OTHER`).
     - Turning age and days remaining until the birthday.
     - Glowing **Midnight Eve Banner** if a birthday is tomorrow.
  4. Click **"Test Email"** on any birthday card to trigger an immediate sample reminder to their own registered inbox.
  5. Receive an automated HTML reminder email every night at **23:50** whenever one of their contacts has a birthday tomorrow.

### The System Administrator (`ROLE_ADMIN`)
The administrator acts as the **infrastructure maintainer**.
- **Actions**:
  1. Log in with admin credentials (`admin@birthday.com`).
  2. Open the **Admin Portal** navigation tab.
  3. Manage **Google OAuth 2.0 Engine**:
     - View connection status and authorized email.
     - Enter or update Google Client ID, Client Secret, Refresh Token, and Connected Email.
     - Click **"Diagnose Connection"** to run an automated health check (validating token exchange, scopes, and Gmail API enablement).
     - Enter an email into **"Send Live Test Email to Any Inbox"** to test live delivery to a personal address.
  4. View **User Governance**:
     - List all registered users, total birthdays tracked per user, and registration dates.
     - Toggle user account status (Active / Inactive).
  5. Inspect **Delivery & Audit Logs**:
     - Table showing timestamp, recipient, person celebrated, delivery status (`SENT (OAuth 2.0)` or `FAILED`), Google Message ID, and error stack traces.
  6. **"Trigger 23:50 Scheduler Now"**:
     - Allows instant manual testing of tonight's reminder job on demand without waiting for 23:50!

---

## 4. Data Flow: From UI to PostgreSQL to Gmail API

### Step 1: Saving Configuration from the UI
```
[ Browser: AdminDashboard.jsx ]
       │
       │ Admin inputs Client ID, Secret, Refresh Token, Connected Email
       │ Clicks "Save Configuration"
       ▼
[ HTTP POST /api/oauth2/config ]  (OAuth2Controller.java)
       │
       │ Passes OAuth2ConfigDto to GoogleOAuth2Service
       ▼
[ GoogleOAuth2Service.java -> saveOAuth2Config() ]
       │
       │ Iterates over keys and persists to database:
       ▼
[ PostgreSQL: app_configs table ]
┌──────────────────────────────┬───────────────────────────────────────────┐
│ config_key                   │ config_value                              │
├──────────────────────────────┼───────────────────────────────────────────┤
│ GOOGLE_OAUTH_CLIENT_ID       │ 123456789-abc.apps.googleusercontent.com  │
│ GOOGLE_OAUTH_CLIENT_SECRET   │ GOCSPX-SampleSecret                       │
│ GOOGLE_OAUTH_REFRESH_TOKEN   │ 1//04SampleRefreshToken                   │
│ GOOGLE_OAUTH_CONNECTED_EMAIL │ sender.admin@gmail.com                    │
└──────────────────────────────┴───────────────────────────────────────────┘
```

### Step 2: Sending an Email at Runtime (23:50 Scheduler or Test Trigger)
```
[ 23:50 Scheduler / User Test Reminder ]
       │
       ▼
[ BirthdayScheduler.java / BirthdayController.java ]
       │
       │ Calls EmailService.sendBirthdayReminder(userEmail, personName, age, relationship, notes)
       ▼
[ EmailService.java ]
       │
       │ Detects Google OAuth 2.0 is connected
       │ Delegates to GoogleOAuth2Service.sendEmailViaOAuth2()
       ▼
[ GoogleOAuth2Service.java ]
       │
       │ 1. Queries PostgreSQL app_configs table for credentials
       │ 2. POST https://oauth2.googleapis.com/token
       │    Body: { client_id, client_secret, refresh_token, grant_type="refresh_token" }
       │ 3. Google returns: { "access_token": "ya29.a0AfH...", "expires_in": 3599 }
       │ 4. Auto-detects sender address via GET https://gmail.googleapis.com/gmail/v1/users/me/profile
       │ 5. Creates MimeMessage (From: verified sender, To: recipient, Subject, HTML)
       │ 6. Encodes raw message into URL-safe Base64
       │ 7. POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
       │    Headers: Authorization: Bearer <access_token>
       │    Body: { "raw": "<base64_string>" }
       ▼
[ Google Gmail REST API ]
       │
       │ Dispatches email to recipient inbox
       │ Returns: { "id": "18c2a9f4b3e8", "threadId": "18c2a9f4b3e8" }
       ▼
[ PostgreSQL: notification_logs table ]
       │
       └─ Status: "SENT (OAuth 2.0)", MessageId: "18c2a9f4b3e8", Timestamp: NOW
```

---

## 5. Root Cause Analysis (RCA): Why Mail Failed to Send

During testing, five distinct issues prevented successful email delivery:

### RCA 1: Hardcoded Test Recipient Defaulting to Demo Account
- **Technical Issue**: In `OAuth2Controller.java`, the test endpoint previously defaulted to `currentUser.getUsername()`. When the admin was logged in as the demo admin (`admin@birthday.com`), Google was requested to deliver the email to `admin@birthday.com` (a non-existent domain). Even if Google accepted it, the email never arrived in the user's real inbox.
- **Root Cause**: Hardcoded recipient binding without an option for the admin to supply a custom destination email.
- **Resolution**: Updated `OAuth2Controller.java` to accept an optional `targetEmail` in the request body. Added a dedicated input field on `AdminDashboard.jsx` labeled **"Send Live Test Email to Any Inbox"**.

### RCA 2: Gmail API `From` Address Mismatch (HTTP 400 Bad Request)
- **Technical Issue**: Google's Gmail API enforces that the `From:` header in the RFC 2822 payload must match the authenticated Google account (or an authorized alias configured in Gmail settings). If `connectedEmail` was left as a default placeholder (`birthday-notifier@noreply.com`) or empty, Google rejected the request with `400 Bad Request: Mail address mismatch`.
- **Root Cause**: Rigid reliance on the manual UI text input for the `From` address.
- **Resolution**: Enhanced `GoogleOAuth2Service.java` to automatically discover the true authorized Gmail address via `GET /gmail/v1/users/me/profile`. If the configured `From` address is empty or mismatched, it automatically defaults to the authentic Gmail address associated with the token.

### RCA 3: Masked Error Messages
- **Technical Issue**: When Google returned an error (such as `invalid_grant` or `access_denied`), Spring's `RestTemplate` threw `HttpStatusCodeException`. The code was catching generic `Exception` and calling `ex.getMessage()`, which produced only `400 Bad Request: [no body]`, masking Google's detailed explanation.
- **Root Cause**: Insufficient exception handling for Spring's REST client.
- **Resolution**: Added explicit `catch (HttpStatusCodeException ex)` blocks that parse `ex.getResponseBodyAsString()` and extract Google's JSON error payload (`error_description`).

### RCA 4: Google OAuth Playground Client ID Mismatch (`invalid_grant`)
- **Technical Issue**: When users generate the `refresh_token` using Google OAuth Playground, by default Playground uses Google's own internal Client ID. If the user does not open the Playground settings and select "Use your own OAuth credentials", the generated Refresh Token is bound to Google's Client ID. When our Spring Boot app tries to refresh it using the user's custom `Client ID`, Google rejects the request with `invalid_grant`.
- **Root Cause**: Third-party token binding mismatch.
- **Resolution**: Added automated diagnostic checks and highlighted instructions in the UI and documentation explaining how to check the Gear icon in OAuth Playground.

### RCA 5: Gmail API Disabled in Google Cloud Console (HTTP 403)
- **Technical Issue**: In a new Google Cloud project, APIs are disabled by default. If the developer creates credentials without explicitly clicking **Enable** on the **Gmail API**, Google returns `SERVICE_DISABLED` (HTTP 403).
- **Root Cause**: Missing API enablement in Google Cloud Console.
- **Resolution**: Added pre-flight check in `/api/oauth2/diagnose` that tests access to `/gmail/v1/users/me/profile` and flags this exact error if the API is disabled.

---

## 6. Codebase Fixes & Enhancements Implemented

| File Modified | Changes Applied |
| :--- | :--- |
| `backend/.../service/GoogleOAuth2Service.java` | 1. Added `diagnoseConnection()` to validate token refresh and profile lookup.<br>2. Added automatic sender discovery using `/gmail/v1/users/me/profile`.<br>3. Added `HttpStatusCodeException` handling to extract exact Google JSON error descriptions.<br>4. Improved MIME formatting and Base64URL encoding. |
| `backend/.../controller/OAuth2Controller.java` | 1. Added `GET /api/oauth2/diagnose` endpoint.<br>2. Updated `POST /api/oauth2/test` to accept `targetEmail` for live testing to any address.<br>3. Added real-time diagnostics in error responses. |
| `backend/.../controller/BirthdayController.java` | Updated `POST /api/birthdays/{id}/test-reminder` to return accurate delivery statuses. |
| `frontend/.../pages/AdminDashboard.jsx` | 1. Added **"Diagnose Connection"** button with a real-time Diagnostic Report Card.<br>2. Added **"Send Live Test Email to Any Inbox"** field and button.<br>3. Added in-UI guidance for Google OAuth Playground token generation.<br>4. Added detailed error display for failed tests. |
| `STEP_BY_STEP_GUIDE.md` | Added common pitfalls, Playground instructions, and diagnostic usage steps. |

---

## 7. Step-by-Step Setup & Operational Runbook

### Step A: Google Cloud Console Setup (3 Minutes)
1. Navigate to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project: `Birthday-Notifier`.
3. Go to **APIs & Services > Library**, search for **Gmail API**, and click **Enable**.
4. Go to **APIs & Services > OAuth consent screen**:
   - User Type: **External** -> Click **Create**.
   - App Name: `Birthday Notifier`.
   - User support email & Developer email: Your Gmail address.
   - Click **Save and Continue**.
   - Under **Scopes**, click **Add or Remove Scopes**, select `https://www.googleapis.com/auth/gmail.send`, and click **Update**.
   - Under **Test Users**, click **Add Users**, enter your Gmail address, and click **Save and Continue**.
5. Go to **APIs & Services > Credentials**:
   - Click **Create Credentials > OAuth client ID**.
   - Application Type: **Web application**.
   - Name: `Birthday Notifier Web Client`.
   - Authorized Redirect URIs:
     - `http://localhost:5173/oauth2/callback`
     - `https://developers.google.com/oauthplayground`
     - `https://<your-vercel-domain>.vercel.app/oauth2/callback`
   - Click **Create**. Copy your **Client ID** and **Client Secret**.

### Step B: Generate the Refresh Token in 60 Seconds
1. Open [Google OAuth Playground](https://developers.google.com/oauthplayground).
2. Click the **Gear icon (OAuth 2.0 configuration)** in the top right:
   - Check: **Use your own OAuth credentials**.
   - Paste your **OAuth Client ID** and **OAuth Client Secret**.
3. Under **Step 1 (Select & authorize APIs)** on the left:
   - Scroll down to **Gmail API v1**.
   - Select `https://www.googleapis.com/auth/gmail.send`.
   - Click **Authorize APIs**.
   - Sign in with your Gmail account and click **Continue**.
4. Under **Step 2 (Exchange authorization code for tokens)**:
   - Click **Exchange authorization code for tokens**.
   - Copy the value of the **Refresh token** (starts with `1//0...`).

### Step C: Enter Values in Admin Dashboard & Diagnose
1. Start the application and log in as `admin@birthday.com` (password `Admin@123`).
2. Go to **Admin Portal > Google OAuth 2.0 Engine**.
3. Paste:
   - **Client ID**
   - **Client Secret**
   - **Refresh Token**
   - **Connected Gmail Address**
4. Click **Save Configuration**.
5. Click **Diagnose Connection**:
   - A green card confirms: `"Google OAuth 2.0 is Healthy! Connected Account: <your-email>"`.
6. Enter your personal email in **Send Live Test Email to Any Inbox** and click **Send Test Email**.
7. Check your personal inbox for the confirmation email!

---

## 8. Database Schema & Configurations

The application uses standard PostgreSQL tables managed via Spring Data JPA:

```sql
-- Application Key-Value Configuration (Stores OAuth 2.0 credentials)
CREATE TABLE app_configs (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    updated_at TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    google_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);

-- Birthdays Table
CREATE TABLE birthdays (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    person_name VARCHAR(100) NOT NULL,
    birthdate DATE NOT NULL,
    relationship VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);

-- Notification Audit Logs
CREATE TABLE notification_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    birthday_id BIGINT REFERENCES birthdays(id),
    recipient_email VARCHAR(100) NOT NULL,
    person_name VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    message_id VARCHAR(100),
    error_message TEXT
);
```

---

## 9. Troubleshooting & FAQ

### Q1: Why does diagnosis return `invalid_grant`?
- **Cause**: The Refresh Token expired, was revoked, or was created in OAuth Playground without checking the "Use your own OAuth credentials" box.
- **Solution**: Follow [Step B](#step-b-generate-the-refresh-token-in-60-seconds) carefully, ensuring the Gear icon is configured with your own Client ID and Secret before authorizing.

### Q2: Why does diagnosis return `403 Access Not Configured`?
- **Cause**: The Gmail API is not enabled in your Google Cloud Project.
- **Solution**: Open Google Cloud Console > APIs & Services > Library > Search for "Gmail API" > Click **Enable**.

### Q3: Why does diagnosis return `403 Access Blocked: app has not completed verification`?
- **Cause**: Your app is in "Testing" mode and your personal email is not added as a test user.
- **Solution**: Go to Google Cloud Console > APIs & Services > OAuth consent screen > **Test users** > Add your Gmail address.

### Q4: Will my Refresh Token expire after 7 days?
- **Explanation**: In Google Cloud projects where the OAuth Consent Screen publishing status is set to **"Testing"**, refresh tokens expire after 7 days.
- **Solution**: In the Google Cloud Console under **OAuth consent screen**, click **"Publish App"** to set the publishing status to **Production**. Since the app only requests personal test usage, verification is not required for your own personal use.

---

*Documentation maintained by Antigravity Engineering.*
