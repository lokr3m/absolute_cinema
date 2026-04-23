# Software Requirements Specification (SRS)
**Project:** Cinema Web Application  
**Version:** 1.1  
**Last updated:** 2026-02-12  

## Table of Contents
1. Introduction  
2. Overall Description  
3. Functional Requirements (FR)  
4. Non-Functional Requirements (NFR)  
5. System Models  
6. External Interface Requirements  
7. Verification & Validation  
8. Maintenance & Support  
9. Appendices  

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for a cinema web application that lets visitors browse movies, view schedules, select seats, and complete a simulated booking. It also describes the admin interface for managing films, halls, and sessions.

### 1.2 Scope
**In scope**
- Public browsing of movies and schedules
- Seat selection with hold logic
- Simulated booking flow (no real payments)
- Admin CRUD for films, halls, sessions
- Backend APIs for public and admin use
- Basic observability and health checks

**Out of scope (MVP)**
- Real payments
- Loyalty programs
- Kiosk/POS hardware integration
- Multi-tenant cinemas

### 1.3 Definitions
- **Hold**: A temporary reservation of a seat.
- **Booking**: A confirmed reservation tied to user contact info.
- **Session**: A scheduled screening (film + hall + time).

---

## 2. Overall Description

### 2.1 Product Perspective
A standalone web platform with:
- Vue-based frontend
- Express/MongoDB backend
- Seat/booking workflow
- Admin management tools

### 2.2 Product Features (Summary)
- Movie catalog and schedule browsing
- Seat map with availability states
- Simulated booking and confirmation
- Admin CRUD for core entities
- Public + Admin API endpoints
- Health and logging endpoints

### 2.3 User Classes
- **Visitor**: Browses movies and books tickets
- **Registered User (Optional)**: Manages bookings
- **Admin**: Manages films, halls, sessions
- **Support/Developer**: Monitors logs and diagnostics

### 2.4 Operating Environment
- Modern browsers (latest 2 versions)
- Mobile support (iOS 15+, Android 12+)
- Linux server runtime
- MongoDB v4+

### 2.5 Constraints
- No real payments in MVP
- Seat holds expire (default 8 min)
- Poster image size limit (≤ 2 MB)
- Admin-only access to CRUD APIs
- UTC storage for timestamps

### 2.6 Assumptions
- Email/log delivery available for confirmations
- Initial data is seeded or created by admins

---

## 3. Functional Requirements (FR)

### 3.1 Public UI
- **FR-1 (M):** Home page shows featured films; navigation to details.
- **FR-2 (M):** Movie details show poster, synopsis, runtime, upcoming sessions.
- **FR-3 (M):** Filtering by title/genre/date/cinema within 1s p95.
- **FR-4 (S):** Empty states provide guidance.

### 3.2 Schedule & Sessions
- **FR-5 (M):** 7-day schedule view by cinema/date.
- **FR-6 (M):** Date changes update view within 800 ms p95.
- **FR-7 (M):** Sessions list start time + language/subtitle tags.

### 3.3 Seat Map & Selection
- **FR-8 (M):** Seat map states: Available, Held, Sold, Blocked, Accessible.
- **FR-9 (M):** Seat selection creates atomic hold (default 8 min).
- **FR-10 (M):** Expired holds released within 60s.
- **FR-11 (M):** Max seats per booking = 10 (configurable).
- **FR-12 (S):** Accessible seats require acknowledgment.

### 3.4 Booking (Simulated)
- **FR-13 (M):** Booking requires only name + email.
- **FR-14 (M):** Booking confirmation persists record + Booking ID.
- **FR-15 (M):** Booking failure releases holds and shows clear error.

### 3.5 Admin Panel
- **FR-16 (M):** Admin login required; lockout after 5 failures.
- **FR-17 (M):** CRUD films + poster upload (≤ 2 MB).
- **FR-18 (M):** CRUD sessions; prevent overlaps with 15-min buffer.
- **FR-19 (M):** CRUD halls + seat maps.
- **FR-20 (S):** Audit log for critical admin changes.

