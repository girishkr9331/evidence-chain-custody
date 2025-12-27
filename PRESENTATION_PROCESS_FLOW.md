# Evidence Chain-of-Custody - Concise Process Flow (PowerPoint Ready)

```plantuml
@startuml
title Evidence Chain-of-Custody Application - Core Process Flow

skinparam activity {
  BackgroundColor #f8f9fa
  BorderColor #0d6efd
  FontColor #212529
  ArrowColor #0d6efd
  FontSize 12
}
skinparam note {
  BackgroundColor #fff3cd
  BorderColor #ffc107
}

start

:🔐 **User Login/Register**
JWT Authentication;

:🏠 **Dashboard**
View Stats & Evidence List;

:📤 **Upload Evidence**
File + Metadata;

:🧮 **Generate Hash**
SHA-256 Fingerprint;

:💾 **Store in Database**
Evidence + AuditLog;

:⛓️ **Anchor to Blockchain**
Smart Contract Storage;

note right
**Core Security Features:**
• Immutable blockchain records
• Hash-based integrity
• Complete audit trail
• Tamper detection
end note

:✅ **Verify Evidence**
Compare Hash vs Blockchain;

if (Hash Match?) then (✅ Valid)
  :🎉 **Evidence Verified**
  Integrity Confirmed;
else (❌ Tampered)
  :🚨 **Tamper Alert**
  Security Breach Detected;
endif

:📊 **Audit Trail**
Complete Activity Log;

:📦 **Archive Evidence**
Long-term Storage;

:🚪 **Logout**
Clear Session;

stop

@enduml
```

## Key Features Highlighted:

### 🔐 **Authentication**
- Secure JWT-based login system

### 📤 **Evidence Management** 
- Upload files with metadata
- Automatic hash generation for integrity

### ⛓️ **Blockchain Security**
- Immutable evidence anchoring
- Smart contract integration

### ✅ **Verification System**
- Hash comparison for tamper detection
- Real-time integrity checking

### 📊 **Audit & Compliance**
- Complete activity logging
- Regulatory compliance ready

### 📦 **Lifecycle Management**
- Evidence archival system
- Long-term preservation