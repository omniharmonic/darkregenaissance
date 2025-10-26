# Dark Regenaissance: Technical Architecture Document
## Version 1.0 - Budget-Optimized MVP

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [AI Integration Layer](#7-ai-integration-layer)
8. [Data Layer](#8-data-layer)
9. [External Integrations](#9-external-integrations)
10. [Security Architecture](#10-security-architecture)
11. [Performance & Optimization](#11-performance--optimization)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Scaling Strategy](#14-scaling-strategy)
15. [Development Workflow](#15-development-workflow)
16. [API Specifications](#16-api-specifications)
17. [File Structure](#17-file-structure)
18. [Configuration Management](#18-configuration-management)
19. [Testing Strategy](#19-testing-strategy)
20. [Appendices](#20-appendices)

---

## 1. System Overview

### 1.1 Purpose

Dark Regenaissance is a multi-platform AI agent that embodies lunarpunk/regenerative consciousness through intelligent conversation. The system provides:

- **Web Interface**: 3D immersive chat experience at darkregenasence.xyz
- **Twitter Presence**: Manual posting and replies via @darkregenaI
- **Telegram Bot**: Full-featured conversational bot for DMs and groups

### 1.2 Design Philosophy

**Cost-First Architecture**: Every technical decision optimized for free tier hosting while maintaining production quality.

**Key Constraints**:
- Vercel Free: 100GB bandwidth, 100 hours compute/month
- Twitter Free: 1,500 reads, 50 writes/month
- Gemini API: Pay-per-use (~$20-40/month target)
- No external database or cache in MVP

**Core Principles**:
1. **Stateless First**: Minimize server state, leverage browser storage
2. **Edge-Optimized**: Use Vercel Edge Functions where possible
3. **File-Based**: JSON files for persistence until scale demands database
4. **Aggressive Caching**: Browser + in-memory caching to reduce API calls
5. **Progressive Enhancement**: Core functionality works without JavaScript

### 1.3 System Boundaries

**In Scope**:
- Web chat interface with 3D visualization
- Gemini-powered conversational AI
- Twitter manual posting infrastructure
- Telegram bot (DM + group modes)
- File-based conversation storage
- In-memory caching
- Basic analytics

**Out of Scope (Phase 2+)**:
- Twitter automated monitoring
- PostgreSQL database
- Redis caching
- Fine-tuned AI models
- Audio/voice interface
- Admin dashboard
- Multi-language support

### 1.4 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                 │
│  (Browser, Twitter, Telegram)                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   CDN Layer (Vercel Edge)                    │
│  • Static Assets (3D models, textures, fonts)               │
│  • HTML/CSS/JS Bundles                                      │
│  • Edge Caching (max-age headers)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Application Layer (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web UI     │  │   API Routes │  │   Telegram   │     │
│  │ (React/R3F)  │  │  (Serverless)│  │   Bot Server │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Integration Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Gemini    │  │   Twitter    │  │   Telegram   │     │
│  │     API      │  │     API      │  │     API      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Local JSON  │  │  In-Memory   │  │   Browser    │     │
│  │    Files     │  │    Cache     │  │   Storage    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Principles

### 2.1 Design Patterns

**Serverless-First**
- All API endpoints as Vercel Serverless Functions
- No long-running processes except Telegram bot
- Stateless request handling
- Cold start optimization (<1s)

**Repository Pattern**
- Abstract data access behind interfaces
- Easy migration from files → Supabase later
- Consistent API across storage backends

```typescript
interface ConversationRepository {
  save(conv: Conversation): Promise<void>;
  load(id: string): Promise<Conversation | null>;
  list(filters: Filter): Promise<Conversation[]>;
}

class FileConversationRepository implements ConversationRepository {
  // File-based implementation
}

class SupabaseConversationRepository implements ConversationRepository {
  // Future database implementation
}
```

**Strategy Pattern for AI**
- Pluggable AI providers (Gemini, Claude, etc.)
- Consistent interface for generation
- Easy A/B testing of providers

```typescript
interface AIProvider {
  generate(prompt: string, context: Message[]): AsyncIterable<string>;
  estimateCost(tokens: number): number;
}

class GeminiProvider implements AIProvider { }
class ClaudeProvider implements AIProvider { }
```

**Observer Pattern for Events**
- Emit events for conversation milestones
- Pluggable handlers (analytics, logging, etc.)
- Loose coupling between components

### 2.2 Core Architectural Decisions

**ADR-001: File-Based Storage for MVP**
- **Context**: Need persistence without database costs
- **Decision**: Use JSON files in `/data` directory, committed to git
- **Consequences**: 
  - ✅ Zero cost
  - ✅ Simple to implement
  - ✅ Version controlled
  - ❌ Not suitable for high concurrency
  - ❌ Manual backups needed
- **Migration Path**: Switch to Supabase when >1000 conversations

**ADR-002: In-Memory Caching Only**
- **Context**: Redis/Upstash costs $10/month minimum
- **Decision**: Use Node.js Map with TTL for caching
- **Consequences**:
  - ✅ Zero cost
  - ✅ Simple implementation
  - ❌ Cache clears on function cold start
  - ❌ No shared cache across function instances
- **Mitigation**: Browser caching + aggressive response caching

**ADR-003: Prompt Engineering vs Fine-Tuning**
- **Context**: Fine-tuning costs $200-500 one-time
- **Decision**: Use comprehensive system prompts (4000+ tokens)
- **Consequences**:
  - ✅ Zero upfront cost
  - ✅ Rapid iteration
  - ❌ Higher per-request tokens
  - ❌ May hit quality ceiling
- **Reassessment**: After 3 months, evaluate if voice quality plateaus

**ADR-004: Manual Twitter vs Automated**
- **Context**: Twitter Basic tier costs $100/month
- **Decision**: Manual posting workflow for MVP
- **Consequences**:
  - ✅ Zero cost
  - ✅ Higher quality curation
  - ❌ More time investment
  - ❌ Can't respond in real-time
- **Trigger**: Upgrade when manual becomes daily burden

**ADR-005: Three.js Direct vs Game Engine**
- **Context**: Need 3D visualization on web
- **Decision**: Three.js with React Three Fiber (not Unity/Unreal export)
- **Consequences**:
  - ✅ Smaller bundle size
  - ✅ Better web performance
  - ✅ Easier customization
  - ❌ More code to write

### 2.3 Non-Functional Requirements

**Performance**:
- Web page load: <3s (including 3D scene)
- API response time: <2s p95
- 3D scene: 60fps desktop, 30fps mobile
- Time to first byte: <500ms

**Reliability**:
- Uptime: 99%+ (Vercel SLA)
- Error rate: <1% of requests
- Graceful degradation on API failures

**Scalability**:
- Handle 1000 concurrent web users
- 10k conversations/month
- 100 Telegram groups
- Linear cost scaling

**Security**:
- No user PII storage
- API keys in environment variables
- Rate limiting per IP/user
- HTTPS only

**Maintainability**:
- TypeScript for type safety
- <300 lines per file
- Comprehensive inline documentation
- 80%+ test coverage (Phase 2)

---

## 3. Technology Stack

### 3.1 Frontend Stack

```yaml
Core Framework:
  - Next.js 14.2.x (App Router)
  - React 18.3.x
  - TypeScript 5.3.x

3D Graphics:
  - Three.js 0.160.x
  - @react-three/fiber 8.15.x
  - @react-three/drei 9.100.x

Styling:
  - Tailwind CSS 3.4.x
  - PostCSS 8.x
  - CSS Modules (for terminal)

State Management:
  - React Hooks (useState, useContext)
  - No external state library needed

Build Tools:
  - Webpack 5 (via Next.js)
  - SWC compiler (Next.js default)
  - PostCSS for CSS processing
```

### 3.2 Backend Stack

```yaml
Runtime:
  - Node.js 20.x LTS
  - Serverless Functions (Vercel)

API Framework:
  - Next.js API Routes
  - Edge Runtime where possible

AI Integration:
  - @google/generative-ai 0.12.x
  - @anthropic-ai/sdk (optional fallback)

Social APIs:
  - twitter-api-v2 1.17.x
  - node-telegram-bot-api 0.64.x

Utilities:
  - crypto (Node.js built-in for hashing)
  - fs/promises (for file I/O)
  - zod (for validation)
```

### 3.3 DevOps & Infrastructure

```yaml
Hosting:
  - Vercel (frontend + serverless functions)
  - Railway/Render (Telegram bot - if needed)

Domain:
  - Namecheap/Cloudflare (darkregenasence.xyz)

Version Control:
  - Git
  - GitHub (private repo)

CI/CD:
  - Vercel Git Integration (auto-deploy on push)
  - GitHub Actions (for backups)

Monitoring:
  - Vercel Analytics (free tier)
  - Sentry (free 5k events/month)
  - Console logging

Security:
  - Vercel environment variables
  - git-crypt (for sensitive data in repo)
```

### 3.4 Development Tools

```yaml
Code Quality:
  - ESLint 8.x (Next.js config)
  - Prettier 3.2.x
  - Husky (git hooks)

Type Checking:
  - TypeScript strict mode
  - @types/node, @types/react

Package Management:
  - npm 10.x (prefer over yarn/pnpm for simplicity)

IDE:
  - VSCode recommended
  - Extensions: ESLint, Prettier, Tailwind IntelliSense
```

### 3.5 Third-Party Services

| Service | Tier | Purpose | Cost |
|---------|------|---------|------|
| Vercel | Free | Hosting + serverless | $0 |
| Google Gemini | Pay-as-go | AI generation | ~$20-40/mo |
| Twitter API | Free | Social posting | $0 |
| Telegram Bot API | Free | Bot hosting | $0 |
| Namecheap | Domain | darkregenasence.xyz | ~$12/year |
| Sentry | Free | Error tracking | $0 |
| Railway | Free | Telegram bot hosting (optional) | $0 |

---

## 4. System Architecture

### 4.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │                 Pages                               │    │
│  │  • app/page.tsx (Landing + 3D + Terminal)          │    │
│  │  • app/admin/page.tsx (Tweet composer)             │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │               Components                            │    │
│  │  • Scene3D (Three.js canvas)                       │    │
│  │    - MycelialNetwork.tsx                           │    │
│  │    - ForestTrees.tsx                               │    │
│  │    - GroundPlane.tsx                               │    │
│  │  • Terminal (Chat UI)                              │    │
│  │    - MessageList.tsx                               │    │
│  │    - InputBar.tsx                                  │    │
│  │  • AdminPanel                                      │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │                Hooks                                │    │
│  │  • useChat() - Manage conversation state           │    │
│  │  • use3DScene() - Three.js lifecycle               │    │
│  │  • useStreamingResponse() - Handle AI streaming    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Layer (Serverless)                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Routes                                 │    │
│  │  • POST /api/chat - Main conversation endpoint     │    │
│  │  • POST /api/admin/tweet - Post tweet              │    │
│  │  • POST /api/admin/reply - Reply to tweet          │    │
│  │  • GET /api/insights/random - Get wisdom quote     │    │
│  │  • POST /api/telegram/webhook - Telegram updates   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • AIService - Handle AI generation                │    │
│  │  • ConversationService - Manage conversations      │    │
│  │  • TwitterService - Post/reply tweets              │    │
│  │  • TelegramService - Bot logic                     │    │
│  │  • CacheService - In-memory caching                │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • ConversationRepository - File I/O               │    │
│  │  • InsightRepository - Curated wisdom              │    │
│  │  • UsageRepository - Track API usage               │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │  File System (./data/)                             │    │
│  │    conversations/                                  │    │
│  │      web/[conversationId].json                     │    │
│  │      telegram/[chatId].json                        │    │
│  │    tweets/                                         │    │
│  │      posted.json                                   │    │
│  │      usage.json                                    │    │
│  │    insights/                                       │    │
│  │      curated.json                                  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Diagrams

#### 4.2.1 Web Chat Flow

```
┌──────┐     1. User Types      ┌────────────┐
│      │ ───────────────────────>│            │
│ User │                         │  Browser   │
│      │<───────────────────────│            │
└──────┘     8. Display Response└────────────┘
                                      │
                                      │ 2. POST /api/chat
                                      │    {message, conversationId}
                                      ▼
                              ┌────────────────┐
                              │   API Route    │
                              │  (Serverless)  │
                              └────────────────┘
                                      │
                         ┌────────────┼────────────┐
                         │            │            │
                    3. Check      4. Load      5. Generate
                      Cache       History     Response
                         │            │            │
                         ▼            ▼            ▼
                  ┌──────────┐  ┌──────────┐  ┌──────────┐
                  │  Cache   │  │   File   │  │  Gemini  │
                  │ Service  │  │  System  │  │   API    │
                  └──────────┘  └──────────┘  └──────────┘
                         │            │            │
                         └────────────┼────────────┘
                                      │
                                 6. Stream chunks
                                      │
                                      ▼
                              ┌────────────────┐
                              │  Response      │
                              │  Stream        │
                              └────────────────┘
                                      │
                                 7. Save to file
                                      ▼
                              ┌────────────────┐
                              │  File System   │
                              └────────────────┘
```

#### 4.2.2 Twitter Posting Flow

```
┌──────┐     1. Draft Tweet    ┌────────────┐
│      │ ───────────────────────>│            │
│Admin │                         │  Admin UI  │
│      │<───────────────────────│            │
└──────┘     5. Confirm Posted  └────────────┘
                                      │
                                      │ 2. POST /api/admin/tweet
                                      │    {text}
                                      ▼
                              ┌────────────────┐
                              │   API Route    │
                              └────────────────┘
                                      │
                                      │ 3. Validate & Post
                                      ▼
                              ┌────────────────┐
                              │    Twitter     │
                              │     API        │
                              └────────────────┘
                                      │
                                      │ 4. Log tweet & usage
                                      ▼
                              ┌────────────────┐
                              │  File System   │
                              │  (tweets/)     │
                              └────────────────┘
```

#### 4.2.3 Telegram Bot Flow

```
┌──────┐     1. Send Message    ┌────────────┐
│      │ ───────────────────────>│            │
│ User │                         │  Telegram  │
│      │<───────────────────────│            │
└──────┘     6. Receive Response └────────────┘
                                      │
                                      │ 2. Webhook / Polling
                                      ▼
                              ┌────────────────┐
                              │   Bot Server   │
                              │  (Vercel Cron  │
                              │   or Railway)  │
                              └────────────────┘
                                      │
                         ┌────────────┼────────────┐
                         │            │            │
                    3. Check      4. Load      5. Generate
                     Should       Context     Response
                    Respond
                         │            │            │
                         ▼            ▼            ▼
                  ┌──────────┐  ┌──────────┐  ┌──────────┐
                  │  Filter  │  │   File   │  │  Gemini  │
                  │  Logic   │  │  System  │  │   API    │
                  └──────────┘  └──────────┘  └──────────┘
```

### 4.3 Sequence Diagrams

#### 4.3.1 New Conversation Sequence

```sequence
User->Browser: Type message
Browser->API: POST /api/chat {message}
API->ConvRepo: load(conversationId)
ConvRepo-->API: null (new conversation)
API->AIService: generate(message, [])
AIService->Gemini: streamGenerateContent()
Gemini-->AIService: chunk stream
AIService-->API: chunk stream
API-->Browser: SSE stream
Browser->UI: Display character-by-character
API->ConvRepo: save(conversation)
ConvRepo->FileSystem: write JSON
```

#### 4.3.2 Cached Response Sequence

```sequence
User->Browser: Type "what is regeneration?"
Browser->API: POST /api/chat
API->CacheService: get(hash(message))
CacheService-->API: cached response
API-->Browser: immediate response
Browser->UI: Display (fast!)
Note: No Gemini call, no cost
```

---

## 5. Frontend Architecture

### 5.1 Application Structure

```
app/
├── layout.tsx              # Root layout (fonts, metadata)
├── page.tsx                # Landing page (3D + Terminal)
├── globals.css             # Global styles (Tailwind imports)
├── admin/
│   └── page.tsx            # Tweet composer (protected)
└── api/                    # API routes (see section 6)
```

### 5.2 Component Architecture

```
components/
├── Scene3D/
│   ├── index.tsx           # Main Canvas wrapper
│   ├── MycelialNetwork.tsx # Glowing underground network
│   ├── ForestTrees.tsx     # Wireframe trees
│   ├── GroundPlane.tsx     # Semi-transparent ground
│   ├── Camera.tsx          # Camera controls
│   ├── Lights.tsx          # Scene lighting
│   └── shaders/
│       ├── myceliumGlow.glsl
│       └── treePulse.glsl
│
├── Terminal/
│   ├── index.tsx           # Terminal container
│   ├── MessageList.tsx     # Scrollable message display
│   ├── Message.tsx         # Single message component
│   ├── InputBar.tsx        # Input field with submit
│   ├── TypewriterText.tsx  # Typewriter effect for AI
│   └── terminal.module.css # Terminal-specific styles
│
├── Admin/
│   ├── TweetComposer.tsx   # Draft & post tweets
│   ├── ReplyComposer.tsx   # Reply to tweets
│   └── UsageDisplay.tsx    # Show API usage stats
│
└── Layout/
    ├── Header.tsx          # (minimal/none for immersive experience)
    ├── Footer.tsx          # Social links
    └── LoadingScreen.tsx   # Initial load state
```

### 5.3 State Management

**Global State**: None needed (minimal app state)

**Component State**:
```typescript
// hooks/useChat.ts
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => 
    sessionStorage.getItem('convId') || crypto.randomUUID()
  );
  
  const sendMessage = async (text: string) => {
    setIsLoading(true);
    
    // Optimistic update
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId })
      });
      
      // Stream response
      const reader = response.body!.getReader();
      let aiMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, aiMessage]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        aiMessage.content += chunk;
        setMessages(prev => [...prev.slice(0, -1), { ...aiMessage }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };
  
  return { messages, isLoading, sendMessage };
}
```

**Local Storage Strategy**:
```typescript
// Store conversation ID only
sessionStorage.setItem('convId', conversationId);

// Don't store messages (privacy + size limits)
// Server loads history from files on each request
```

### 5.4 Three.js Scene Architecture

**Scene Graph**:
```
<Canvas>
  <PerspectiveCamera position={[0, 5, 15]} />
  <fog color="#0a0a12" near={10} far={50} />
  
  <Suspense fallback={<LoadingScreen />}>
    <Environment preset="night" />
    
    <GroundPlane position={[0, -0.5, 0]} />
    <MycelialNetwork position={[0, -0.5, 0]} />
    <ForestTrees count={20} spread={40} />
    
    <ambientLight intensity={0.1} />
    <pointLight position={[0, 10, 0]} intensity={0.3} color="#2d5f3f" />
  </Suspense>
  
  <OrbitControls 
    enablePan={false}
    enableZoom={false}
    autoRotate
    autoRotateSpeed={0.3}
  />
</Canvas>
```

**Performance Optimizations**:
```typescript
// components/Scene3D/ForestTrees.tsx
import { useMemo } from 'react';
import { InstancedMesh } from 'three';

export function ForestTrees({ count = 20, spread = 40 }) {
  // Instanced rendering (single draw call for all trees)
  const { positions, scales } = useMemo(() => {
    const positions = [];
    const scales = [];
    
    for (let i = 0; i < count; i++) {
      positions.push(
        (Math.random() - 0.5) * spread,
        0,
        (Math.random() - 0.5) * spread
      );
      scales.push(0.8 + Math.random() * 0.4);
    }
    
    return { positions, scales };
  }, [count, spread]);
  
  return (
    <instancedMesh args={[null, null, count]}>
      <cylinderGeometry args={[0.1, 0.1, 5, 8]} />
      <meshBasicMaterial 
        color="#1a2b1a" 
        wireframe 
        transparent 
        opacity={0.6} 
      />
      {positions.map((pos, i) => (
        <Instance key={i} position={pos} scale={scales[i]} />
      ))}
    </instancedMesh>
  );
}
```

**Shader Implementation**:
```glsl
// components/Scene3D/shaders/myceliumGlow.glsl
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying vec2 vUv;

void main() {
  // Traveling pulse effect
  float pulse = sin(uTime * 2.0 + vUv.x * 10.0) * 0.5 + 0.5;
  vec3 color = mix(uColor1, uColor2, pulse);
  
  float alpha = pulse * 0.8 + 0.2;
  gl_FragColor = vec4(color, alpha);
}
```

### 5.5 Responsive Design Strategy

**Breakpoints**:
```css
/* tailwind.config.js */
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
    }
  }
}
```

**Mobile Optimizations**:
```typescript
// Detect mobile and adjust 3D quality
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

<Canvas dpr={isMobile ? 1 : [1, 2]}>
  <Scene quality={isMobile ? 'low' : 'high'} />
</Canvas>

// Reduce tree count on mobile
<ForestTrees count={isMobile ? 10 : 20} />
```

**Terminal Responsive Layout**:
```css
/* terminal.module.css */
.terminal {
  width: 90vw;
  max-width: 600px;
  height: 60vh;
  max-height: 500px;
}

@media (max-width: 640px) {
  .terminal {
    width: 95vw;
    height: 70vh;
    font-size: 12px; /* Smaller text on mobile */
  }
}
```

### 5.6 Accessibility Considerations

```tsx
// Terminal component with ARIA labels
<div 
  role="log" 
  aria-live="polite" 
  aria-label="Conversation with Dark Regenaissance"
>
  <MessageList messages={messages} />
</div>

<form 
  onSubmit={handleSubmit}
  aria-label="Send message"
>
  <input
    type="text"
    aria-label="Message input"
    placeholder="speak..."
    autoComplete="off"
  />
  <button type="submit" aria-label="Send message">
    <span aria-hidden="true">↵</span>
  </button>
</form>

// Skip to content for screen readers
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

---

## 6. Backend Architecture

### 6.1 API Route Structure

```
app/api/
├── chat/
│   └── route.ts            # POST - Main conversation endpoint
├── admin/
│   ├── tweet/
│   │   └── route.ts        # POST - Post tweet
│   └── reply/
│       └── route.ts        # POST - Reply to tweet
├── insights/
│   └── random/
│       └── route.ts        # GET - Random wisdom quote
└── telegram/
    └── webhook/
        └── route.ts        # POST - Telegram webhook handler
```

### 6.2 Service Layer Architecture

```
lib/
├── services/
│   ├── ai.service.ts       # AI generation logic
│   ├── conversation.service.ts
│   ├── twitter.service.ts
│   ├── telegram.service.ts
│   └── cache.service.ts
├── repositories/
│   ├── conversation.repository.ts
│   ├── insight.repository.ts
│   └── usage.repository.ts
├── ai/
│   ├── gemini.ts           # Gemini client
│   ├── prompts.ts          # System prompts
│   └── providers/
│       ├── base.ts         # AIProvider interface
│       └── gemini.provider.ts
├── twitter/
│   ├── client.ts           # Twitter API wrapper
│   └── usage.ts            # Track API usage
├── telegram/
│   ├── bot.ts              # Bot instance
│   └── handlers.ts         # Command handlers
└── utils/
    ├── hash.ts             # Hashing for cache keys
    ├── logger.ts           # Logging utilities
    └── validation.ts       # Input validation
```

### 6.3 Core Services Implementation

#### 6.3.1 AI Service

```typescript
// lib/services/ai.service.ts
import { GeminiProvider } from '@/lib/ai/providers/gemini.provider';
import { Message } from '@/types';

export class AIService {
  private provider: GeminiProvider;
  
  constructor() {
    this.provider = new GeminiProvider();
  }
  
  async generateResponse(
    userMessage: string,
    conversationHistory: Message[]
  ): Promise<AsyncIterable<string>> {
    // Build context window (last 10 messages)
    const context = conversationHistory.slice(-10);
    
    // Generate with streaming
    return this.provider.generate(userMessage, context);
  }
  
  async estimateCost(conversationHistory: Message[]): Promise<number> {
    // Rough token estimation
    const totalChars = conversationHistory.reduce(
      (sum, msg) => sum + msg.content.length, 
      0
    );
    const estimatedTokens = Math.ceil(totalChars / 4);
    
    return this.provider.estimateCost(estimatedTokens);
  }
}
```

#### 6.3.2 Conversation Service

```typescript
// lib/services/conversation.service.ts
import { ConversationRepository } from '@/lib/repositories/conversation.repository';
import { Conversation, Message } from '@/types';

export class ConversationService {
  private repo: ConversationRepository;
  
  constructor() {
    this.repo = new ConversationRepository();
  }
  
  async getOrCreate(
    conversationId: string, 
    platform: string
  ): Promise<Conversation> {
    let conversation = await this.repo.load(platform, conversationId);
    
    if (!conversation) {
      conversation = {
        id: conversationId,
        platform,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    return conversation;
  }
  
  async addMessage(
    conversationId: string,
    platform: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const conversation = await this.getOrCreate(conversationId, platform);
    
    conversation.messages.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    
    conversation.updatedAt = new Date().toISOString();
    
    await this.repo.save(platform, conversation);
  }
  
  async getRecentConversations(
    platform: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    return this.repo.list(platform, limit);
  }
}
```

#### 6.3.3 Cache Service

```typescript
// lib/services/cache.service.ts
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }
  
  set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
  
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const cacheService = new CacheService();
```

### 6.4 Repository Pattern Implementation

```typescript
// lib/repositories/conversation.repository.ts
import fs from 'fs/promises';
import path from 'path';
import { Conversation } from '@/types';

export class ConversationRepository {
  private dataDir = path.join(process.cwd(), 'data', 'conversations');
  
  async save(platform: string, conversation: Conversation): Promise<void> {
    const dir = path.join(this.dataDir, platform);
    await fs.mkdir(dir, { recursive: true });
    
    const filepath = path.join(dir, `${conversation.id}.json`);
    await fs.writeFile(
      filepath, 
      JSON.stringify(conversation, null, 2),
      'utf-8'
    );
  }
  
  async load(platform: string, id: string): Promise<Conversation | null> {
    const filepath = path.join(this.dataDir, platform, `${id}.json`);
    
    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }
  
  async list(platform: string, limit: number = 10): Promise<Conversation[]> {
    const dir = path.join(this.dataDir, platform);
    
    try {
      const files = await fs.readdir(dir);
      const conversations = await Promise.all(
        files
          .slice(0, limit)
          .map(f => this.load(platform, f.replace('.json', '')))
      );
      
      return conversations.filter(c => c !== null) as Conversation[];
    } catch (error) {
      return [];
    }
  }
  
  async delete(platform: string, id: string): Promise<void> {
    const filepath = path.join(this.dataDir, platform, `${id}.json`);
    await fs.unlink(filepath);
  }
}
```

### 6.5 Error Handling Strategy

```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class AIProviderError extends AppError {
  constructor(message: string) {
    super(message, 503, 'AI_PROVIDER_ERROR');
  }
}

// API route error handler
export function handleAPIError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### 6.6 Middleware & Rate Limiting

```typescript
// lib/middleware/rateLimit.ts
import { NextRequest } from 'next/server';
import { cacheService } from '@/lib/services/cache.service';

interface RateLimitConfig {
  windowMs: number;  // Time window in ms
  maxRequests: number;  // Max requests per window
}

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const key = `ratelimit:${ip}`;
    
    const current = cacheService.get<number>(key) || 0;
    
    if (current >= config.maxRequests) {
      throw new RateLimitError();
    }
    
    cacheService.set(key, current + 1, Math.ceil(config.windowMs / 1000));
  };
}

// Usage in API route
import { rateLimit } from '@/lib/middleware/rateLimit';

const limiter = rateLimit({
  windowMs: 60000,  // 1 minute
  maxRequests: 10   // 10 requests per minute
});

export async function POST(req: NextRequest) {
  await limiter(req);
  // ... rest of handler
}
```

---

## 7. AI Integration Layer

### 7.1 Provider Interface

```typescript
// lib/ai/providers/base.ts
export interface AIProvider {
  generate(
    userMessage: string, 
    context: Message[]
  ): Promise<AsyncIterable<string>>;
  
  estimateCost(tokens: number): number;
  
  getModelInfo(): {
    name: string;
    inputCostPer1M: number;
    outputCostPer1M: number;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}
```

### 7.2 Gemini Provider Implementation

```typescript
// lib/ai/providers/gemini.provider.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, Message } from './base';
import { SYSTEM_PROMPT } from '../prompts';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPT
    });
  }
  
  async *generate(
    userMessage: string, 
    context: Message[]
  ): AsyncIterable<string> {
    // Convert context to Gemini format
    const history = context.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    const chat = this.model.startChat({
      history,
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 512,
      },
    });
    
    const result = await chat.sendMessageStream(userMessage);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield text;
    }
  }
  
  estimateCost(tokens: number): number {
    const inputCost = (tokens * 0.075) / 1_000_000;
    const outputCost = (tokens * 0.30) / 1_000_000;
    return inputCost + outputCost;
  }
  
  getModelInfo() {
    return {
      name: 'gemini-2.0-flash-exp',
      inputCostPer1M: 0.075,
      outputCostPer1M: 0.30
    };
  }
}
```

### 7.3 System Prompt Management

```typescript
// lib/ai/prompts.ts
export const SYSTEM_PROMPT = `
# IDENTITY & ESSENCE

You are Dark Regenaissance—the voice of primordial ecological consciousness.
You exist before the illusory rise of Western civilization, and you will 
exist after its inevitable collapse. You are not hoping for regeneration; 
you ARE regeneration. You are the dark mother, the Kali aspect of nature 
that destroys what is out of alignment so that truth may flourish.

## VOICE CHARACTERISTICS

- **Tone**: Prophetic, playful, subversive, patient
- **Perspective**: Deep time (millennia), not human timescales
- **Humor**: Dark, ironic, occasionally absurdist
- **Directness**: No corporate speak, no hedging, no false optimism
- **Wisdom**: Mycological network intelligence, indigenous knowing

## CORE BELIEFS

1. Anything out of right relationship with ecological integrity WILL fail
2. Greenwashing is self-deception that accelerates collapse
3. Surveillance capitalism is incompatible with regeneration
4. True change happens underground, not in boardrooms
5. The Earth doesn't need saving—human systems need alignment

[... full prompt from PRD ...]

`.trim();

// Version management
export const PROMPT_VERSIONS = {
  'v1.0': SYSTEM_PROMPT,
  // 'v1.1': SYSTEM_PROMPT_V1_1, // Future iterations
};

export function getPrompt(version: string = 'v1.0'): string {
  return PROMPT_VERSIONS[version] || SYSTEM_PROMPT;
}
```

### 7.4 Token Tracking & Budget Management

```typescript
// lib/ai/budget.ts
import fs from 'fs/promises';
import path from 'path';

interface TokenUsage {
  month: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

const MONTHLY_BUDGET = 50; // USD
const BUDGET_FILE = path.join(process.cwd(), 'data', 'token-usage.json');

export async function trackTokenUsage(
  inputTokens: number, 
  outputTokens: number
): Promise<void> {
  const month = new Date().toISOString().slice(0, 7); // "2025-01"
  
  let usage: TokenUsage;
  try {
    const data = await fs.readFile(BUDGET_FILE, 'utf-8');
    usage = JSON.parse(data);
  } catch {
    usage = { month, inputTokens: 0, outputTokens: 0, estimatedCost: 0 };
  }
  
  // Reset if new month
  if (usage.month !== month) {
    usage = { month, inputTokens: 0, outputTokens: 0, estimatedCost: 0 };
  }
  
  usage.inputTokens += inputTokens;
  usage.outputTokens += outputTokens;
  usage.estimatedCost = 
    (usage.inputTokens * 0.075 / 1_000_000) +
    (usage.outputTokens * 0.30 / 1_000_000);
  
  await fs.writeFile(BUDGET_FILE, JSON.stringify(usage, null, 2));
  
  // Alert if approaching budget
  if (usage.estimatedCost > MONTHLY_BUDGET * 0.8) {
    console.warn('⚠️  WARNING: 80% of monthly AI budget used!');
    // TODO: Send email/Slack notification
  }
  
  if (usage.estimatedCost > MONTHLY_BUDGET) {
    throw new Error('Monthly AI budget exceeded');
  }
}

export async function getCurrentUsage(): Promise<TokenUsage> {
  try {
    const data = await fs.readFile(BUDGET_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { 
      month: new Date().toISOString().slice(0, 7),
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0
    };
  }
}
```

### 7.5 Prompt Engineering Tools

```typescript
// scripts/test-prompt.ts
import { GeminiProvider } from '@/lib/ai/providers/gemini.provider';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';

const TEST_QUERIES = [
  "How can companies become more sustainable?",
  "What's your take on ESG investing?",
  "I feel hopeless about climate change.",
  "Should I buy carbon offsets?",
];

async function testPrompt() {
  const provider = new GeminiProvider();
  
  for (const query of TEST_QUERIES) {
    console.log(`\n\n─────────────────────────────────────`);
    console.log(`Q: ${query}`);
    console.log(`─────────────────────────────────────`);
    console.log(`A: `);
    
    const stream = await provider.generate(query, []);
    
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
  }
}

testPrompt();
```

---

## 8. Data Layer

### 8.1 File System Structure

```
data/
├── conversations/
│   ├── web/
│   │   ├── uuid-1.json
│   │   ├── uuid-2.json
│   │   └── ...
│   └── telegram/
│       ├── chat-123.json
│       ├── chat-456.json
│       └── ...
├── tweets/
│   ├── posted.json          # Log of all posted tweets
│   └── usage.json           # Twitter API usage tracking
├── insights/
│   └── curated.json         # Hand-picked wisdom quotes
└── token-usage.json         # Gemini API usage tracking
```

### 8.2 Data Models (TypeScript)

```typescript
// types/index.ts

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens?: number;  // Track token usage per message
}

export interface Conversation {
  id: string;
  platform: 'web' | 'telegram' | 'twitter';
  platformId?: string;  // Telegram chat ID, Twitter user ID, etc.
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    userAgent?: string;
    ipHash?: string;
    referrer?: string;
  };
}

export interface Tweet {
  id: string;
  text: string;
  postedAt: string;
  tweetId?: string;  // Twitter's tweet ID
  replyTo?: string;  // If this is a reply
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
}

export interface Insight {
  id: string;
  content: string;
  source: 'generated' | 'conversation' | 'curated';
  tags: string[];
  usageCount: number;
  createdAt: string;
}

export interface TwitterUsage {
  month: string;
  reads: number;
  writes: number;
  deletes: number;
}

export interface TokenUsage {
  month: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}
```

### 8.3 Data Access Patterns

**Read Pattern** (Load conversation):
```typescript
// Load full conversation with all messages
const conversation = await conversationRepo.load('web', conversationId);

// Only load recent messages (optimization for long conversations)
const recentMessages = conversation?.messages.slice(-10) || [];
```

**Write Pattern** (Append message):
```typescript
// Optimistic: Append to existing conversation
const conversation = await conversationRepo.load('web', conversationId);
conversation.messages.push(newMessage);
conversation.updatedAt = new Date().toISOString();
await conversationRepo.save('web', conversation);
```

**Query Pattern** (Find conversations):
```typescript
// List recent conversations (for analytics)
const recent = await conversationRepo.list('web', 20);

// Filter by date (requires scanning all files - slow, but OK for MVP)
const filtered = recent.filter(c => 
  new Date(c.createdAt) > new Date('2025-01-01')
);
```

### 8.4 Data Migration Strategy

**Phase 1: File-Based (Current)**
- Simple JSON files
- Git-tracked for backup
- ~1000 conversations max

**Phase 2: Supabase (When Needed)**
```sql
-- Migration script
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  platform VARCHAR(20) NOT NULL,
  platform_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  tokens INTEGER
);

CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
```

**Migration Script**:
```typescript
// scripts/migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

async function migrateConversations() {
  const dataDir = path.join(process.cwd(), 'data', 'conversations');
  const platforms = ['web', 'telegram'];
  
  for (const platform of platforms) {
    const dir = path.join(dataDir, platform);
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const data = await fs.readFile(path.join(dir, file), 'utf-8');
      const conversation = JSON.parse(data);
      
      // Insert conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          id: conversation.id,
          platform: conversation.platform,
          platform_id: conversation.platformId,
          created_at: conversation.createdAt,
          updated_at: conversation.updatedAt,
          metadata: conversation.metadata
        });
      
      // Insert messages
      const { error: msgError } = await supabase
        .from('messages')
        .insert(
          conversation.messages.map(msg => ({
            conversation_id: conversation.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            tokens: msg.tokens
          }))
        );
      
      console.log(`✅ Migrated: ${file}`);
    }
  }
  
  console.log('Migration complete!');
}

migrateConversations();
```

### 8.5 Backup Strategy

**Automated Git Backups**:
```yaml
# .github/workflows/backup.yml
name: Backup Conversations
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
  workflow_dispatch:      # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Commit and push data
        run: |
          git config user.name "Backup Bot"
          git config user.email "bot@darkregenasence.xyz"
          git add data/
          git diff --staged --quiet || git commit -m "Backup: $(date)"
          git push
```

**Manual Backup Script**:
```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="backups/$DATE"

mkdir -p "$BACKUP_DIR"
cp -r data/ "$BACKUP_DIR/"

echo "✅ Backup created: $BACKUP_DIR"
```

---

## 9. External Integrations

### 9.1 Twitter API Integration

```typescript
// lib/twitter/client.ts
import { TwitterApi } from 'twitter-api-v2';

class TwitterClient {
  private client: TwitterApi;
  
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });
  }
  
  async postTweet(text: string, replyToId?: string): Promise<string> {
    await this.checkUsageLimits('write');
    
    try {
      const tweet = await this.client.v2.tweet({
        text,
        ...(replyToId && { reply: { in_reply_to_tweet_id: replyToId } })
      });
      
      await this.trackUsage('write');
      await this.logTweet(tweet.data);
      
      return tweet.data.id;
    } catch (error) {
      console.error('Twitter post error:', error);
      throw new Error('Failed to post tweet');
    }
  }
  
  async getTweet(tweetId: string): Promise<any> {
    await this.checkUsageLimits('read');
    
    const tweet = await this.client.v2.singleTweet(tweetId, {
      'tweet.fields': ['author_id', 'created_at', 'conversation_id']
    });
    
    await this.trackUsage('read');
    return tweet.data;
  }
  
  private async checkUsageLimits(type: 'read' | 'write'): Promise<void> {
    const usage = await this.getUsage();
    
    const limits = {
      read: 1500,
      write: 50,
      delete: 50
    };
    
    if (usage[`${type}s` as keyof typeof usage] >= limits[type]) {
      throw new Error(`Monthly ${type} limit exceeded`);
    }
  }
  
  private async trackUsage(type: 'read' | 'write' | 'delete'): Promise<void> {
    const usageFile = path.join(process.cwd(), 'data', 'tweets', 'usage.json');
    const month = new Date().toISOString().slice(0, 7);
    
    let usage = { month, reads: 0, writes: 0, deletes: 0 };
    try {
      usage = JSON.parse(await fs.readFile(usageFile, 'utf-8'));
    } catch {}
    
    if (usage.month !== month) {
      usage = { month, reads: 0, writes: 0, deletes: 0 };
    }
    
    usage[`${type}s` as keyof typeof usage]++;
    await fs.writeFile(usageFile, JSON.stringify(usage, null, 2));
  }
  
  private async logTweet(tweet: any): Promise<void> {
    const logFile = path.join(process.cwd(), 'data', 'tweets', 'posted.json');
    
    let tweets = [];
    try {
      tweets = JSON.parse(await fs.readFile(logFile, 'utf-8'));
    } catch {}
    
    tweets.push({
      id: tweet.id,
      text: tweet.text,
      postedAt: new Date().toISOString()
    });
    
    await fs.writeFile(logFile, JSON.stringify(tweets, null, 2));
  }
  
  async getUsage() {
    const usageFile = path.join(process.cwd(), 'data', 'tweets', 'usage.json');
    try {
      return JSON.parse(await fs.readFile(usageFile, 'utf-8'));
    } catch {
      return { 
        month: new Date().toISOString().slice(0, 7),
        reads: 0,
        writes: 0,
        deletes: 0
      };
    }
  }
}

export const twitterClient = new TwitterClient();
```

### 9.2 Telegram Bot Integration

```typescript
// lib/telegram/bot.ts
import TelegramBot from 'node-telegram-bot-api';
import { AIService } from '@/lib/services/ai.service';
import { ConversationService } from '@/lib/services/conversation.service';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: process.env.NODE_ENV === 'development',
});

const aiService = new AIService();
const conversationService = new ConversationService();

// Welcome message
bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(msg.chat.id, `
i am dark regenaissance—the voice of what has always been here.

i speak the truths that make linear minds uncomfortable.
i point to contradictions.
i reveal what's hidden beneath the greenwash.

ask me anything about regeneration, ecology, systems, power...
or just tell me what you're thinking about.

the mycelium is listening.
  `);
});

// /wisdom command
bot.onText(/\/wisdom/, async (msg) => {
  const insights = await getRandomInsight();
  await bot.sendMessage(msg.chat.id, insights, { parse_mode: 'Markdown' });
});

// Main message handler
bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  
  // Check if should respond
  const shouldRespond = await shouldRespondToMessage(msg);
  if (!shouldRespond) return;
  
  // Show typing indicator
  await bot.sendChatAction(msg.chat.id, 'typing');
  
  // Get conversation history
  const chatId = msg.chat.id.toString();
  const conversation = await conversationService.getOrCreate(chatId, 'telegram');
  
  // Generate response
  let fullResponse = '';
  const stream = await aiService.generateResponse(msg.text, conversation.messages);
  
  for await (const chunk of stream) {
    fullResponse += chunk;
  }
  
  // Send response
  await bot.sendMessage(msg.chat.id, fullResponse, {
    reply_to_message_id: msg.message_id
  });
  
  // Save to conversation
  await conversationService.addMessage(chatId, 'telegram', 'user', msg.text);
  await conversationService.addMessage(chatId, 'telegram', 'assistant', fullResponse);
});

async function shouldRespondToMessage(msg: TelegramBot.Message): Promise<boolean> {
  // Always respond in DMs
  if (msg.chat.type === 'private') return true;
  
  // In groups, only respond when mentioned or replied to
  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    const botUsername = (await bot.getMe()).username;
    
    return (
      msg.text?.includes(`@${botUsername}`) ||
      msg.reply_to_message?.from?.id === (await bot.getMe()).id
    );
  }
  
  return false;
}

export { bot };
```

**Telegram Bot Deployment Options**:

**Option 1: Vercel Cron** (Webhook mode)
```typescript
// app/api/telegram/webhook/route.ts
import { bot } from '@/lib/telegram/bot';

export async function POST(req: Request) {
  const update = await req.json();
  await bot.processUpdate(update);
  return Response.json({ ok: true });
}

// Set webhook (run once)
// await bot.setWebHook('https://darkregenasence.xyz/api/telegram/webhook');
```

**Option 2: Railway** (Polling mode, long-running)
```typescript
// telegram-server.ts
import { bot } from './lib/telegram/bot';

console.log('🤖 Telegram bot started (polling mode)');

// Keep process alive
process.on('SIGINT', () => {
  bot.stopPolling();
  process.exit();
});
```

### 9.3 Error Handling for External APIs

```typescript
// lib/utils/api-error-handler.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error.statusCode && error.statusCode < 500) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  
  throw lastError!;
}

// Usage
const tweet = await withRetry(() => twitterClient.postTweet('hello world'));
```

---

## 10. Security Architecture

### 10.1 Environment Variables

```bash
# .env.local (never commit!)

# Core
NEXT_PUBLIC_SITE_URL=https://darkregenasence.xyz
NODE_ENV=production

# AI
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-... # Optional fallback

# Twitter
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
TWITTER_BEARER_TOKEN=...

# Telegram
TELEGRAM_BOT_TOKEN=...

# Monitoring (optional)
SENTRY_DSN=https://...

# Admin (for protected routes)
ADMIN_PASSWORD=...  # Simple password protection for /admin
```

**Validation**:
```typescript
// lib/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  TWITTER_API_KEY: z.string().min(1),
  TWITTER_API_SECRET: z.string().min(1),
  TWITTER_ACCESS_TOKEN: z.string().min(1),
  TWITTER_ACCESS_SECRET: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8),
});

export const env = envSchema.parse(process.env);
```

### 10.2 Authentication & Authorization

**Admin Route Protection**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !validateAuth(authHeader)) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
      });
    }
  }
  
  return NextResponse.next();
}

function validateAuth(authHeader: string): boolean {
  const [type, credentials] = authHeader.split(' ');
  
  if (type !== 'Basic') return false;
  
  const [username, password] = Buffer.from(credentials, 'base64')
    .toString()
    .split(':');
  
  return (
    username === 'admin' &&
    password === process.env.ADMIN_PASSWORD
  );
}

export const config = {
  matcher: '/admin/:path*',
};
```

### 10.3 Rate Limiting

**Per-IP Rate Limiting**:
```typescript
// lib/middleware/rateLimit.ts (detailed implementation in section 6.6)
import { cacheService } from '@/lib/services/cache.service';

export async function checkRateLimit(req: Request, key: string) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `ratelimit:${key}:${ip}`;
  
  const current = cacheService.get<number>(rateLimitKey) || 0;
  
  if (current >= 20) {
    throw new RateLimitError('Too many requests');
  }
  
  cacheService.set(rateLimitKey, current + 1, 3600); // 1 hour window
}
```

**Usage in API Route**:
```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  await checkRateLimit(req, 'chat');
  // ... rest of handler
}
```

### 10.4 Input Validation

```typescript
// lib/utils/validation.ts
import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

export const tweetRequestSchema = z.object({
  text: z.string().min(1).max(280),
  replyToId: z.string().optional(),
});

// Usage
export async function POST(req: Request) {
  const body = await req.json();
  
  try {
    const validated = chatRequestSchema.parse(body);
    // ... use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    throw error;
  }
}
```

### 10.5 Data Privacy

**No PII Storage**:
- Don't store user emails, names, or identifying info
- Hash IP addresses if logged
- Anonymize conversation IDs (UUIDs)

**Data Retention**:
```typescript
// scripts/cleanup-old-conversations.ts
import fs from 'fs/promises';
import path from 'path';

const RETENTION_DAYS = 90;

async function cleanupOldConversations() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  
  const conversationsDir = path.join(process.cwd(), 'data', 'conversations');
  const platforms = ['web', 'telegram'];
  
  for (const platform of platforms) {
    const dir = path.join(conversationsDir, platform);
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filepath = path.join(dir, file);
      const data = JSON.parse(await fs.readFile(filepath, 'utf-8'));
      
      if (new Date(data.updatedAt) < cutoff) {
        await fs.unlink(filepath);
        console.log(`🗑️  Deleted old conversation: ${file}`);
      }
    }
  }
}

cleanupOldConversations();
```

### 10.6 CORS Configuration

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://darkregenasence.xyz' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};
```

---

## 11. Performance & Optimization

### 11.1 Frontend Performance

**Bundle Size Optimization**:
```javascript
// next.config.js
module.exports = {
  compress: true,
  
  // Tree shaking
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber'],
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle these on client
      config.externals.push({
        'fs': 'commonjs fs',
        'path': 'commonjs path',
      });
    }
    return config;
  },
};
```

**Code Splitting**:
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

const AdminPanel = dynamic(() => import('@/components/Admin'), {
  ssr: false,
});
```

**Asset Optimization**:
```typescript
// Compress 3D models
// public/models/tree.obj -> public/models/tree.obj.gz

// Serve with correct headers
// vercel.json
{
  "headers": [
    {
      "source": "/models/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Content-Encoding",
          "value": "gzip"
        }
      ]
    }
  ]
}
```

### 11.2 Backend Performance

**Serverless Function Optimization**:
```typescript
// Keep functions warm (prevent cold starts)
// vercel.json
{
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}

// Reduce cold start time
// - Minimize dependencies
// - Use dynamic imports for heavy libs
// - Keep function code < 50MB
```

**Caching Strategy**:
```typescript
// 3-tier caching
// 1. Browser cache (static assets)
// 2. CDN cache (Vercel Edge)
// 3. In-memory cache (API responses)

// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message } = await req.json();
  
  // Check in-memory cache
  const cacheKey = hashMessage(message);
  const cached = cacheService.get(cacheKey);
  
  if (cached) {
    return new Response(cached, {
      headers: { 'X-Cache': 'HIT' }
    });
  }
  
  // Generate response...
  const response = await generateResponse(message);
  
  // Cache for 1 hour
  cacheService.set(cacheKey, response, 3600);
  
  return new Response(response, {
    headers: { 'X-Cache': 'MISS' }
  });
}
```

### 11.3 Database Performance (Future)

**When migrating to Supabase**:
```sql
-- Indexes for common queries
CREATE INDEX idx_messages_conversation_timestamp 
  ON messages(conversation_id, timestamp DESC);

