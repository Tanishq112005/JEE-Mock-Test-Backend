# JEEArchive - Mock Test Platform Backend

**A full-featured JEE mock test platform with a pixel-accurate NTA exam replica, a custom chapterwise test interface, topic-wise PYQ practice, full-length mocks, and detailed performance analytics with question-level solution breakdowns.**

[jeearchive.com](https://jeearchive.com) | [Live API (Render)](https://jee-mock-test-backend-5bgg.onrender.com)

---

## 🔒 Repository Notice
**This repository is private** to protect proprietary question-bank infrastructure, exam-engine logic, and analytics pipelines. The codebase powers a live mock-test platform with an active beta user base.

**Recruiters and collaborators:** I am happy to grant private repo access or walk you through the codebase on a call. Reach me at [tanishqjain1109@gmail.com](mailto:tanishqjain1109@gmail.com).

---

## 📊 Platform Stats
| Metric | Value |
|--------|-------|
| **Beta Users Onboarded** | 1,000+ |
| **Question Bank Size** | 16,484+ questions |
| **REST API Endpoints** | 50+ |
| **Subjects Covered** | Physics, Chemistry, Mathematics |
| **Test Modes** | NTA Replica, Chapterwise, Topic-wise PYQ, Chapterwise PYQ, Full-length Mock |

---

## 🛠️ Backend Tech Stack
| Layer | Technology & Provider |
|--------|-------|
| **Core Environment** | Node.js, Express.js, TypeScript |
| **Database & ORM** | TiDB (MySQL), Prisma ORM |
| **Caching & In-Memory** | Aiven Valkey (Single Cache & Hash Ring), Redis Cloud (Bitmaps) |
| **Message Broker** | RabbitMQ via CloudAMQP |
| **Storage & File Caching** | Backblaze B2, Cloudflare Cache |
| **Secrets Management** | Doppler (Env Injection) |
| **Email Service** | Brevo |
| **Authentication** | JWT, Bcrypt, Google OAuth |
| **Deployment** | Render |

---

## 🚀 Features

- **NTA Exam Interface Replica**: Pixel-accurate replication of the NTA exam portal UI, matched in layout, color scheme, and interaction patterns. Timed paper flow behaving exactly like the live exam.
- **Custom Chapterwise Test Interface**: A separate, purpose-built interface designed for focused, distraction-free practice on a single chapter at a time.
- **PYQ Practice**: Chapterwise and Topic-wise PYQs covering every chapter across Physics, Chemistry, and Mathematics. Full-length mock tests replicating actual JEE patterns.
- **Review and Submission**: Auto-save of responses to prevent data loss mid-test. Detailed post-submission breakdown of answers.
- **Detailed Analytics Section**: Chapterwise score visualization, accuracy trend charts, weak-area breakdowns, and per-session performance history.
- **Solution Breakdown**: Full, step-by-step solutions available for every question attempted.

---

## 📸 Features Overview & UI Screenshots

### NTA Exam Interface Replica
![NTA Exam Interface Replica (Light)](./images/Screenshot%202026-06-28%20151552.png)
![NTA Exam Interface Replica (Dark)](./images/Screenshot%202026-06-28%20152126.png)

### Custom Chapterwise Test Interface
![Custom Chapterwise Test Interface](./images/Screenshot%202026-06-28%20151143.png)

### Topic-wise and Chapterwise PYQ Practice
![PYQ List Interface](./images/Screenshot%202026-06-28%20151157.png)

### Performance Analytics Dashboard
![Performance Analytics Dashboard](./images/Screenshot%202026-06-28%20151058.png)

### Solution Breakdown View
![Solution Breakdown View](./images/Screenshot%202026-06-28%20151206.png)

### DashBoard
![Dashboard](./images/Screenshot%202026-06-28%20151041.png)

---

## 🏗️ Backend System Architecture

> 💡 **Zero-Cost & High-Scale Architecture**: The entire backend infrastructure—including the Node.js API, TiDB database, Redis caching, RabbitMQ message queues, and Cloudflare file caching—is heavily optimized and engineered to run **completely within the free tier** of its respective cloud providers while easily **handling up to 10,000+ concurrent users**.

This backend follows a standard Service-Repository pattern, decoupling business logic from data access. It is designed to be highly scalable, performant, and cost-effective.

```mermaid
flowchart TB
    %% Styling Classes
    classDef client fill:#4285F4,stroke:#fff,stroke-width:2px,color:#fff
    classDef storage fill:#E04A3A,stroke:#fff,stroke-width:2px,color:#fff
    classDef gateway fill:#8E44AD,stroke:#fff,stroke-width:2px,color:#fff
    classDef server fill:#0F9D58,stroke:#fff,stroke-width:2px,color:#fff
    classDef queue fill:#F4B400,stroke:#fff,stroke-width:2px,color:#fff
    classDef data fill:#0D47A1,stroke:#fff,stroke-width:2px,color:#fff
    classDef cache fill:#DB4437,stroke:#fff,stroke-width:2px,color:#fff

    %% Client Layer
    subgraph Clients ["Client Layer"]
        Student[Student App / Web]:::client
    end

    %% API Gateway & Hosting
    subgraph Gateway ["API Gateway (Render)"]
        RL[Rate Limiters]:::gateway
        Auth[JWT Auth]:::gateway
    end

    %% Service Layer
    subgraph AppServer ["Application Server (Express)"]
        Router[Router]:::server
        Services[Core Services]:::server
    end

    %% Data Stores
    subgraph DataLayer ["Data & Persistence"]
        RedisCache[(Single Redis Cache)]:::cache
        RedisRing[(Redis Hash Ring)]:::cache
        Prisma[Prisma ORM]:::data
        DB[(TiDB / MySQL)]:::data
    end

    %% Async Tasks
    subgraph AsyncWorker ["Background Processing"]
        RMQ[[RabbitMQ]]:::queue
        Workers(Worker Nodes):::server
    end

    %% File Storage
    subgraph Storage ["Static Storage"]
        CF{Cloudflare Cache}:::storage
        B2[(Backblaze B2)]:::storage
    end

    %% Primary Request Flow
    Student -->|1. API Request| RL
    RL --> Auth
    Auth --> Router
    Router --> Services
    
    %% Data Flow
    Services <-->|Static Data Caching| RedisCache
    Services <-->|Temp Sessions / OTPs| RedisRing
    Services <-->|Persistent Data| Prisma
    Prisma <--> DB
    
    %% Async Flow
    Services -->|Publish Event| RMQ
    RMQ -->|Consume| Workers
    Workers -->|Persist Background Task| Prisma
    
    %% PYQ Flow Highlight
    Student -.->|2. Fetch PYQ URL| RL
    Services -.->|Check PYQ Meta| RedisCache
    Services -.->|Cache Miss? Query DB| Prisma
    Services -.->|3. Return JSON Data / URL| Student
    Student -->|4. Download File| CF
    
    %% Internal Image Fetching
    Services -->|Fetch Question Images| CF
    CF -->|Fetch if missed| B2
```

*Note: The system utilizes two distinct Redis architectures. A **Single Redis Cache** is used for read-heavy static data (like Chapter Data and PYQ metadata); if a cache miss occurs here, the Core Services query the Database directly. Meanwhile, a **Redis Hash Ring** is used exclusively for temporary, write-heavy session data (like active test data, dashboard analytics, and Auth OTPs) until it is permanently saved. Backblaze B2 is heavily utilized for storing the actual images of the questions. The API returns the JSON Data / URL, and only then does the client hit the Backblaze B2 service (via Cloudflare) to fetch the actual file. Additionally, Core Services also interact with the Cloudflare Cache to fetch these question images when required for internal processing.*

### 2. Consistent Hashing & Redis Clusters (For Temporary Data)
To ensure high availability and load distribution across multiple Redis instances, the system implements a custom **Hash Ring (`HashRingService`)** for Consistent Hashing. This cluster is **strictly used for temporary, volatile data** (like active test sessions, auth OTPs, and real-time dashboard analytics) until it is persisted. 
- **Dual Hash Rings**: The system maintains two separate rings, one for Authentication (`authRing`) and one for Dashboard Caching (`dashboardRing`).
- **Deterministic Routing**: When a user requests data, their `userId` is hashed using MD5 to route to the nearest node.
- **Node Rebalancing & Dynamic Scaling**: The hash ring allows for the dynamic addition or removal of Redis nodes on the fly. If the system experiences high load, new Redis nodes can be spun up and added to the ring for horizontal scaling without downtime. The system mathematically drains existing hash values and distributes them to the new nodes seamlessly.

```mermaid
graph TD
    classDef cache fill:#DB4437,stroke:#fff,stroke-width:2px,color:#fff
    
    subgraph HashRing [Consistent Hash Ring]
        direction TB
        N1((Node A <br/> Hash: 100)):::cache --> N2((Node B <br/> Hash: 300)):::cache
        N2 --> N3((Node C <br/> Hash: 500)):::cache
        N3 --> N4((Node D <br/> Hash: 700)):::cache
        N4 --> N5((Node E <br/> Hash: 900)):::cache
        N5 -.->|Wraps Around| N1
    end
    
    User[Student Request] --> Hash[MD5 Hash: 650]
    Hash -->|Routes to next highest| N4
```

### 3. Rate Limiting Strategies
Two distinct algorithms are implemented based on route sensitivity:
1. **Token Bucket Algorithm**: Standard API endpoints (Analytics, Banners). Tokens refilled at a constant rate.
2. **Sliding Window Log Algorithm**: Sensitive Auth routes (OTP, Login). Keeps a rolling timestamp log to strictly prevent brute-force attacks.

```mermaid
sequenceDiagram
    participant User
    participant Route
    participant TokenBucket
    participant SlidingWindow
    
    User->>Route: GET /api/analytics
    Route->>TokenBucket: Check Tokens
    TokenBucket-->>Route: Allow (Token Deducted)
    
    User->>Route: POST /api/auth/login
    Route->>SlidingWindow: Check Rolling Log
    SlidingWindow-->>Route: Allow (Log Updated)
```

### 4. Redis Bitmap & Hashing Structure
For ultra-fast, memory-efficient data tracking, the system utilizes **Redis Bitmaps (Bitfields)**. 

Tracking which questions a student has attempted across thousands of questions can be database-heavy. Instead:
- A `questionBitmap:indexMap` (Redis Hash) maps every `questionId` to a specific bit index (0, 1, 2...).
- When a student attempts a question, their personal **Redis Bitmap** flips the bit at that specific index from `0` to `1`.
- Retrieving all attempted questions for a student becomes an incredibly fast bitwise operation rather than an expensive SQL `JOIN` or `SELECT`.

### 5. In-Memory Data Flow & Caching Strategies
To reduce database bottleneck during ongoing tests, the two Redis architectures split the load:
- **Heavy Read Caching (Single Redis)**: Static data like Question Banks, Chapter Data, and Year-wise Papers are heavily cached in a single Redis instance. On a cache miss, the DB is queried.
- **Write-Heavy Operations (Hash Ring)**: Live analytics, OTPs, and active test statuses are primarily written to the Redis Hash Ring.
- **2-Minute Sync via RabbitMQ**: During the test time, updates occur every **2 minutes**. The data flows from the Redis Hash Ring, gets pushed to a RabbitMQ queue, and is then consumed and saved into the primary database.
- **Cleanup**: Once securely persisted, the database workflow explicitly deletes the temporary data from the Hash Ring to free up memory.

```mermaid
sequenceDiagram
    participant Student
    participant API
    participant RedisRing
    participant RabbitMQ
    participant DB
    
    Student->>API: Submits active test/analytics data
    API->>RedisRing: Temporarily store/update test data
    RedisRing-->>API: Acknowledged
    API-->>Student: Return JSON Response
    
    Note over API,DB: Every 2 minutes during active test
    RedisRing->>RabbitMQ: Push test data updates to Queue
    RabbitMQ->>DB: Consume & Persist final details securely
    DB-->>RabbitMQ: Persisted
    DB->>RedisRing: Delete temporary data (Free Memory)
```

### 6. Message Queues & Background Workers
Heavy tasks are offloaded to **RabbitMQ**.
- **Queues Utilized**: `email_queue`, `emailAdding_queue`, `streak_update_queue`, `studentTestAnalytics_queue`, `submitChapterAttempt_queue`, `testEvalution_queue`, `updateChapterAttempt_queue`, `updateTestDetails_queue`.
- **Producers**: The API services publish messages to specific exchanges.
- **Consumers (Workers)**: Over **7 independent worker processes** are running concurrently on different **Render** services. They consume these messages to perform heavy lifting asynchronously (e.g., parsing 100+ questions for test evaluation).

```mermaid
graph TD
    classDef server fill:#0F9D58,stroke:#fff,stroke-width:2px,color:#fff
    classDef queue fill:#F4B400,stroke:#fff,stroke-width:2px,color:#fff
    classDef data fill:#0D47A1,stroke:#fff,stroke-width:2px,color:#fff

    API[API Service]:::server -->|Publish| Exchange((RabbitMQ Exchange)):::queue
    
    Exchange --> Q1[email_queue]:::queue
    Exchange --> Q2[streak_update_queue]:::queue
    Exchange --> Q3[testEvalution_queue]:::queue
    Exchange --> QN[...other queues...]:::queue
    
    Q1 --> W1[Email Worker]:::server
    Q2 --> W2[Streak Worker]:::server
    Q3 --> W3[Test Eval Worker]:::server
    QN --> WN[Other Workers]:::server
    
    W1 --> DB[(TiDB / MySQL)]:::data
    W2 --> DB
    W3 --> DB
    WN --> DB
```

**Additional Background Services:**
- **Transactional Emails**: Sending OTPs and notifications via `email_queue`.
- **Student Streak Management**: Tracks and updates consecutive days of activity in cache first via the `streak_update_queue`.

### 7. File Storage (Backblaze B2 & Cloudflare Cache)
- **Deployment**: The Node.js/Express backend itself is deployed on **Render** (via free/hobby tiers).
- **Storage**: Files are uploaded directly to **Backblaze B2**.
- **Cloudflare Caching**: **Cloudflare Cache** is placed *only* in front of Backblaze B2 to cache and serve the static assets. 
- **Free Tier Synergy**: The Bandwidth Alliance ensures data transfer between them is free, drastically reducing direct reads to Backblaze.

### 8. Authentication Flow & Database Pooling
- **Authentication**: Supports traditional email/password login securely hashed with **Bcrypt**, alongside seamless **Google OAuth** integration. Sessions are securely managed using **JSON Web Tokens (JWT)**.
- **OTP Verification Flow**: When a user registers or resets a password, a generated OTP is temporarily stored in the **Redis Hash Ring**. To prevent abuse, OTP requests are strictly rate-limited using the **Sliding Window Log Algorithm**. If the rate limit is passed, an event is published to the `email_queue`. A dedicated background worker on Render consumes this event and emails the OTP to the user via the **Brevo** service. Once the user enters the OTP, the API verifies it instantly against the Hash Ring.

```mermaid
sequenceDiagram
    participant User
    participant API
    participant SlidingWindow as Rate Limiter (Sliding Window)
    participant RedisRing as Redis (Hash Ring)
    participant RMQ as RabbitMQ
    participant Worker as Auth Worker (Render)
    participant Brevo as Brevo (Email)
    
    User->>API: 1. Request OTP (Registration/Reset)
    API->>SlidingWindow: 2. Check Sliding Window Log
    
    alt Too Many Requests
        SlidingWindow-->>API: Limit Exceeded
        API-->>User: 429 Too Many Requests Error
    else Allowed
        SlidingWindow-->>API: Allow Request
        API->>RedisRing: 3. Store OTP with Expiration
        API->>RMQ: 4. Publish event to `email_queue`
        API-->>User: 5. Acknowledge Request
        
        RMQ->>Worker: 6. Consume `email_queue` event
        Worker->>Brevo: 7. Trigger Email Delivery
        Brevo-->>User: 8. Deliver OTP Email
        
        User->>API: 9. Submit OTP
        API->>RedisRing: 10. Validate OTP
        RedisRing-->>API: Valid
        API-->>User: 11. Success (JWT Issued)
    end
```

- **Database (TiDB / MySQL)**: Uses **Prisma ORM**. Prisma handles connection pooling out of the box.
- **Query Optimization**: Repositories leverage `findMany` batching, selective `select` statements, and `$transaction` blocks to ensure atomicity.

---

## 👥 Team

This project is built by a team of three:
- **Tanishq Jain** (Backend Developer) - Handles all backend infrastructure, including building the REST API endpoints, question bank architecture, and test session caching.
- **Ayush Singh** (Frontend Developer) - Handles the complete frontend of the platform, including the NTA replica interface, custom chapterwise practice UI, and analytics dashboard.
- **Utkarsh Singh** (User Operations) - Handles everything user-facing outside the product itself, including direct user communication and marketing strategy.

---

## ℹ️ About

**Tanishq Jain**  
Handles all backend infrastructure, including the API layer, question bank architecture, test session handling, Redis caching, RabbitMQ workers, and results computation.
- **LinkedIn**: [tanishq-jain-6b90b1292](https://www.linkedin.com/in/tanishq-jain-6b90b1292/)
- **GitHub**: [Tanishq112005](https://github.com/Tanishq112005)
- **Email**: [tanishqjain1109@gmail.com](mailto:tanishqjain1109@gmail.com)

**IIIT Bhagalpur, B.Tech CSE, 2023-2027**

---

## 📜 License

**This project is proprietary and not open source.** 
All rights reserved. The source code is not available for public use, reproduction, or distribution.
