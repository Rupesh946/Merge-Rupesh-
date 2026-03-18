# Merge - Developer Social Platform (Interview Guide)

This document is designed to help you explain the "Merge" project easily during an interview. It breaks down the complex technical concepts into simple, understandable terms.

## 1. The Big Picture: What is Merge?
Merge is a social network built specifically for software developers. Think of it like a mix between LinkedIn (for professional networking) and Twitter/X (for sharing quick updates and articles), but tailored for coders. Developers can showcase their projects, write blogs, share code snippets, and connect with each other.

## 2. The Tech Stack: What tools did you use and why?

### The Frontend (What the user sees)
*   **Next.js 15 (React):** We use Next.js because it allows us to do "Server-Side Rendering." In simple terms, instead of sending a blank page to the browser and letting the browser build it, the server builds the page first. This makes the website load much faster and is great for SEO (Search Engine Optimization) so projects can be found on Google.
*   **Tailwind CSS:** This is how we style the website. Instead of writing separate, bulky CSS files, Tailwind lets us style buttons and layouts using simple "utility classes" directly in our code. It makes development much faster and keeps the design consistent.
*   **shadcn/ui:** This gives us pre-built, accessible, and beautiful components (like buttons, dialogs, dropdowns) so we don't have to reinvent the wheel.

### The Backend (The brain behind the scenes)
*   **Node.js & Express.js:** This is the engine running on the server. Express is just a tool that helps us easily create "API endpoints" (the URLs that our frontend talks to when it needs data).
*   **NextAuth.js (Authentication):** This securely handles user logins. Instead of forcing users to create yet another password, we integrated **GitHub OAuth**. This means users can simply "Log in with GitHub," which makes perfect sense for a developer platform.

### The Database (Where we store everything)
*   **PostgreSQL (hosted on Neon):** This is a powerful, relational database. We chose it because social networks have highly connected data (Users have Posts, Posts have Comments, Users Follow other Users). Relational databases are perfect for this.
*   **Prisma (ORM):** Think of Prisma as an interpreter between our Node.js code and the PostgreSQL database. Instead of writing complex SQL queries by hand (which can be prone to errors), Prisma lets us write straightforward JavaScript/TypeScript code to talk to the database safely.

### The "Cool Factor" Features
*   **WebSockets (Socket.IO):** Normal websites require you to refresh the page to see new data. We use WebSockets to keep an open, continuous connection between the user and the server. This is how we achieve **real-time notifications** (e.g., when someone likes your post, you see it instantly without refreshing).
*   **Redis (Caching):** Every time someone opens the homepage, asking the database for all the projects takes time. Redis acts as a fast, temporary memory. We save the latest projects in Redis for a few minutes. So, when 100 people visit the site, we only ask the database once, and serve the other 99 people instantly from Redis.

## 3. The Data Flow: What happens when a user creates a project?
To explain the flow in an interview, use this step-by-step example:
1.  **User Action:** A user fills out the "New Project" form on the frontend and clicks "Submit".
2.  **API Call:** The Next.js frontend sends this data over the internet using an HTTP POST request to our Node.js/Express backend.
3.  **Validation & Security:** The backend checks if the user is logged in (using NextAuth session) and makes sure the submitted data is valid.
4.  **Database Save:** The backend tells Prisma to insert a new row in the `Project` table in our PostgreSQL database (containing the project's name, description, and tags).
5.  **Cache Update:** Since a new project was added, the backend tells Redis to clear its old cache. The next time someone requests the project feed, it will fetch the fresh list.
6.  **Real-time Event:** The backend uses Socket.IO to broadcast a "New Project" event to connected users, perhaps triggering a notification for users who follow the author.
7.  **Response:** The backend replies to the frontend with a "Success = 200 OK", and the frontend updates the page to show the newly created project.

## 4. The Database Design (Schema summary)
How things are connected under the hood:
*   **User:** Core model containing info like GitHub username, tech stack, followers/following (self-referencing relationship).
*   **Project:** Belongs to a User. Contains GitHub URLs, tags, and tracks likes/comments.
*   **Post:** For blogs or text updates. Similar to projects, belongs to a User.
*   **Notifications & Messages:** Tracks what needs to be shown to the user (e.g., someone followed them) and direct messages.

## 5. Why your architecture is strong (Key Interview Takeaways)
If asked "Why did you build it this way?":
*   *"I chose Next.js for its built-in SEO and performance benefits, which are crucial for a content-sharing platform where visibility matters."*
*   *"I implemented Redis caching because database queries are expensive, and caching heavily requested data like the project feed or trending tags drastically reduces server load and response times."*
*   *"I used real-time WebSockets to make the platform feel alive. In modern social apps, users expect instant feedback (likes, messages) without having to hit refresh."*
*   *"I picked PostgreSQL with Prisma because social data is deeply relational. Prisma provides type-safety, which means my code editor catches database errors before I even run the app."*
