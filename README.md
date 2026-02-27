# 🛡️ Secure Auth & Session Intelligence System

A robust, enterprise-grade authentication system featuring intelligent session management, device tracking, and proactive security measures to detect and mitigate unauthorized access.

## 🎯 Objective
To provide a highly secure, stateful authentication layer using JSON Web Tokens (JWT) combined with advanced session tracking. This system prevents token theft through strict refresh token rotation, limits concurrent sessions, and actively monitors for suspicious login activity.

---

## 📊 Entity-Relationship (ER) Diagram

The database schema is normalized to separate user credentials from active sessions, enabling multi-device tracking and targeted remote logouts.

```mermaid
erDiagram
    USER ||--o{ SESSION : "has (max 3)"
    
    USER {
        ObjectId _id PK
        String email UK
        String passwordHash
        String role "enum: ['user', 'admin']"
        Boolean requiresVerification "Suspicious login flag"
        Date createdAt
        Date updatedAt
    }

    SESSION {
        ObjectId _id PK
        ObjectId userId FK
        String refreshTokenHash "Hashed for DB storage"
        String deviceName "e.g., iPhone 13"
        String ipAddress
        String userAgent "Browser/OS details"
        Boolean isSuspicious "True if new IP/Country"
        Date createdAt
        Date lastUsedAt
    }