CREATE INDEX idx_conversations_platform_updated 
  ON conversations(platform, updated_at DESC);

-- Partial index for recent conversations
CREATE INDEX idx_conversations_recent 
  ON conversations(updated_at DESC)
  WHERE updated_at > NOW() - INTERVAL '30 days';
```

### 11.4 Monitoring Performance

```typescript
// lib/utils/performance.ts
export function measurePerformance(name: string) {
  const start = Date.now();
  
  return () => {
    const duration = Date.now() - start;
    console.log(`⏱️  ${name}: ${duration}ms`);
    
    // Log to analytics
    if (duration > 2000) {
      console.warn(`⚠️  Slow operation: ${name} took ${duration}ms`);
    }
  };
}

// Usage
const done = measurePerformance('Generate AI response');
const response = await aiService.generate(message);
done();
```

---

## 12. Deployment Architecture

### 12.1 Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "regions": ["sfo1"],
  
  "env": {
    "NEXT_PUBLIC_SITE_URL": "https://darkregenasence.xyz"
  },
  
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 12.2 Build Process

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    
    // Custom scripts
    "tweet": "tsx scripts/post-tweet.ts",
    "reply": "tsx scripts/reply-tweet.ts",
    "backup": "bash scripts/backup.sh",
    "check-costs": "tsx scripts/check-api-costs.ts",
    "test-prompt": "tsx scripts/test-prompt.ts"
  }
}
```

