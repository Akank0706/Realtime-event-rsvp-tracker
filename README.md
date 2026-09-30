# Real-Time Cloud-Based Event Planning & RSVP Tracker

A real-time, cloud-native web application designed to demonstrate distributed systems and cloud computing concepts. Organizers can create and manage events, enforce strict capacity limits, manage waitlists, broadcast announcements, and monitor attendance metrics. Attendees can discover events, reserve seats, update responses, and receive real-time notifications.

---

## 1. Project Overview

Modern event management demands instantaneous coordination across heterogeneous devices. Traditional spreadsheet and messaging-group workflows break under heavy traffic due to duplicate submissions, lack of live seat counts, and race conditions when multiple users book the final seat simultaneously.

This project delivers a real-time event planning and RSVP tracking platform built on **React, TypeScript, Vite, and Google Firebase (Cloud Firestore & Authentication)**. It demonstrates how cloud-hosted applications maintain synchronized state across thousands of active clients using **push-based real-time database listeners (`onSnapshot`)** and **atomic transactions (`runTransaction`)**.

---

## 2. Problem Statement

Manual event registration suffers from:
1. **Concurrency Overbooking:** Two attendees clicking "Going" at the same second causes confirmed attendees to exceed venue fire-code capacity.
2. **Stale Data:** Attendees and organizers must refresh pages repeatedly to see whether seats remain or whether cancellations occurred.
3. **No Dynamic Queueing:** When events fill up, potential attendees are lost instead of being placed into an orderly First-In, First-Out (FIFO) waitlist.
4. **Scattered Communication:** Venue updates, room changes, or schedule adjustments fail to reach confirmed attendees promptly.

---

## 3. Objectives

- **Cloud Native Architecture:** Deploy a serverless cloud database and authentication layer with zero physical server maintenance.
- **Push-Based Real-Time Synchronization:** Stream database document changes to organizer and attendee dashboards with sub-second latency and zero manual refreshing.
- **Atomic Concurrency Protection:** Guarantee that `goingCount <= capacity` even under simultaneous booking spikes using database transactions.
- **Automated Waitlist Promotion:** Automatically detect cancelled RSVPs and promote the next queued attendee in FIFO sequence.
- **Role-Based Access Control (RBAC):** Restrict event modifications, cancellations, and announcements to verified organizers.

---

## 4. Features

| Feature | Description |
| :--- | :--- |
| **Real-Time Dashboards** | Live counter streams for Going, Maybe, Not Going, and Available seats via Firestore listeners. |
| **Atomic RSVP Engine** | Transaction-based reservation mechanism preventing race conditions and double bookings. |
| **Capacity & Waitlist** | Dynamic capacity bar; transitions to `FULL` automatically and queues excess requests into a FIFO waitlist. |
| **Automatic Promotion** | When a confirmed attendee cancels, the system automatically promotes waitlist attendee #1 to Going. |
| **Organizer Broadcasts** | Organizers can publish emergency announcements (e.g. venue changes) that dispatch in-app notifications. |
| **Event Discovery & QR** | Full search by keyword, category filter, date filter, and shareable QR code badges. |
| **Cloud Analytics** | 100% computed metrics: conversion rates, category popularity, capacity utilization, and attendance trends. |
| **Interactive QA Suite** | Built-in test suite executing 16 automated tests covering authentication, race conditions, and security. |

---

## 5. User Roles & Permissions

The application implements strict Role-Based Access Control (RBAC) enforced both at the UI layer and within `firestore.rules`:

| Permission / Action | Attendee | Organizer |
| :--- | :---: | :---: |
| Register & Log In | ✅ | ✅ |
| Browse Published Events | ✅ | ✅ |
| Submit / Update / Cancel RSVP | ✅ (Own Only) | ✅ (Own Only) |
| Join / Leave Waitlist | ✅ (Own Only) | ✅ (Own Only) |
| Receive Targeted Notifications | ✅ | ✅ |
| Create New Events | ❌ | ✅ |
| Edit / Update Events | ❌ | ✅ (Own Only) |
| Cancel / Delete Events | ❌ | ✅ (Own Only) |
| Broadcast Announcements | ❌ | ✅ (Own Only) |
| View Organizer Analytics | ❌ | ✅ |

---

