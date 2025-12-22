# Weekend Planner

## Overview

A personalized weekend adventure discovery platform that helps users find and plan activities. Users can browse destinations, upload screenshots/PDFs to extract travel ideas using AI, and organize weekend plans. The app features a dark theme with a rust/orange accent color scheme.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state caching and mutations
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **File Uploads**: Uppy with AWS S3 integration for direct uploads via presigned URLs
- **Fonts**: Inter (body) and Outfit (display headings)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation schemas
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Build System**: Vite for frontend, esbuild for server bundling
- **Development**: Hot module replacement via Vite dev server proxied through Express

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables (places, screenshots, weekend plans, user preferences, conversations, messages)
- **Object Storage**: Google Cloud Storage integration for file uploads with presigned URL flow

### Key Data Models
- **Places**: Destination entries with details like distance, ratings, categories, nearby restaurants
- **Screenshots**: Uploaded images/PDFs with AI extraction status and results
- **Weekend Plans**: User-created plans linking to places with dates and status
- **Conversations/Messages**: Chat history for AI interactions

### API Structure
Routes are defined declaratively in `shared/routes.ts` using Zod schemas for type-safe request/response handling:
- `/api/places` - CRUD for destination entries
- `/api/plans` - Weekend plan management
- `/api/preferences` - User settings
- `/api/places/extract` - AI-powered place extraction from uploads
- `/api/conversations` - Chat functionality

## External Dependencies

### AI Services
- **OpenAI API**: Used for extracting place information from uploaded screenshots/PDFs and chat functionality
- **Configuration**: Requires `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- **Image Generation**: gpt-image-1 model for image generation capabilities

### Cloud Services
- **Google Cloud Storage**: Object storage for file uploads, accessed via presigned URLs through a local sidecar service at `127.0.0.1:1106`

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Migrations**: Drizzle Kit for schema migrations stored in `/migrations`

### Development Tools
- Replit-specific plugins for development (cartographer, dev-banner, runtime-error-modal)