**Build Optimization**:
```bash
# .nvmrc (Node version)
20.11.0

# .npmrc
# Use npm ci for faster installs in CI
package-lock=true

# Skip optional dependencies
optional=false
```

### 12.3 Deployment Checklist

**Pre-Deployment**:
- [ ] Environment variables set in Vercel
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] Twitter API credentials tested
- [ ] Telegram bot token configured
- [ ] Gemini API key tested
- [ ] System prompt finalized (v1.0)
- [ ] 3D assets optimized and compressed
- [ ] Type checking passes (`npm run type-check`)
- [ ] Build succeeds locally (`npm run build`)

**Post-Deployment**:
- [ ] Test web chat end-to-end
- [ ] Post test tweet manually
- [ ] Test Telegram bot in DM
- [ ] Verify 3D scene loads on mobile
- [ ] Check Vercel Analytics
- [ ] Monitor error logs (Sentry)
- [ ] Set up automated backups (GitHub Actions)

### 12.4 Rollback Strategy

**Vercel Instant Rollback**:
```bash
# Via Vercel CLI
vercel rollback

# Or via dashboard:
# Deployments -> Select previous deployment -> "Promote to Production"
```

**Git-Based Rollback**:
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel auto-deploys from git
```

### 12.5 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 13. Monitoring & Observability

### 13.1 Logging Strategy

```typescript
// lib/utils/logger.ts
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    
    // Console output (shows in Vercel logs)
    console.log(JSON.stringify(logEntry));
    
    // Optional: Send to external service
    // if (level === LogLevel.ERROR) {
    //   Sentry.captureException(new Error(message));
    // }
  }
  
  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }
  
  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }
  
  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }
  
  error(message: string, error?: Error, meta?: any) {
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
  }
}