## 6. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React Icons.
- **Cloud Database:** Google Cloud Firestore (Document NoSQL Database) with sub-collection schemas.
- **Authentication:** Firebase Authentication with persistent session tokens.
- **Image & Asset Storage:** Firebase Storage with MIME-type and file-size validation rules.
- **Real-Time Engine:** Firestore `onSnapshot` subscriptions coupled with cross-tab `BroadcastChannel` synchronization.
- **Testing:** Automated TypeScript test runner executing unit, integration, and concurrency scenarios.

---

## 7. Cloud Architecture Diagram

```
                              ┌───────────────────────────────────┐
                              │           Client Browser          │
                              │       (React 19 + TypeScript)     │
                              └─────────────────┬─────────────────┘
                                                │
                     ┌──────────────────────────┼─────────────────────────┐
                     │ HTTPS / REST             │ WebSocket / Stream      │ Auth Tokens
                     ▼                          ▼                         ▼
        ┌─────────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
        │     Firebase Storage    │  │   Cloud Firestore   │  │    Firebase Auth    │
        │  (Event Images/Badges)  │  │ (NoSQL Distributed) │  │  (JWT / Passwords)  │
        └─────────────────────────┘  └──────────┬──────────┘  └─────────────────────┘
                                                │
                                  ┌─────────────┴─────────────┐
                                  ▼                           ▼
                       ┌─────────────────────┐     ┌─────────────────────┐
                       │  Atomic Transaction │     │ Real-Time Listener  │
                       │  Capacity Enforcer  │     │    (onSnapshot)     │
                       └─────────────────────┘     └──────────┬──────────┘
                                                              │
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │ Organizer Dashboard │
                                                   │  (Auto-updates 0s)  │
                                                   └─────────────────────┘
```

---

## 8. System Workflow

```
Organizer Creates Event
          │
          ▼
Cloud Firestore Document Written (/events/{eventId})
          │
          ▼
Event Status: PUBLISHED (Capacity: N, Going: 0)
          │
          ▼
Attendees Discover Event in Browser Catalog
          │
          ▼
Attendee Clicks "Going"
          │
          ▼
Cloud Backend Transaction (Locks Document)
  ├── Is goingCount < Capacity?
  │      ├── YES: goingCount++, Create RSVP record (/events/{id}/rsvps/{uid}), Commit
  │      └── NO:  Reject GOING, Place user in FIFO Waitlist (/events/{id}/waitlist/{uid})
          │
          ▼
Firestore Emits Real-Time Snapshot Event
          │
          ▼
Connected Clients (Organizer & Attendee Dashboards) Update Counters
(Going: 49 ➔ 50, Status: FULL, Available: 0) — WITHOUT Page Refresh!
```

---

## 9. Database Design

### Firestore Collections & Schemas

#### 1. `users/{uid}`
```json
{
  "uid": "usr_alex_123",
  "name": "Alex Rivera",
  "email": "alex.organizer@campuscloud.edu",
  "role": "organizer",
  "createdAt": "2026-09-20T10:00:00.000Z"
}
```

#### 2. `events/{eventId}`
```json
{
  "id": "evt_cloud_workshop",
  "organizerId": "usr_alex_123",
  "organizerName": "Alex Rivera",
  "organizerEmail": "alex.organizer@campuscloud.edu",
  "title": "Cloud Computing & Serverless Workshop",
  "description": "Hands-on session on real-time listeners and concurrency.",
  "category": "Workshop",
  "location": "Room 402, CS Complex",
  "date": "2026-10-15",
  "startTime": "10:00",
  "endTime": "13:00",
  "capacity": 50,
  "goingCount": 49,
  "maybeCount": 5,
  "notGoingCount": 2,
  "waitlistCount": 3,
  "status": "PUBLISHED",
  "createdAt": "2026-09-25T12:00:00.000Z",
  "updatedAt": "2026-09-25T12:00:00.000Z"
}
```

#### 3. `events/{eventId}/rsvps/{userId}`
- **Uniqueness Constraint:** Keyed by `userId` to prevent duplicate RSVP records per user.
```json
{
  "id": "rsvp_evt_cloud_workshop_usr_sam_456",
  "eventId": "evt_cloud_workshop",
  "userId": "usr_sam_456",
  "userName": "Sam Chen",
  "userEmail": "sam.attendee@campuscloud.edu",
  "status": "GOING",
  "createdAt": "2026-09-26T14:20:00.000Z",
  "updatedAt": "2026-09-26T14:20:00.000Z"
}
```

