# Deployment Checklist

Great news! The application now builds successfully locally. Here is your checklist for a smooth Vercel deployment.

## 1. Environment Variables
Go to your Vercel Project Settings -> Environment Variables and add the following:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Copy from your `.env` file (the Neon DB URL) |
| `JWT_SECRET` | `...` | Copy from your `.env` file (or generate a new one) |
| `NEXT_PUBLIC_API_URL` | `/api` | Use relative path for internal API to avoid CORS issues, or use full URL `https://your-app.vercel.app/api` |

## 2. Build Settings
Vercel should automatically detect Next.js.
-   **Build Command**: `next build` (Default)
-   **Output Directory**: `.next` (Default)
-   **Install Command**: `npm install` (Default)

> [!NOTE]
> If Vercel fails on linting errors, you can override the **Build Command** to:
> `next build --no-lint`
> However, our local `npm run build` passed, so this shouldn't be necessary unless Vercel enforces stricter rules.

## 3. Deployment Steps
1.  Push the latest changes to your `feature/rupesh-dev` branch (I will do this for you now).
2.  Go to Vercel.
3.  Import the repository `Rupesh946/Merge-Rupesh-`.
4.  Select the `feature/rupesh-dev` branch (or create the project and then change the production branch to `feature/rupesh-dev` in settings, or merge `feature/rupesh-dev` to `main`).
    -   *Recommendation*: Develop on `feature/rupesh-dev`, and when stable, create a Pull Request to `main`.
5.  Click **Deploy**.

## 4. Post-Deployment Verification
-   [ ] **Check Home Page**: Does it load without errors?
-   [ ] **Check Profile**: Go to your profile page. Does it load?
-   [ ] **Check Projects**: Can you view projects?
-   [ ] **Check Auth**: Can you access protected routes? (Since we are essentially frontend-only with mock/client-side logic for now, this should work as long as `localStorage` logic holds).

## 5. Known Issues (Non-Blocking)
-   **Linting Warnings**: There are ~108 stylistic issues flagged by `biome check`. These do not break the build but should be addressed in future cleanups.