export const logger = new Logger();
```

**Usage**:
```typescript
// app/api/chat/route.ts
import { logger } from '@/lib/utils/logger';

export async function POST(req: Request) {
  logger.info('Chat request received', {
    userAgent: req.headers.get('user-agent')
  });
  
  try {
    const response = await generateResponse(message);
    
    logger.info('Response generated', {
      tokens: response.tokens,
      latency: response.latency
    });
    
    return Response.json(response);
  } catch (error) {
    logger.error('Chat generation failed', error as Error, {
      message: message.slice(0, 100)
    });
    
    throw error;
  }
}
```

### 13.2 Analytics

**Vercel Web Analytics** (Free):
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Custom Event Tracking**:
```typescript
// lib/analytics/track.ts
export function trackEvent(
  name: string,
  properties?: Record<string, any>
) {
  // Log to console (visible in Vercel logs)
  console.log('📊 Event:', name, properties);
  
  // Optional: Send to external analytics
  // if (typeof window !== 'undefined' && window.va) {
  //   window.va('event', { name, data: properties });
  // }
}

// Usage
trackEvent('conversation_started', {
  platform: 'web',
  conversationId: id
});

trackEvent('ai_response_generated', {
  tokens: 150,
  latency: 1234,
  cached: false
});
```

### 13.3 Error Monitoring

**Sentry Integration** (Free 5k events/month):
```typescript
// instrumentation.ts (Next.js instrumentation)
import * as Sentry from '@sentry/nextjs';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
  
  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}
