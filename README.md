# Scire | Intelligent Viva Platform

**Scire** is an enterprise-grade, multi-tenant evaluation platform that automates oral examinations (vivas) using advanced artificial intelligence. Designed for educational institutions and corporate training environments, Scire delivers unbiased, scalable, and secure assessments through a high-performance frontend interface.

[**Request Access**](https://scire.in) | [**System Architecture**](#system-architecture) | [**Source Code**](https://github.com/anand-mukul/Scire)

---

## Platform Overview

Scire transforms the traditional oral assessment model by deploying autonomous AI agents capable of conducting human-like interviews. The platform guarantees strict multi-tenancy, ensuring data isolation and customized experiences for every organization.

- **Domain**: [scire.in](https://scire.in)
- **Status**: Production / Enterprise Ready
- **Security**: SOC 2 Compliance Ready (Architecture Design)

---

## System Architecture

The frontend operates as a sophisticated, real-time client designed for high availability and low latency. It interfaces with the **Scire Core** (FastAPI) to manage complex session states and secure data transmission.

### 1. Enterprise Multi-Tenancy
The architecture enforces strict data isolation at the application layer.
-   **Tenant Resolution**: Dynamic tenant identification via subdomain (`tenant.scire.in`) or custom domain mapping.
-   **JWT Claims-Based Access**: interactions are secured using JSON Web Tokens (JWT) with embedded `tenant_id` and `role` scopes, preventing horizontal privilege escalation.
-   **Context-Aware Middleware**: Next.js Middleware automatically enforces tenant contexts on all routes, ensuring users interact only with authorized resources.

### 2. The Viva Engine (Real-Time Audio Pipeline)
The core examination experience utilizes a custom-built low-latency audio pipeline.
-   **WebSocket Telemetry**: Persistent, bi-directional connections (`wss://api.scire.in/ws/session`) manage the session lifecycle.
-   **Binary Stream Processing**: Raw audio is captured (PCM 16-bit, 16kHz) and streamed as binary blobs for immediate server-side Voice Activity Detection (VAD) and ASR processing.
-   **Finite State Machine (FSM)**: The client implements a robust FSM to synchronize UI states (Listening, Thinking, Speaking) with the backend's cognitive cycle, ensuring sub-500ms interaction latency.

### 3. Integrated Payment & Subscription
-   **Server-Side Pricing**: Tamper-proof subscription management.
-   **Quota Enforcement**: Real-time validation of exam and user limits based on active subscription tiers (Free, Pro, Enterprise).
-   **Secure Handshake**: Razorpay integration with HMAC-SHA256 signature verification for subscription upgrades.

---

## Technical Specifications

### Core Framework
-   **Next.js 16**: Utilizing React Server Components (RSC) for optimized initial load and SEO.
-   **TypeScript**: Strictly typed infrastructure for maintainability and scale.
-   **TanStack Query**: Enterprise-grade server state management and caching strategies.

### Interface & Experience
-   **Tailwind CSS v4**: High-performance, compile-time styling engine.
-   **Shadcn UI**: Accessible, WAI-ARIA compliant component architecture.
-   **GSAP & Framer Motion**: GPU-accelerated visualizations for the AI Agent interface.

### Client-Side Telemetry
-   **Focus Integrity**: Heuristic monitoring of tab switching and window focus loss.
-   **Environmental Checks**: Real-time analysis of ambient noise levels and audio hardware integrity.

---

## Project Structure

The codebase follows a modular, domain-driven structure optimized for scalability.

```text
scire-frontend/
├── src/
│   ├── app/                # App Router (Multi-tenant Routing)
│   │   ├── (auth)/         # Secure Authentication Flows
│   │   ├── (dashboard)/    # Role-Based Workspaces
│   │   └── api/            # Edge API Handlers
│   ├── components/
│   │   ├── ui/             # Design System Primitives
│   │   └── viva/           # Viva Engine Components
│   ├── lib/                # Shared Utilities & Clients
│   └── store/              # Global State (Zustand)
└── public/                 # Static Assets
```

---

## Access & Licensing

Scire is available as a cloud-hosted SaaS service.

-   **Cloud Access**: [scire.in](https://scire.in)
-   **Enterprise Inquiries**: Contact our sales team for on-premise deployment options.
-   **Copyright**: © 2026 Scire. All rights reserved.
