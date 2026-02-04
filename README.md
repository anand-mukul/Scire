# Scire Frontend

<div align="center">
  <img src="public/logo.png" alt="Scire Logo" width="128" height="128" style="border-radius: 20%;" />
  <h1>Scire: AI-Powered Intelligent Viva System</h1>
  <p>
    A Next.js 16 application for conducting automated, AI-driven viva assessments.
    <br />
    <a href="#getting-started"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://scire.in">View Demo</a>
    ·
    <a href="https://github.com/scira/frontend/issues">Report Bug</a>
    ·
    <a href="https://github.com/scira/frontend/issues">Request Feature</a>
  </p>
</div>

## 🚀 Overview

Scire is an advanced educational platform designed to automate oral examinations (vivas). It leverages AI to conduct realistic, interactive interview sessions with students, assess their responses in real-time, and provide comprehensive feedback to instructors.

This repository contains the **Frontend** application, built with modern web technologies to ensure a seamless, high-performance, and accessible user experience.

## ✨ Key Features

- **🎭 Role-Based Dashboards**: Tailored experiences for Students, Instructors, and Administrators.
- **🤖 Artificial Intelligence Orb**: A visual, interactive AI agent that conducts the viva, complete with real-time audio visualization.
- **🎙️ Real-time Audio Processing**: Low-latency audio streaming for natural conversation flow.
- **🛡️ Exam Integrity**: Automated proctoring features including face detection and focus monitoring.
- **📊 Comprehensive Analytics**: Detailed performance reports, confidence scores, and transcript history.
- **🎨 Modern UI/UX**: Valid, accessible, and responsive design using Shadcn UI and Tailwind CSS v4.

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 16](https://nextjs.org/)**: React framework with Turbopack for lightning-fast builds.
- **[React 19](https://react.dev/)**: The library for web and native user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)**: Typed superset of JavaScript for code safety.

### Styling & Animation
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Utility-first CSS framework.
- **[Shadcn UI](https://ui.shadcn.com/)**: Reusable components built with Radix UI.
- **[Framer Motion](https://www.framer.com/motion/)**: Production-ready motion library for React.
- **[GSAP](https://gsap.com/)**: High-performance animations for the AI Orb.

### State & Data Management
- **[Zustand](https://zustand-demo.pmnd.rs/)**: Small, fast, and scalable bearbones state management.
- **[TanStack Query](https://tanstack.com/query/latest)**: Powerful asynchronous state management.
- **[Zod](https://zod.dev/)**: TypeScript-first schema declaration and validation.
- **[React Hook Form](https://react-hook-form.com/)**: Performant, flexible and extensible forms.

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher

## 📥 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/scira/frontend.git
    cd scira-frontend
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory. You can start by copying the example (if available) or ensuring the following variables are set:

    ```env
    # .env
    NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws/session
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

    Open [https://localhost:3000](https://localhost:3000) in your browser.

## 📜 Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with Turbopack. |
| `npm run build` | Builds the application for production. |
| `npm run start` | Runs the built production application. |
| `npm run lint` | Runs ESLint to identify code issues. |
| `npm run lint:fix` | Automatically fixes fixable ESLint errors. |

## 📂 Project Structure

```text
scira-frontend/
├── public/              # Static assets (images, fonts)
├── src/
│   ├── app/             # Next.js App Router pages and layouts
│   │   ├── (dashboard)/ # Authenticated dashboard routes
│   │   └── page.tsx     # Landing page
│   ├── components/      # Reusable React components
│   │   ├── layout/      # Sidebar, Header, etc.
│   │   ├── ui/          # Shadcn UI primitives
│   │   ├── visuals/     # Complex visual components (AIOrb, Backgrounds)
│   │   └── viva/        # Viva orchestration components (Phases, Player)
│   ├── hooks/           # Custom React hooks (useAudioStream, useAuth)
│   ├── lib/             # Utilities, API clients, Stores
│   └── types/           # TypeScript type definitions
├── .env                 # Environment variables
├── next.config.ts       # Next.js configuration
├── package.json         # Dependencies and scripts
└── tailwind.config.ts   # Tailwind CSS configuration
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ by the Scire Team</p>
</div>