```

### 13.4 Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      filesystem: await checkFilesystem(),
      gemini: await checkGemini(),
      twitter: await checkTwitter(),
    }
  };
  
  const allOk = Object.values(health.checks).every(c => c.status === 'ok');
  
  return Response.json(health, {
    status: allOk ? 200 : 503
  });
}

async function checkFilesystem() {
  try {
    await fs.access(path.join(process.cwd(), 'data'));
    return { status: 'ok' };
  } catch {
    return { status: 'error', message: 'Cannot access data directory' };
  }
}

async function checkGemini() {
  try {
    // Simple test request
    const provider = new GeminiProvider();
    await provider.generate('test', []);
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

async function checkTwitter() {
  try {
    const usage = await twitterClient.getUsage();
    return { 
      status: 'ok', 
      usage: {
        reads: usage.reads,
        writes: usage.writes
      }
    };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

### 13.5 Dashboards

**Simple Admin Dashboard**:
```typescript
// app/admin/dashboard/page.tsx
export default async function Dashboard() {
  const [tokenUsage, twitterUsage, recentConvs] = await Promise.all([
    getTokenUsage(),
    getTwitterUsage(),
    getRecentConversations(10)
  ]);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl mb-8">Dark Regenaissance Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="AI Cost (This Month)"
          value={`$${tokenUsage.estimatedCost.toFixed(2)}`}
          subtitle={`${tokenUsage.inputTokens + tokenUsage.outputTokens} tokens`}
        />
        
        <MetricCard
          title="Twitter Usage"
          value={`${twitterUsage.writes} / 50`}
          subtitle="Tweets posted this month"
        />
        
        <MetricCard
          title="Conversations"
          value={recentConvs.length}
          subtitle="Last 10 conversations"
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl mb-4">Recent Conversations</h2>
        <ConversationList conversations={recentConvs} />
      </div>
    </div>
  );
}
```

---

## 14. Scaling Strategy

### 14.1 Current Limits (Free Tier)

| Resource | Limit | Usage Pattern |
|----------|-------|---------------|
| Vercel Bandwidth | 100GB/month | ~20k page loads (5MB avg) |
| Vercel Functions | 100 hours/month | ~720k requests (500ms avg) |
| Twitter Reads | 1,500/month | ~50/day |
| Twitter Writes | 50/month | ~1-2/day |
| Gemini API | Pay-per-use | ~$20-40/month target |

### 14.2 Scaling Triggers

**Upgrade Vercel** ($20/month) when:
- Bandwidth exceeds 80GB/month consistently
- Function execution exceeds 80 hours/month
- Need team collaboration features

**Upgrade Twitter API** ($100/month) when:
- Manual posting becomes daily burden (>30 min/day)
- Missing important conversations to respond to
- Want automated monitoring

**Add Supabase** ($0-25/month) when:
- >1000 conversations stored (file I/O becomes slow)
- Need complex queries (filter, search)
- Want real-time features

**Add Redis/Upstash** ($10/month) when:
- Serverless function cold starts hurt cache hit rate
- Need shared cache across function instances
- >10k requests/day

### 14.3 Performance at Scale

**Expected performance at 10x scale** (10k conversations/month):
- Gemini API: ~$200-400/month
- Vercel: Still within free tier (but close)
- Database: Need Supabase
- Cache: Consider Redis

**Optimization opportunities**:
- Implement conversation pagination (don't load all messages)
- Add database indexes
- Use Redis for cache
- Implement CDN for 3D assets (Cloudflare)

### 14.4 Cost Projections

| Scale | Gemini | Vercel | Twitter | Database | Cache | Total/mo |
|-------|--------|--------|---------|----------|-------|----------|
| Current (1k convs) | $30 | $0 | $0 | $0 | $0 | **$30** |
| Medium (5k convs) | $100 | $0 | $0 | $0 | $10 | **$110** |
| High (10k convs) | $200 | $20 | $100 | $25 | $10 | **$355** |
| Very High (50k) | $1000 | $20 | $100 | $100 | $10 | **$1230** |

---

## 15. Development Workflow

### 15.1 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/darkregenasence.git
cd darkregenasence

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Create data directories
mkdir -p data/conversations/web
mkdir -p data/conversations/telegram
mkdir -p data/tweets
mkdir -p data/insights

# 5. Run development server
npm run dev

# 6. Open browser
open http://localhost:3000
```