#### 4. `events/{eventId}/waitlist/{userId}`
```json
{
  "id": "wl_evt_cloud_workshop_usr_taylor_789",
  "eventId": "evt_cloud_workshop",
  "userId": "usr_taylor_789",
  "userName": "Taylor Jordan",
  "userEmail": "taylor.attendee@campuscloud.edu",
  "joinedAt": "2026-09-26T15:00:00.000Z",
  "position": 1,
  "status": "WAITING"
}
```

#### 5. `events/{eventId}/announcements/{announcementId}`
```json
{
  "id": "anc_room_change_001",
  "eventId": "evt_cloud_workshop",
  "organizerId": "usr_alex_123",
  "organizerName": "Alex Rivera",
  "title": "Room Relocated",
  "message": "The workshop has moved to Hall B3 due to higher registrations.",
  "createdAt": "2026-09-28T09:30:00.000Z"
}
```

#### 6. `notifications/{notificationId}`
```json
{
  "id": "notif_987",
  "userId": "usr_sam_456",
  "type": "EVENT_ANNOUNCEMENT",
  "title": "Announcement: Cloud Computing Workshop",
  "message": "Room Relocated: The workshop has moved to Hall B3.",
  "eventId": "evt_cloud_workshop",
  "eventTitle": "Cloud Computing & Serverless Workshop",
  "read": false,
  "createdAt": "2026-09-28T09:30:01.000Z"
}
```

---

## 10. Concurrency & Race Condition Handling

### The Problem
Consider an event with `capacity: 50` and `goingCount: 49`. Exactly 1 seat remains. User A and User B click "Going" at nearly the same instant. In a naive implementation:
1. User A reads `goingCount = 49` (< 50) ➔ OK.
2. User B reads `goingCount = 49` (< 50) ➔ OK.
3. User A writes `goingCount = 50`.
4. User B writes `goingCount = 51`.
The event is overbooked, violating safety constraints.

### The Atomic Transaction Solution
We wrap seat allocation in a Firestore transaction (`runTransaction`):
```typescript
await runTransaction(db, async (transaction) => {
  const eventDoc = await transaction.get(eventRef);
  const eventData = eventDoc.data();

  if (targetStatus === 'GOING') {
    if (eventData.goingCount >= eventData.capacity) {
      throw new Error('EVENT_FULL'); // Aborts transaction atomically
    }
    transaction.update(eventRef, {
      goingCount: eventData.goingCount + 1,
      status: eventData.goingCount + 1 >= eventData.capacity ? 'FULL' : 'PUBLISHED'
    });
    transaction.set(rsvpRef, { status: 'GOING' }, { merge: true });
  }
});
```
If a conflicting write occurs between the read and write phases, Firestore automatically retries the transaction. The second client reads the new count (`50`), fails the `< capacity` check, and is diverted to the FIFO waitlist.

---

## 11. Real-Time Architecture Comparison

| Metric | Polling | Server-Sent Events (SSE) | Cloud Real-Time Listeners (`onSnapshot`) |
| :--- | :--- | :--- | :--- |
| **Communication** | Periodic HTTP GET requests | Unidirectional HTTP stream | Bidirectional managed WebSocket / HTTP stream |
| **Latency** | High (bounded by interval) | Low (< 500ms) | Instantaneous (< 100ms) |
| **Bandwidth** | High (wasteful empty polls) | Efficient | Optimized (differential payloads) |
| **Scalability** | Degrades under high traffic | High | Cloud-managed auto-scaling |
| **Used Here?** | ❌ Too slow for live RSVP | ❌ Unidirectional only | ✅ Used for sub-second counter updates |

---

## 12. Cloud Computing Concepts Demonstrated

