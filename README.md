# NexInc — Multi-AI Chat Portal

Welcome to **NexInc**! This web app is a warm, soft, and friendly multi-AI chat assistant that combines several AI providers into a single, clean workspace.

---

## Supabase Setup

To get authentication working, follow these simple steps:

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a free account.
   - Create a new project (name it **NexInc** or anything you like!).

2. **Configure Authentication Providers**:
   - Inside your Supabase project dashboard, navigate to **Authentication** (in the left sidebar) > **Providers**.
   - **Email Provider**: Enable it.
   - **Google Provider**: Enable it. To configure Google sign-in:
     - You will need a Google Cloud project to get a client ID and client secret.
     - Go to the [Google Cloud Console](https://console.cloud.google.com/), create a project, and set up an OAuth Consent Screen and OAuth credentials (Web Application).
     - Copy the **Client ID** and **Client Secret** and paste them into the Supabase Google Provider settings.
     - Copy the **Redirect URI** provided by Supabase in the Google settings, and add it under "Authorized redirect URIs" in your Google Cloud OAuth credentials.

3. **Enable OTP Verification in Email Templates**:
   - In Supabase, go to **Authentication** > **Email Templates** > **Confirm signup**.
   - Make sure the template body uses the `{{ .Token }}` token (the 8-digit verification code) instead of the default `{{ .ConfirmationURL }}` link.
   - For example, you can write:
     ```text
     <h2>Confirm your signup</h2>
     <p>Please enter the following 8-digit verification code on the site:</p>
     <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">{{ .Token }}</p>
     ```
   - *Without this change, Supabase will email a clickable URL instead of a code, and our `/verify-otp` input page will fail to verify the user.*

4. **Get API Keys**:
   - In Supabase, go to **Project Settings** (gear icon) > **API**.
   - Copy the **Project URL** and the **anon public key**.

5. **Setup Environment Variables Locally**:
   - Copy the `.env.example` file in the root of this project and rename it to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
    - Open `.env.local` in your editor and paste your credentials:
      ```env
      NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key

      # AI Provider API Keys (Server-side)
      GROQ_API_KEY=your-groq-api-key
      OPENROUTER_API_KEY=your-openrouter-api-key
      NVIDIA_API_KEY=your-nvidia-api-key
      ```
    - **NVIDIA Build setup**: Sign up for free at [build.nvidia.com](https://build.nvidia.com), go to **API Keys** in the top navigation bar, click **Generate Key** (the generated key will start with `nvapi-`), and paste it as `NVIDIA_API_KEY` in `.env.local`.

---

## Step 2 — Setting up the Database

To configure your database tables, security policies, and automatic profile creation triggers:

1. **Open the SQL Editor**:
   - Log in to your [Supabase Dashboard](https://supabase.com).
   - Click on the **SQL Editor** icon in the left-hand sidebar (represented by a `SQL` page icon).
   - Click **New query** (or the **+ New Query** button).

2. **Run the Database Schema**:
   - Open the file [supabase/schema.sql](file:///d:/PROJECTS/CLAUDE/supabase/schema.sql) in this project repository.
   - Copy the entire contents of the file.
   - Paste the SQL script into the Supabase SQL Editor window.
   - Click **Run** (in the bottom right of the query window).

3. **Verify Execution**:
   - Confirm that the script completed successfully (you should see a *"Success. No rows returned"* or similar confirmation banner).
   - Click on the **Table Editor** icon in the left-hand sidebar (represented by a spreadsheet grid icon).
   - Check that the three tables—**`profiles`**, **`chat_sessions`**, and **`messages`**—now exist.
   - *No other action is required! The helper functions inside `lib/supabase/queries.js` are fully prepared for the application to utilize in the next step.*

---

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Production Build**:
   - To make sure everything compiles correctly for deployment on Vercel:
     ```bash
     npm run build
     ```

---

## Project Structure

- `app/` — Next.js App Router pages:
  - `page.js` — Welcome / landing page.
  - `login/page.js` — Log in page (handles credentials, Google sign-in, and redirects unverified users to verify-otp).
  - `signup/page.js` — Sign up page (handles name, validation, registration, and redirects to verify-otp).
  - `verify-otp/page.js` — OTP code verification page with 30s resend cooldown.
  - `forgot-password/page.js` — Password recovery trigger.
  - `reset-password/page.js` — Secure landing page to input new passwords.
  - `auth/callback/route.js` — Handles authentication redirect and session exchange.
  - `dashboard/page.js` — Protected welcome page placeholder.
  - `globals.css` — Custom Tailwind CSS v4 styling & theme setup.
  - `layout.js` — Loads Quicksand & Nunito fonts and handles metadata.
- `components/` — Shareable React components:
  - `LogoutButton.js` — Secure logout handler.
  - `OtpInput.js` — Reusable 8-digit OTP code entry.
  - `ThemeToggle.js` — Floating light/dark mode switch.
- `lib/supabase/` — Supabase utilities:
  - `client.js` — Client-side browser instance.
  - `server.js` — Server-side instance (Next.js 16 async cookie compatible).
  - `queries.js` — Database access query helpers.
- `proxy.js` — Intercepts requests to refresh access tokens and guard access to protected paths.
- `supabase/` — Database migration resources:
  - `schema.sql` — Schema definition file.
  - `add-vision-storage.sql` — Vision storage bucket setup SQL script.

---

## Storage Setup (Vision Support)

To allow image uploads and enable vision chat capabilities:

1. **Open the SQL Editor**:
   - Go to your [Supabase Dashboard](https://supabase.com).
   - Select your project.
   - Click the **SQL Editor** icon in the left-hand sidebar.
   
2. **Run the Vision Storage Configuration**:
   - Copy the contents of the file [supabase/add-vision-storage.sql](file:///d:/PROJECTS/CLAUDE/supabase/add-vision-storage.sql).
   - Paste the SQL script into the SQL Editor and click **Run**.
   
3. **Verify Bucket Creation**:
   - Navigate to **Storage** in the left-hand sidebar of your Supabase Dashboard.
   - Confirm that a new bucket named **`chat-uploads`** now exists and is marked **Public**.

---

## Step 4 — Payments Setup (Stripe Checkout & Subscriptions)

To enable subscription plans (Free vs Ultimate) and Stripe payment processing:

1. **Stripe Account Setup**:
   - Create a free developer account at [stripe.com](https://stripe.com) and keep your account in **Test Mode**.
   - Create two recurring **Products** with monthly and yearly pricing in your Stripe Dashboard under Product Catalog.
   - Copy the generated **Price IDs** (starting with `price_...`).
   - Retrieve your **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`) from developers settings.

2. **Configure Supabase Service Role Key**:
   - Navigate to **Project Settings** > **API** in your Supabase Dashboard.
   - Copy the **`service_role`** secret key (labeled *service_role* - this key bypasses all Row Level Security).
   - > [!WARNING]
     > The `SUPABASE_SERVICE_ROLE_KEY` is highly sensitive. It grants full admin access to your database. **NEVER** expose this key to client-side code, print it in logs, or commit it to Git.

3. **Update Local Environment variables**:
   - Open your `.env.local` file and paste the Stripe price IDs and secret keys:
     ```env
     STRIPE_SECRET_KEY=sk_test_your_secret_key
     STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
     STRIPE_PRICE_ID_MONTHLY=price_monthly_id
     STRIPE_PRICE_ID_YEARLY=price_yearly_id
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```

4. **Database Billing Migration**:
   - Run the migration SQL in [supabase/add-billing-fields.sql](file:///d:/PROJECTS/CLAUDE/supabase/add-billing-fields.sql) in your Supabase SQL Editor.
   - This adds the `stripe_customer_id`, `stripe_subscription_id`, and `billing_cycle` fields to the `profiles` table.

5. **Local Webhook Testing**:
   - Download and install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
   - Authenticate the CLI:
     ```bash
     stripe login
     ```
   - Start forwarding webhooks to your local development server:
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
   - Copy the printed **Webhook Signing Secret** (starts with `whsec_...`) and paste it as `STRIPE_WEBHOOK_SECRET` in your `.env.local` file:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
     ```
   - Keep the `stripe listen` terminal window running while testing local checkout events. Use Stripe's test credit card `4242 4242 4242 4242` to simulate successful subscription payments!