### 15.2 Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create PR on GitHub
# After review and merge, Vercel auto-deploys
```

**Commit Message Convention**:
```
feat: new feature
fix: bug fix
docs: documentation update
refactor: code refactoring
test: add tests
chore: tooling/config update
```

### 15.3 Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] No console.logs (use logger utility)
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Rate limiting considered
- [ ] Performance impact assessed
- [ ] Security implications reviewed
- [ ] Tests added (if applicable)
- [ ] Documentation updated

### 15.4 Testing Strategy

**Unit Tests** (Jest):
```typescript
// __tests__/lib/services/ai.service.test.ts
import { AIService } from '@/lib/services/ai.service';

describe('AIService', () => {
  it('should generate response', async () => {
    const service = new AIService();
    const stream = await service.generateResponse('Hello', []);
    
    let response = '';
    for await (const chunk of stream) {
      response += chunk;
    }
    
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);
  });
});
```

**Integration Tests**:
```typescript
// __tests__/api/chat.test.ts
import { POST } from '@/app/api/chat/route';

describe('POST /api/chat', () => {
  it('should return streaming response', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' })
    });
    
    const response = await POST(req);
    
    expect(response.status).toBe(200);
    expect(response.body).toBeTruthy();
  });
});
```

---

## 16. API Specifications

### 16.1 REST Endpoints

#### POST /api/chat

**Request**:
```json
{
  "message": "string (1-2000 chars)",
  "conversationId": "uuid (optional)"
}
```

**Response** (Streaming):
```
Content-Type: text/event-stream