1. **Software as a Service (SaaS):** An end-to-end event planning and RSVP portal accessible anywhere via modern web browsers without local installation.
2. **Platform as a Service (PaaS):** Built entirely on Firebase/GCP PaaS services (Auth, Firestore, Hosting, Storage) with zero OS-level administration.
3. **Cloud Database (NoSQL):** Cloud Firestore document and subcollection hierarchical structure providing horizontal sharding and multi-region availability.
4. **Real-Time Data Streaming:** Persistent bi-directional channels updating client-side view models upon document modification without polling.
5. **Serverless Computing:** Serverless data pipelines where backends scale from 0 to thousands of requests on demand.
6. **Optimistic Concurrency Control:** Database-level transactional isolation preventing race conditions during simultaneous booking spikes.
7. **Role-Based Access Control (RBAC):** Principle of least privilege enforced via security rules (`firestore.rules`).
8. **Stateless Frontend Architecture:** Client application maintains state reactively through cloud database subscriptions, allowing instant multi-tab recovery.

---

## 13. Installation & Local Development

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Commands
```bash
# 1. Clone repository
git clone https://github.com/your-username/Real-Time-Cloud-Event-RSVP-Tracker.git
cd Real-Time-Cloud-Event-RSVP-Tracker

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
# Running on http://localhost:3000

# 4. Run automated test suite
npm test

# 5. Build for production
npm run build
```

---

## 14. Environment Variables Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Firebase Project credentials (from the Firebase Console -> Project Settings -> General -> Your apps -> Web):
```env
VITE_FIREBASE_API_KEY="AIzaSyYourActualApiKeyHere"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef12345678"
```
*Note: If credentials are not provided, the application activates an in-browser BroadcastChannel synchronization engine that mirrors Firestore's API and allows full two-browser real-time demonstration locally!*

---

## 15. Automated Testing Verification

The project includes an automated test runner testing all 16 mission-critical cloud conditions:

```bash
npm test
```

### Verified Test Matrix
- `TC-001`: User Registration with valid role assignment (`PASS`)
- `TC-002`: Duplicate Registration rejection (`PASS`)
- `TC-003`: User Login & session verification (`PASS`)
- `TC-004`: Role-Based Authorization — Attendee blocked from creating events (`PASS`)
- `TC-005`: Organizer creates event with positive capacity (`PASS`)
- `TC-006`: Event retrieval by ID (`PASS`)
- `TC-007`: Valid GOING RSVP increments `goingCount` (`PASS`)
- `TC-008`: Duplicate RSVP prevention for same user (`PASS`)
- `TC-009`: State transition: `GOING -> MAYBE` (`PASS`)
- `TC-010`: State transition: `MAYBE -> GOING` (`PASS`)
- `TC-011`: Capacity enforcement & FIFO waitlist position assignment (`PASS`)
- `TC-012`: Automatic FIFO waitlist promotion on attendee cancellation (`PASS`)
- `TC-013`: Concurrent RSVP race condition handling via parallel requests (`PASS`)
- `TC-014`: Organizer announcement & in-app notification dispatch (`PASS`)
- `TC-015`: Unauthorized event modification rejection (`PASS`)
- `TC-016`: Derived analytics calculation correctness (`PASS`)

---

## 16. Cloud Deployment Instructions

### Deploy to Firebase Hosting
```bash
# 1. Install Firebase CLI globally
npm install -g firebase-tools

# 2. Login to your Google / Firebase Account
firebase login

# 3. Initialize Firebase in the repository root
firebase init
# - Select: Firestore, Storage, Hosting
# - Public directory: dist
# - Single-page app rewrite: Yes
# - Overwrite firestore.rules: No (keep existing rules)

# 4. Build application
npm run build

# 5. Deploy to Firebase Cloud
firebase deploy
```

---

## 17. Two-Browser Live Demonstration Guide (Viva / Presentation)

To prove true real-time push functionality without manual refreshes:

1. Open **Browser Window 1** (e.g., Google Chrome) and log in as **Alex Rivera (Organizer)**.
2. Navigate to **Dashboard** or **Manage Events**.
3. Open **Browser Window 2** (e.g., Chrome Incognito or Safari) and log in as **Sam Chen (Attendee)**.
4. In Browser 2, navigate to **Browse Events** and find *"Cloud Computing & Serverless Architecture Workshop"*.
5. In Browser 2, click **Going**.
6. **Watch Browser 1:** The Going counter immediately increments (e.g., `2 -> 3`), available seats decrement, and the capacity bar advances in real time without refreshing the page!

---

## 18. Viva & Interview Questions & Answers