### 3.6 API Layer
- **FR-21 (M):** Public API: list films, details, schedules.
- **FR-22 (M):** Booking API: hold, status, confirm (idempotent).
- **FR-23 (M):** Admin API: secured CRUD endpoints.
- **FR-24 (S):** API documentation includes schemas + examples.

### 3.7 Optional Accounts
- **FR-25 (S):** User registration + login.
- **FR-26 (S):** View booking history (last 24 months).

### 3.8 Operations
- **FR-27 (M):** `/health` endpoints for liveness/readiness.
- **FR-28 (M):** Container build + deploy manifests (when added).
- **FR-29 (M):** Structured JSON logs + error tracking.

### 3.9 Accessibility & Localization
- **FR-30 (M):** WCAG 2.2 AA for critical flows.
- **FR-31 (S):** EN + ET localization scaffold.
- **FR-32 (S):** Privacy-safe analytics + opt-out.

### 3.10 Error Handling
- **FR-33 (M):** Clear, user-friendly error messages.
- **FR-34 (S):** Categorized booking errors (validation/hold/conflict).

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance
- **NFR-1:** Public API ≤ 300 ms p95 under 500 concurrent reads.
- **NFR-2:** Seat map render ≤ 2s median for 250 seats.
- **NFR-3:** Booking confirmation ≤ 4s median (excluding user time).

### 4.2 Security
- **NFR-4:** TLS 1.2+; HSTS enabled.
- **NFR-5:** Password hashing with Argon2id or bcrypt.
- **NFR-6:** Auth endpoints rate-limited.
- **NFR-7:** Access tokens expire within 60 minutes.
- **NFR-8:** No PII in logs; redact sensitive fields.

### 4.3 Usability & Reliability
- **NFR-9:** Booking completion within 3 minutes (median).
- **NFR-10:** ≥95% success rate in moderated tests.
- **NFR-11:** ≥99% uptime in staging tests.
- **NFR-12:** Zero double-selling incidents.

### 4.4 Scalability & Maintainability
- **NFR-13:** Scale to 2,000 concurrent users.
- **NFR-14:** ≥80% unit test coverage for core modules.
- **NFR-15:** CI suite ≤ 10 minutes.
- **NFR-16:** ≥95% E2E pass rate on main.

### 4.5 Observability & Compliance
- **NFR-17:** Correlation IDs in logs.
- **NFR-18:** Error tracking within 2 minutes.
- **NFR-19:** Dashboards for latency + error rate.
- **NFR-20:** WCAG 2.2 AA for core flows.
- **NFR-21:** Analytics opt-out.
- **NFR-22:** Contact data deletion within 14 days.
- **NFR-23:** Portable container builds.

---

## 5. System Models

### 5.1 Use Cases
- Visitors: browse, filter, select seats, book.
- Admins: manage films, sessions, halls.
- System: holds, confirmations, logging.

### 5.2 Sequence Flow (Booking)
1. User selects session → load seat map  
2. Select seats → create holds  
3. Enter contact info  
4. API confirms booking  
5. Seats → Sold + confirmation  

---

## 6. External Interface Requirements

### 6.1 User Interface
- Responsive layout ≥ 320px
- Seat map with state legend
- Admin CRUD tables with forms

### 6.2 Software Interfaces
- Public API: `/api/films`, `/api/sessions`
- Booking API: hold, status, confirm
- Admin API: CRUD for films/sessions/halls

### 6.3 Communication
- HTTPS only
- JSON payloads
- Standard HTTP status codes

---

## 7. Verification & Validation

- Must-have FR/NFR are required before release.
- ≥95% automated tests pass on main.
- Performance, accessibility, and health checks validated in staging.

---

## 8. Maintenance & Support

- Monthly dependency updates.
- Security patches prioritized.
- Backups per environment policy.
- Incident response within 48h for P1.

---

## 9. Appendices

### 9.1 Glossary
- **Hold**: Temporary seat reservation.
- **Booking ID**: Unique confirmation ID.
- **p95**: 95th percentile latency.

### 9.2 Revision History
- v1.1 (2026-02-12): Documentation rewrite and formatting update.
- v1.0 (2025-11-18): Initial SRS for MVP.