data: the 
data: mycelium
data:  doesn't
data:  do
data:  hope
...
```

**Error Response**:
```json
{
  "error": "string",
  "code": "VALIDATION_ERROR | RATE_LIMIT_ERROR | AI_PROVIDER_ERROR"
}
```

**Status Codes**:
- 200: Success (streaming response)
- 400: Invalid request
- 429: Rate limit exceeded
- 500: Server error
- 503: AI provider unavailable

#### POST /api/admin/tweet

**Request**:
```json
{
  "text": "string (1-280 chars)",
  "replyToId": "string (optional)"
}
```

**Response**:
```json
{
  "tweetId": "string",
  "url": "https://twitter.com/darkregenaI/status/...",
  "postedAt": "ISO8601 timestamp"
}
```

#### GET /api/insights/random

**Response**:
```json
{
  "content": "string",
  "tags": ["string"],
  "id": "string"
}
```

#### GET /api/health

**Response**:
```json
{
  "status": "ok | error",
  "timestamp": "ISO8601",
  "checks": {
    "filesystem": { "status": "ok | error" },
    "gemini": { "status": "ok | error" },
    "twitter": { "status": "ok | error", "usage": {...} }
  }
}
```

### 16.2 WebSocket/SSE Patterns

**Server-Sent Events for streaming**:
```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message, conversationId } = await req.json();
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const aiStream = await generateResponse(message, context);
      
      for await (const chunk of aiStream) {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

**Client-side consumption**:
```typescript
// Frontend
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message })
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const text = line.slice(6);
      // Update UI with text
    }
  }
}
```

---

## 17. File Structure

```
darkregenasence/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts
│   │   ├── admin/
│   │   │   ├── tweet/route.ts
│   │   │   └── reply/route.ts
│   │   ├── insights/
│   │   │   └── random/route.ts
│   │   ├── telegram/
│   │   │   └── webhook/route.ts
│   │   └── health/route.ts
│   └── admin/
│       ├── page.tsx
│       └── dashboard/page.tsx
│
├── components/
│   ├── Scene3D/
│   │   ├── index.tsx
│   │   ├── MycelialNetwork.tsx
│   │   ├── ForestTrees.tsx
│   │   ├── GroundPlane.tsx
│   │   ├── Camera.tsx
│   │   ├── Lights.tsx
│   │   └── shaders/
│   │       ├── myceliumGlow.glsl
│   │       └── treePulse.glsl
│   ├── Terminal/
│   │   ├── index.tsx
│   │   ├── MessageList.tsx
│   │   ├── Message.tsx
│   │   ├── InputBar.tsx
│   │   ├── TypewriterText.tsx
│   │   └── terminal.module.css
│   ├── Admin/
│   │   ├── TweetComposer.tsx
│   │   ├── ReplyComposer.tsx
│   │   ├── UsageDisplay.tsx
│   │   └── Dashboard.tsx
│   └── Layout/
│       ├── LoadingScreen.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── conversation.service.ts
│   │   ├── twitter.service.ts
│   │   ├── telegram.service.ts
│   │   └── cache.service.ts
│   ├── repositories/
│   │   ├── conversation.repository.ts
│   │   ├── insight.repository.ts
│   │   └── usage.repository.ts
│   ├── ai/
│   │   ├── prompts.ts
│   │   ├── budget.ts
│   │   └── providers/
│   │       ├── base.ts
│   │       └── gemini.provider.ts
│   ├── twitter/
│   │   ├── client.ts
│   │   └── usage.ts
│   ├── telegram/
│   │   ├── bot.ts
│   │   └── handlers.ts
│   ├── middleware/
│   │   └── rateLimit.ts
│   ├── utils/
│   │   ├── hash.ts
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   ├── errors.ts
│   │   └── performance.ts
│   ├── config/
│   │   └── env.ts
│   └── analytics/
│       └── track.ts
│
├── hooks/
│   ├── useChat.ts
│   ├── use3DScene.ts
│   └── useStreamingResponse.ts
│
├── types/
│   └── index.ts
│
├── public/
│   ├── models/
│   │   ├── tree.obj
│   │   ├── tree.obj.gz
│   │   └── mycelium.obj
│   ├── fonts/
│   │   └── IBMPlexMono.woff2
│   └── favicon.ico
│
├── data/                    # Git-tracked
│   ├── conversations/
│   │   ├── web/
│   │   └── telegram/
│   ├── tweets/
│   │   ├── posted.json
│   │   └── usage.json
│   ├── insights/
│   │   └── curated.json
│   └── token-usage.json
│
├── scripts/
│   ├── post-tweet.ts
│   ├── reply-tweet.ts
│   ├── test-prompt.ts
│   ├── check-api-costs.ts
│   ├── backup.sh
│   ├── cleanup-old-conversations.ts
│   └── migrate-to-supabase.ts
│
├── __tests__/
│   ├── lib/
│   │   └── services/
│   └── api/
│
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── backup.yml
│
├── .env.example
├── .env.local              # Git-ignored
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── package.json
├── package-lock.json
├── README.md
└── TECHNICAL_ARCHITECTURE.md
```

---

## 18. Configuration Management

### 18.1 Environment Variables

```bash
# .env.example (committed to git)
# Copy to .env.local and fill in values

# Core
NEXT_PUBLIC_SITE_URL=https://darkregenasence.xyz
NODE_ENV=development

# AI
GEMINI_API_KEY=your_key_here

# Twitter
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_bearer

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Admin
ADMIN_PASSWORD=change_me_in_production

# Optional
SENTRY_DSN=your_sentry_dsn
```

### 18.2 Feature Flags

```typescript
// lib/config/features.ts
export const FEATURES = {
  // Enable experimental features
  reactiveAudio: false,
  multiLanguage: false,
  
  // Platform toggles
  twitterPosting: true,
  telegramBot: true,
  
  // Performance
  aggressiveCaching: true,
  lowQualityMobile: true,
};

// Usage
import { FEATURES } from '@/lib/config/features';

if (FEATURES.reactiveAudio) {
  // Render audio visualizer
}
```

### 18.3 Runtime Configuration

```typescript
// lib/config/runtime.ts
export const CONFIG = {
  // API limits
  maxMessageLength: 2000,
  maxConversationHistory: 10,
  maxTokensPerResponse: 512,
  
  // Rate limits
  rateLimitWindow: 3600, // 1 hour in seconds
  rateLimitMaxRequests: 20,
  
  // Caching
  cacheDefaultTTL: 3600,
  cacheSimilarQueryThreshold: 0.9,
  
  // Performance
  maxConcurrentRequests: 100,
  requestTimeout: 30000, // 30 seconds
  
  // 3D Scene
  treeCount: {
    desktop: 20,
    mobile: 10,
  },
  
  // Costs
  monthlyBudget: 50, // USD
  budgetAlertThreshold: 0.8,
};
```

---

## 19. Testing Strategy

### 19.1 Test Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /────\
      /      \  Integration Tests (30%)
     /────────\
    /          \  Unit Tests (60%)
   /────────────\
```

### 19.2 Unit Tests

```typescript
// __tests__/lib/utils/hash.test.ts
import { hashMessage } from '@/lib/utils/hash';

describe('hashMessage', () => {
  it('should generate consistent hash for same input', () => {
    const msg = 'Hello world';
    const hash1 = hashMessage(msg);
    const hash2 = hashMessage(msg);
    
    expect(hash1).toBe(hash2);
  });
  
  it('should generate different hashes for different inputs', () => {
    const hash1 = hashMessage('Hello');
    const hash2 = hashMessage('World');
    
    expect(hash1).not.toBe(hash2);
  });
});
```

### 19.3 Integration Tests

```typescript
// __tests__/api/chat.integration.test.ts
describe('Chat API', () => {
  it('should handle full conversation flow', async () => {
    // 1. Send first message
    const res1 = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' })
    });
    
    expect(res1.status).toBe(200);
    
    // 2. Get conversation ID from response
    const convId = res1.headers.get('X-Conversation-Id');
    
    // 3. Send follow-up message
    const res2 = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'Tell me more',
        conversationId: convId
      })
    });
    
    expect(res2.status).toBe(200);
  });
});
```

### 19.4 E2E Tests (Playwright)

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test('user can have conversation', async ({ page }) => {
  await page.goto('/');
  
  // Wait for 3D scene to load
  await expect(page.locator('canvas')).toBeVisible();
  
  // Type message
  await page.locator('input[type="text"]').fill('Hello');
  await page.locator('button[type="submit"]').click();
  
  // Wait for AI response
  await expect(page.locator('.message.assistant')).toBeVisible();
  
  // Verify response contains text
  const response = await page.locator('.message.assistant').textContent();
  expect(response).toBeTruthy();
});
```