### Q1: Explain your project.
**Answer:** I developed a Real-Time Cloud-Based Event Planning & RSVP Tracker. The platform allows event organizers to create events, manage capacity, broadcast announcements, and monitor real-time attendance analytics. Attendees can discover events, reserve seats, update their RSVP state (Going, Maybe, Not Going), and join a waitlist if capacity is full. The key architectural achievement is push-based real-time synchronization using Firestore listeners and concurrency-safe atomic transactions to ensure capacity is never exceeded during simultaneous bookings.

### Q2: What does "real-time" mean in your project?
**Answer:** Real-time means updates are pushed from the cloud database to active client browsers via persistent streams (`onSnapshot`) with sub-second latency. When an attendee in one browser clicks "Going", the organizer's dashboard in another window updates its counters immediately without any manual page reload.

### Q3: Why did you use Cloud Computing instead of a traditional local server?
**Answer:** Cloud services like Firebase provide serverless elasticity, automated horizontal scaling, managed multi-region replication, and built-in security. Event platforms frequently experience massive traffic spikes when invitations open; a cloud architecture scales compute and database resources automatically without provisioning physical hardware.

### Q4: How do you prevent duplicate RSVPs?
**Answer:** By storing RSVPs in a subcollection keyed by user ID (`events/{eventId}/rsvps/{userId}`). Since Firestore document IDs within a collection must be unique, a user can have only one active RSVP document per event. If they change their status, the document is updated rather than duplicated.

### Q5: How did you handle event capacity and race conditions?
**Answer:** We prevent overbooking by executing reservations inside atomic database transactions (`runTransaction`). The transaction reads the current `goingCount`, verifies it is strictly less than `capacity`, increments the counter, and commits the write. If multiple requests hit the server simultaneously, the database serializes them; the first request takes the seat, and the subsequent request is safely rejected and routed to the waitlist.

### Q6: What happens when an event is full?
**Answer:** The event status updates to `FULL`, and the "Going" button is disabled. Attendees can choose to join the FIFO waitlist (`events/{eventId}/waitlist/{userId}`). Each user receives a queue position (`#1`, `#2`, etc.).

### Q7: How does waitlist promotion work?
**Answer:** When a confirmed "Going" attendee cancels their RSVP, a transaction decrements the `goingCount` and checks the waitlist subcollection. The attendee at position #1 is automatically promoted to `GOING`, their position is resolved, and an in-app notification is sent notifying them of their confirmed seat.

### Q8: What is the difference between REST APIs and WebSockets in this system?
**Answer:** REST APIs follow a request-response pattern suitable for discrete CRUD operations. WebSockets (and Firestore real-time listener streams) keep a persistent two-way connection open, allowing the server to push state changes to the browser instantaneously without polling overhead.

### Q9: How is security and Role-Based Access Control enforced?
**Answer:** We enforce RBAC via `firestore.rules`. Organizers can modify only events where `resource.data.organizerId == request.auth.uid`. Attendees can write only to their own RSVP subcollection (`/rsvps/{userId}` where `userId == request.auth.uid`) and cannot modify event capacity or details. Role escalation is prevented by blocking modifications to the `role` field on user profiles.

### Q10: How could the system be improved in the future?
**Answer:** Future enhancements include QR-based physical badge check-in scanners using device cameras, Web Push notifications via Firebase Cloud Messaging (FCM), iCalendar (.ics) synchronization, and payment gateway integration for ticketed events.

---

## 19. Resume & Portfolio Bullet Points

- **Resume Bullet 1:** Architected a real-time event planning and RSVP tracking web platform using React 19, TypeScript, and Google Cloud Firestore, reducing state synchronization latency across distributed clients to under 100ms.
- **Resume Bullet 2:** Implemented concurrency-safe atomic database transactions (`runTransaction`) to resolve simultaneous booking race conditions and automated a FIFO waitlist promotion pipeline.
- **Resume Bullet 3:** Enforced Role-Based Access Control (RBAC) via declarative Firestore security rules and built a live organizer analytics dashboard computing capacity utilization and attendance conversion.

**2-Line Project Summary:**
A cloud-native real-time event planning and RSVP tracker utilizing Firestore listeners and atomic transactions to guarantee zero-overbooking capacity control, FIFO waitlists, and live dashboard metrics.

---

## 20. Author & License

- **Course:** Cloud Computing Course Project Capstone
- **Stack:** React 19, TypeScript, Vite, Tailwind CSS, Google Cloud Firebase
- **License:** MIT License
