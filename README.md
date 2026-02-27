erDiagram
    USER {
        ObjectId _id PK
        string username UK
        string email UK
        string fullName
        string password
        enum role
        string lastLoginIP
        string lastLoginCountry
        date createdAt
        date updatedAt
    }

    SESSION {
        ObjectId _id PK
        ObjectId user FK
        string deviceName
        string ipAddress
        string country
        string userAgent
        string refreshTokenHash
        boolean isSuspicious
        date lastUsedAt
        date expiresAt
        date createdAt
        date updatedAt
    }

    USER ||--o{ SESSION : "has many"