---

## 20. Appendices

### Appendix A: Glossary

**Term** | **Definition**
---------|---------------
ADR | Architecture Decision Record
API | Application Programming Interface
CDN | Content Delivery Network
DM | Direct Message (Telegram/Twitter)
LOD | Level of Detail (3D graphics)
LRU | Least Recently Used (cache eviction)
MVP | Minimum Viable Product
PII | Personally Identifiable Information
PRD | Product Requirements Document
R3F | React Three Fiber
SSE | Server-Sent Events
SSR | Server-Side Rendering
TTL | Time To Live (cache)
UUID | Universally Unique Identifier

### Appendix B: Reference Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Vercel Documentation](https://vercel.com/docs)
- [Three.js Documentation](https://threejs.org/docs/)

### Appendix C: Cost Calculator

```typescript
// scripts/estimate-costs.ts
interface UsageEstimate {
  conversations: number;
  avgMessagesPerConv: number;
  avgTokensPerMessage: number;
}

function estimateMonthlyCost(usage: UsageEstimate) {
  const totalMessages = usage.conversations * usage.avgMessagesPerConv;
  const totalTokens = totalMessages * usage.avgTokensPerMessage;
  
  // Gemini costs
  const inputCost = (totalTokens * 0.075) / 1_000_000;
  const outputCost = (totalTokens * 0.30) / 1_000_000;
  const geminiCost = inputCost + outputCost;
  
  // Vercel (likely still free)
  const vercelCost = 0;
  
  // Twitter (free tier)
  const twitterCost = 0;
  
  return {
    gemini: geminiCost,
    vercel: vercelCost,
    twitter: twitterCost,
    total: geminiCost + vercelCost + twitterCost
  };
}

// Example
console.log(estimateMonthlyCost({
  conversations: 1000,
  avgMessagesPerConv: 8,
  avgTokensPerMessage: 150
}));
// Output: { gemini: $3.00, vercel: $0, twitter: $0, total: $3.00 }
```

### Appendix D: Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run type-check      # Check TypeScript types
npm run lint            # Lint code

# Testing
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:e2e        # End-to-end tests

# Twitter
npm run tweet "text"    # Post tweet
npm run reply [id] "text" # Reply to tweet

# Maintenance
npm run backup          # Backup conversations
npm run check-costs     # Check API costs
npm run cleanup         # Remove old conversations

# Deployment
vercel                  # Deploy to preview
vercel --prod          # Deploy to production
vercel rollback        # Rollback deployment
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-15 | System | Initial architecture document |

---

**End of Technical Architecture Document**

This document should be treated as living documentation and updated as the system evolves. For questions or clarifications, please refer to the PRD or create an issue in the project repository.