# AI Orchestration Platform

## Overview

This is a production-ready enterprise AI orchestration platform that enables non-technical business users to create Skills, compose Agents from Skills, and orchestrate Workflows. The platform features a React frontend with TypeScript, an Express.js backend with TypeScript, and PostgreSQL with Drizzle ORM for data persistence. The system provides no-code skill creation, visual workflow building, enterprise connectors, RAG capabilities, and comprehensive audit trails.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: Radix UI primitives with custom styling for accessibility

### Backend Architecture
- **Runtime**: Node.js with Express.js framework in TypeScript
- **API Design**: RESTful endpoints with consistent error handling and logging middleware
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **File Structure**: Modular architecture with separate routes, storage abstraction, and utility modules

### Data Storage Solutions
- **Primary Database**: PostgreSQL for relational data storage
- **ORM**: Drizzle ORM with schema-first approach for type safety
- **Migrations**: Drizzle Kit for database schema migrations
- **Connection**: Neon serverless PostgreSQL for cloud deployment
- **Session Store**: PostgreSQL-backed session storage for user authentication

### Authentication and Authorization
- **Session-based Authentication**: Express sessions with secure cookie configuration
- **Role-based Access Control**: User roles (admin, user, viewer) with granular permissions
- **Credential Storage**: Encrypted storage for connector credentials using Fernet encryption
- **OAuth Integration**: Prepared infrastructure for enterprise SSO and connector OAuth flows

### External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI component primitives and Lucide React icons
- **LLM Integration**: Pluggable architecture supporting OpenAI, Azure OpenAI, and Anthropic
- **Vector Database**: Support for PGVector extension and external vector stores
- **Enterprise Connectors**: OAuth-based integrations for Salesforce, NetSuite, and email systems
- **Task Queue**: Redis-based async processing for workflow execution
- **File Processing**: Libraries for PDF, DOCX, and Excel document handling
- **Email Service**: SMTP integration for notification and automation workflows