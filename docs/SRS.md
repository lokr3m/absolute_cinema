# Software Requirements Specification (SRS)
Project: Cinema Web Application

1. Introduction

1.1 Purpose
The purpose of this document is to specify the requirements for a cinema web application that allows visitors to browse movies, view showtimes, visualize seat availability, and complete a simulated booking with confirmation. The system provides an administrative interface to manage films, sessions, and halls.

1.2 Scope
The system includes:
- Public website for browsing films and schedules, seat selection, and simulated booking.
- Administrative panel for secure CRUD of films, sessions, and halls.
- Backend services and APIs for public read operations, seat locking and bookings, and admin operations.
- Initial deployment and observability tooling.
- Optional user accounts (registration/login, booking history) and post-MVP polish (localization, analytics, accessibility improvements).

Out of scope for the initial release:
- Real payment processing (card capture/charging).
- Loyalty/membership programs.
- Kiosk/POS hardware integrations.
- Multi-tenant/multi-chain synchronization.

2. General Description

2.1 Product Perspective
The application is a standalone web platform with a Vue-based frontend and a backend API. A MongoDB database (via Mongoose) persists films, cinemas, halls, sessions, seats, bookings, and (optionally) users. The system integrates with an email/logging mechanism for booking confirmations. Simulated payment confirms bookings without charging a card.

2.2 Product Features
- Public UI: Home, movie details, search and filtering.
- Schedule browsing: Cinema and date-based showtimes, 7-day horizon.
- Seat map: Visual selection with seat locking to prevent double-booking.
- Simulated booking: Contact information capture and confirmation email/logging.
- Admin panel: Authentication and CRUD for films, sessions, and halls; seat blocking.
- APIs: Public read API; booking API; admin API.
- Operations: Health checks; structured logging and error tracking; deployable container images (planned).
- Optional: User accounts (registration/login) and booking history.
- Polish: Localization scaffolding (EN + ET), privacy-safe analytics, accessibility improvements.

2.3 User Classes and Characteristics
- Visitor: Unauthenticated; browses films/schedules and completes simulated bookings by providing contact info.
- Registered User (optional): Authenticated; manages account and views booking history.
- Admin: Authenticated; manages films, sessions, halls; can block seats and adjust schedules.
- Support/Developer: Reviews logs and health dashboards to troubleshoot.

2.4 Operating Environment
- Client: Latest two versions of Chrome, Firefox, Edge, Safari; iOS 15+ and Android 12+ mobile browsers.
- Server: Linux host running Node.js (Express.js).
- Database: MongoDB (v4+), accessed via Mongoose ODM.
- Containerization: Docker is a deployment target once manifests are added; not required to run locally.
- Time: All timestamps stored in UTC; displayed in user’s local time.
- Accessibility: WCAG 2.2 AA target on critical flows.

2.5 Design and Implementation Constraints
- Simulated payments only in MVP; no storage of payment card data.
- Seat hold duration defaults to 8 minutes (configurable range: 5–10 minutes).
- Image uploads (posters) ≤ 2MB per file; responsive sizes generated.
- Authentication for admin endpoints; role-based authorization at API layer.
- MongoDB constraints: use unique compound indexes and atomic updates; use transactions (Mongoose sessions) when a replica set is available.
- Privacy-safe analytics (no PII), opt-out supported.
- CI must run unit and E2E suites; deploy artifacts should be reproducible.

2.6 Assumptions and Dependencies
- Email delivery or dev logging is available for booking confirmations.
- Initial content and schedule data created by admins or seed scripts.
- Error tracking (e.g., Sentry) and simple monitoring available in staging.

3. Functional Requirements

Conventions: FR-x (Functional Requirement). Priority: M (Must), S (Should), C (Could). All requirements are SMART.

3.1 Public UI — Home, Movie Pages, Search
- FR-1 (M): The Home page shall display “Now Showing” and featured films with poster and title; clicking a film navigates to the movie detail page. The primary content must render within 2.5 seconds (median) on broadband.
- FR-2 (M): The Movie Detail page shall display poster, synopsis (≤ 500 characters), runtime, and previews of the next up to 5 upcoming sessions. Core details must appear within 1.5 seconds (median) after navigation.
- FR-3 (M): Users shall be able to filter films/sessions by title, genre, date, and cinema. Combined filters shall respond within 1 second (p95) for catalogs of up to 200 films or 500 sessions.
- FR-4 (S): Empty states shall be shown when no films or sessions match filters, providing clear guidance to adjust filters.

3.2 Schedule & Session Browsing
- FR-5 (M): Users shall view sessions by cinema and date for the next 7 calendar days by default, with navigation to other days within this window. Initial schedule load p95 ≤ 300 ms at the API layer.
- FR-6 (M): A date picker or tabs shall allow users to change the selected date; the schedule view shall update within 800 ms (p95) of selection.
- FR-7 (M): Session listings shall include start time, language/subtitle tags where applicable, and a call-to-action to select seats.

3.3 Seat Map & Selection
- FR-8 (M): The system shall render a hall’s seat map with states: Available, Held, Sold, Blocked/Disabled, and Accessible. Initial render must complete ≤ 2 seconds (median) for halls with up to 250 seats.
- FR-9 (M): Selecting a seat shall atomically create a seat hold with an expiration timestamp set to now + 8 minutes (configurable). Concurrent seat selections shall not result in double assignment.
- FR-10 (M): The system shall automatically release expired seat holds within 60 seconds after expiration, returning seats to Available state.
- FR-11 (M): The maximum number of seats per booking shall be limited to 10 (configurable).
- FR-12 (S): Accessible seats shall require user acknowledgment that accessibility requirements apply to their party.

3.4 Booking Flow & Confirmation (Simulated)
- FR-13 (M): Users shall complete booking without real payment by providing contact information (full name and email). The end-to-end flow (session selection to confirmation) shall complete in ≤ 3 minutes (median) for new users.
- FR-14 (M): On booking confirmation, the system shall persist a booking record, convert Held seats to Sold, generate a unique Booking ID, and deliver a confirmation via email or log a confirmation entry in development environments within 1 minute of completion.
- FR-15 (M): If booking fails at any step (e.g., validation), all associated seat holds shall be released immediately, and a clear, actionable error message shall be displayed.

3.5 Administrative Panel
- FR-16 (M): Admin login shall be required to access the admin UI and all CRUD operations. After 5 failed login attempts, the account shall be locked for 15 minutes. Admin sessions shall expire after 60 minutes of inactivity.
- FR-17 (M): Admins shall be able to create, edit, and delete films, including setting metadata and uploading poster images (PNG/JPG ≤ 2MB). The system shall generate responsive image sizes.
- FR-18 (M): Admins shall be able to create and edit sessions with fields: film, hall, start time (UTC), language/subtitle tags, and base price. Overlapping sessions in the same hall shall be prevented, enforcing a 15-minute buffer around each session for cleanup.
- FR-19 (M): Admins shall be able to create and edit halls, define seat maps (rows, columns, seat labels), and mark seats as Blocked/Disabled or Accessible.
- FR-20 (S): Admin changes shall be audited (who, what, when), with before/after values for critical fields (sessions, halls).

3.6 API Layer
- FR-21 (M): Public Read API shall expose endpoints to list films, retrieve film details, and fetch schedules by cinema and date. Responses shall include only necessary fields and support pagination where applicable.
- FR-22 (M): Booking API shall provide endpoints for seat hold, hold status, and booking confirmation. Operations must be idempotent where applicable and protect against race conditions using atomic updates and unique indexes.
- FR-23 (M): Admin API shall provide secured endpoints for films, sessions, and halls CRUD, enforcing authorization checks and input validations (e.g., hall capacity, session overlaps).
- FR-24 (S): API documentation shall describe request/response schemas, known error codes, and example payloads.

3.7 User Accounts (Optional)
- FR-25 (S): Users shall be able to register and log in to manage their bookings. Passwords must meet complexity policy: at least 10 characters, including uppercase, lowercase, digit, and special character.
- FR-26 (S): Registered users shall view past and upcoming bookings for the last 24 months and re-download confirmation artifacts.

3.8 Operations & Deployment
- FR-27 (M): The system shall expose /health endpoints (liveness/readiness) that complete within 200 ms (p95) under normal load and reflect DB connectivity for readiness.
- FR-28 (M): The project shall include Dockerfiles and deployment manifests enabling deterministic builds and reproducible staging deployments (when introduced).
- FR-29 (M): The system shall emit structured logs (JSON) with request correlation IDs and integrate error tracking in staging.

3.9 Accessibility, Localization, and Analytics
- FR-30 (M): The public UI shall support keyboard navigation, focus indicators, alt text for images, proper labels, and sufficient color contrast on critical flows (browse, schedule, seat map, booking).
- FR-31 (S): The UI shall provide localization scaffolding with English and Estonian locales; a language toggle shall persist the user’s preference for the session and fall back to English for missing translations.
- FR-32 (S): The application shall emit privacy-safe analytics events for pageviews and booking funnel steps without PII and provide a user opt-out mechanism.

3.10 Error Handling & Messaging
- FR-33 (M): All user-facing errors shall be clear, non-technical, and provide guidance for recovery (e.g., retry, change selection, contact support).
- FR-34 (S): The system shall categorize booking errors (validation, hold expired, concurrency conflict) to aid in user messaging and operator troubleshooting.

4. Non-Functional Requirements (NFRs)

4.1 Performance
- NFR-1 (M): Public Read API latency shall be ≤ 300 ms p95 under 500 concurrent read requests.
- NFR-2 (M): Seat map initial render shall complete ≤ 2 seconds (median) for halls up to 250 seats; seat hold/unhold operations shall complete ≤ 250 ms p95.
- NFR-3 (M): The full booking flow (from proceeding to booking to receiving confirmation response) shall complete ≤ 4 seconds median, excluding user think time.

4.2 Security
- NFR-4 (M): All traffic must use TLS 1.2+; HSTS must be enabled on web endpoints; no mixed content.
- NFR-5 (M): Passwords shall be hashed using Argon2id or bcrypt with a cost calibrated to ≥ 100 ms on server hardware.
- NFR-6 (M): Authentication endpoints shall be rate-limited to at most 10 attempts per minute per IP; accounts lock after 5 failed attempts for 15 minutes.
- NFR-7 (S): Access tokens shall expire within 60 minutes; refresh/session cookies shall be httpOnly and Secure.
- NFR-8 (M): No PII shall be written to logs; sensitive fields shall be redacted in structured logs and error tracking.

4.3 Usability
- NFR-9 (M): First-time visitors shall be able to discover and complete a booking in ≤ 3 minutes median during usability tests (n ≥ 15).
- NFR-10 (S): The application shall maintain a 95% or higher task success rate for the booking flow in moderated tests.

4.4 Reliability
- NFR-11 (M): The system shall achieve ≥ 99.0% uptime in staging during testing windows; Mean Time to Recovery (MTTR) for P1 incidents ≤ 60 minutes.
- NFR-12 (M): Double-selling seats shall be prevented by design; measured incidents shall be 0 across load/concurrency tests.

4.5 Scalability
- NFR-13 (S): The system shall scale to 2,000 concurrent users while keeping critical API p95 latency ≤ 600 ms via horizontal scaling and caching.

4.6 Maintainability & Testability
- NFR-14 (M): Core booking and seat locking modules shall have ≥ 80% unit test coverage.
- NFR-15 (M): The CI pipeline shall execute unit tests and a smoke E2E suite within ≤ 10 minutes wall-clock time.
- NFR-16 (S): E2E success rate on main shall be ≥ 95% before deployment; flaky tests triaged within 2 business days.

4.7 Observability
- NFR-17 (M): Structured logs must include correlation IDs for inbound requests and key domain events (hold created, hold expired, booking confirmed).
- NFR-18 (M): Error tracking must capture unhandled exceptions and API 5xx responses with alerting within 2 minutes of threshold breach.
- NFR-19 (S): Dashboards shall visualize error rate, API latency (p50/p95), and seat-lock churn per session.

4.8 Accessibility
- NFR-20 (M): Critical flows (browse, schedule, seat map, booking) shall meet WCAG 2.2 AA for keyboard navigation, focus visibility, semantics, alt text, labels, and color contrast.

4.9 Legal & Privacy
- NFR-21 (M): Analytics must be privacy-safe (no PII collection) and provide an opt-out control.
- NFR-22 (S): If contact emails are stored, users shall be able to request deletion of their contact data within 14 days.

4.10 Portability
- NFR-23 (S): Container images and manifests shall enable deployment to alternative container runtimes or clouds with no application code changes once available.

5. System Models

5.1 Use Case Diagram (Conceptual)
- Visitors: Browse Movies, Search/Filter, View Schedules, Select Seats, Confirm Booking.
- Admins: Log In, Manage Films, Manage Halls & Seat Maps, Schedule Sessions.
- System: Hold Seats, Release Holds, Confirm Bookings, Send/Log Confirmations.

5.2 Sequence Diagrams (Narrative)
- Booking (Simulated):
  1) Visitor selects session → load seat map.
  2) Visitor selects seats → API creates holds (expiry: now + 8 min).
  3) Visitor enters contact info → submit booking.
  4) API validates holds and persists booking atomically.
  5) Seats transition Held → Sold; confirmation email/log dispatched.
- Admin Session Creation:
  1) Admin authenticates.
  2) Admin submits session details.
  3) API validates overlaps and hall capacity.
  4) Session persisted and visible in schedule.

5.3 Data Flow Diagram (Level 1)
- Public UI → Public API (films, schedules).
- Booking UI → Booking API (hold, confirm).
- Admin UI → Admin API (films, sessions, halls).
- Backend ↔ Database (CRUD domain entities).
- Backend → Email/Logger (booking confirmations).
- Observability: Backend → Logging/Error tracking/Health endpoints.

6. External Interface Requirements

6.1 User Interfaces
- Responsive layout ≥ 320 px, with accessible navigation and focus indicators.
- Seat map with color-coded legend for seat states; screen-reader labels for seat positions and states.
- Admin UI with filterable/sortable tables, inline or modal forms for CRUD.

6.2 Hardware Interfaces
- None for initial web release.

6.3 Software Interfaces
- Public API endpoints for films, film details, schedules (e.g., GET /api/films, GET /api/films/:id, GET /api/sessions, GET /api/films/:id/sessions).
- Booking API endpoints: create hold, check hold, confirm booking (idempotent, atomic updates with unique indexes).
- Admin API endpoints: films, sessions, halls CRUD with authorization.
- Email/logging provider for confirmation delivery (dev env may log).
- Error tracking and monitoring endpoints/agents.

6.4 Communication Interfaces
- HTTPS only; JSON payloads; standard HTTP status semantics.
- Polling or short-lived fetch for seat map updates (real-time channels optional later).
- Exponential backoff (max 5 retries) on transient 5xx/timeout failures for non-interactive jobs.

7. Testing and Validation

7.1 Test Cases

**7.1.1 Public UI — Home, Movie Pages, Search (FR-1 to FR-4)**

**TC-001: Home Page Display and Performance**
- **Mapped to:** FR-1
- **Description:** Verify that the Home page displays "Now Showing" and featured films correctly and meets performance requirements.
- **Preconditions:** Database contains at least 5 active films with posters and titles.
- **Test Steps:**
  1. Navigate to the Home page
  2. Observe the "Now Showing" section
  3. Measure page load time from navigation start to primary content render
  4. Click on a film poster or title
- **Expected Results:**
  - "Now Showing" section displays featured films with poster and title
  - Primary content renders within 2.5 seconds (median) on broadband connection
  - Clicking a film navigates to the correct movie detail page
- **Priority:** Must

**TC-002: Home Page Film Navigation**
- **Mapped to:** FR-1
- **Description:** Verify that clicking on film elements from the Home page navigates to the correct movie detail page.
- **Preconditions:** Home page is loaded with multiple films displayed.
- **Test Steps:**
  1. Identify a specific film on the Home page
  2. Click on the film's poster
  3. Verify navigation to detail page
  4. Return to Home page
  5. Click on the same film's title
- **Expected Results:**
  - Both poster and title clicks navigate to the same movie detail page
  - Navigation is smooth without errors
- **Priority:** Must

**TC-003: Movie Detail Page Content Display**
- **Mapped to:** FR-2
- **Description:** Verify that the Movie Detail page displays all required information correctly.
- **Preconditions:** A film exists in the database with poster, synopsis, runtime, and upcoming sessions.
- **Test Steps:**
  1. Navigate to a specific movie detail page
  2. Verify poster is displayed
  3. Verify synopsis text is present and readable
  4. Count the number of characters in the synopsis
  5. Verify runtime is displayed
  6. Check the number of session previews shown
- **Expected Results:**
  - Poster image is displayed correctly
  - Synopsis is displayed and does not exceed 500 characters
  - Runtime is shown in a clear format (e.g., "120 min" or "2h 00m")
  - Up to 5 upcoming sessions are previewed
  - All core details appear within 1.5 seconds (median) after navigation
- **Priority:** Must

**TC-004: Movie Detail Page Performance**
- **Mapped to:** FR-2
- **Description:** Verify that movie detail page content loads within the specified time budget.
- **Preconditions:** System is under normal load conditions.
- **Test Steps:**
  1. Clear browser cache
  2. Navigate to a movie detail page
  3. Measure time from navigation start to when core details are visible
  4. Repeat for at least 10 different films
  5. Calculate median load time
- **Expected Results:**
  - Core details (poster, synopsis, runtime, sessions) appear within 1.5 seconds (median)
  - No timeout errors occur
- **Priority:** Must

**TC-005: Film and Session Filtering - Title**
- **Mapped to:** FR-3
- **Description:** Verify that users can filter films by title.
- **Preconditions:** Database contains multiple films with different titles.
- **Test Steps:**
  1. Navigate to the films/sessions browse page
  2. Enter a partial film title in the title filter
  3. Measure response time
  4. Verify filtered results
  5. Clear the filter and verify all films return
- **Expected Results:**
  - Only films matching the title filter are displayed
  - Filter responds within 1 second (p95) for catalogs up to 200 films
  - Clearing filter returns all films
- **Priority:** Must

**TC-006: Film and Session Filtering - Genre**
- **Mapped to:** FR-3
- **Description:** Verify that users can filter films by genre.
- **Preconditions:** Database contains films across multiple genres.
- **Test Steps:**
  1. Navigate to the films/sessions browse page
  2. Select a specific genre from the genre filter
  3. Measure response time
  4. Verify all displayed films belong to the selected genre
  5. Select a different genre and verify results update
- **Expected Results:**
  - Only films of the selected genre are displayed
  - Filter responds within 1 second (p95)
  - Changing genre updates results correctly
- **Priority:** Must

**TC-007: Film and Session Filtering - Date**
- **Mapped to:** FR-3
- **Description:** Verify that users can filter sessions by date.
- **Preconditions:** Database contains sessions across multiple dates.
- **Test Steps:**
  1. Navigate to the sessions browse page
  2. Select a specific date
  3. Measure response time
  4. Verify only sessions for the selected date are shown
- **Expected Results:**
  - Only sessions on the selected date are displayed
  - Filter responds within 1 second (p95)
  - Sessions are sorted chronologically
- **Priority:** Must

**TC-008: Film and Session Filtering - Cinema**
- **Mapped to:** FR-3
- **Description:** Verify that users can filter sessions by cinema location.
- **Preconditions:** Database contains sessions at multiple cinema locations.
- **Test Steps:**
  1. Navigate to the sessions browse page
  2. Select a specific cinema from the cinema filter
  3. Measure response time
  4. Verify all displayed sessions are at the selected cinema
- **Expected Results:**
  - Only sessions at the selected cinema are displayed
  - Filter responds within 1 second (p95)
- **Priority:** Must

**TC-009: Combined Filters**
- **Mapped to:** FR-3
- **Description:** Verify that multiple filters can be applied simultaneously.
- **Preconditions:** Database contains 200 films and 500 sessions.
- **Test Steps:**
  1. Navigate to the browse page
  2. Apply title filter
  3. Add genre filter
  4. Add date filter
  5. Add cinema filter
  6. Measure combined filter response time
- **Expected Results:**
  - All filters apply correctly together
  - Results match all selected criteria
  - Combined filters respond within 1 second (p95)
- **Priority:** Must

**TC-010: Empty State Display**
- **Mapped to:** FR-4
- **Description:** Verify that empty states are shown when no films or sessions match filters.
- **Preconditions:** Database contains films and sessions.
- **Test Steps:**
  1. Navigate to the browse page
  2. Apply filters that yield no results (e.g., non-existent title)
  3. Observe the displayed message
  4. Verify guidance is provided
- **Expected Results:**
  - Empty state message is displayed clearly
  - Message provides guidance to adjust filters
  - No error messages or broken UI elements
- **Priority:** Should

**7.1.2 Schedule & Session Browsing (FR-5 to FR-7)**

**TC-011: Default Schedule View - 7 Days**
- **Mapped to:** FR-5
- **Description:** Verify that users can view sessions for the next 7 calendar days by default.
- **Preconditions:** Database contains sessions scheduled within the next 7 days.
- **Test Steps:**
  1. Navigate to the schedule page
  2. Verify the default date range displayed
  3. Check that sessions for today and the next 6 days are accessible
  4. Measure initial schedule load time
- **Expected Results:**
  - Schedule shows sessions for the next 7 calendar days
  - Initial schedule load p95 ≤ 300 ms at API layer
  - All days within the window are navigable
- **Priority:** Must

**TC-012: Schedule View by Cinema and Date**
- **Mapped to:** FR-5
- **Description:** Verify that users can view sessions filtered by cinema and specific date.
- **Preconditions:** Multiple cinemas have sessions across different dates.
- **Test Steps:**
  1. Navigate to the schedule page
  2. Select a specific cinema
  3. Select a specific date within the 7-day window
  4. Verify displayed sessions match the selection
  5. Measure response time
- **Expected Results:**
  - Only sessions for the selected cinema and date are shown
  - Response time ≤ 300 ms p95 at API layer
- **Priority:** Must

**TC-013: Date Navigation - Date Picker**
- **Mapped to:** FR-6
- **Description:** Verify that the date picker allows users to change the selected date.
- **Preconditions:** Schedule page is loaded with default date.
- **Test Steps:**
  1. Locate the date picker or date tabs
  2. Select a different date within the 7-day window
  3. Measure time for schedule view to update
  4. Verify sessions displayed match the new date
- **Expected Results:**
  - Date picker/tabs are clearly visible and functional
  - Schedule view updates within 800 ms (p95) of date selection
  - Displayed sessions match the selected date
- **Priority:** Must

**TC-014: Date Navigation - Tab Navigation**
- **Mapped to:** FR-6
- **Description:** Verify that date tabs (if present) allow quick navigation between days.
- **Preconditions:** Schedule page displays date tabs for the 7-day window.
- **Test Steps:**
  1. Click on different date tabs sequentially
  2. Measure update time for each change
  3. Verify correct sessions are shown for each date
- **Expected Results:**
  - Each tab click updates the schedule view
  - Update occurs within 800 ms (p95)
  - Sessions match the selected tab's date
- **Priority:** Must

**TC-015: Session Listing Information**
- **Mapped to:** FR-7
- **Description:** Verify that session listings include all required information.
- **Preconditions:** Sessions exist with various languages and subtitle options.
- **Test Steps:**
  1. Navigate to a schedule view with multiple sessions
  2. Examine each session listing
  3. Verify start time is displayed
  4. Check for language/subtitle tags where applicable
  5. Locate the call-to-action (CTA) to select seats
- **Expected Results:**
  - Each session shows start time in clear format
  - Language and subtitle tags are visible when applicable
  - "Select Seats" or similar CTA button is present and clickable
- **Priority:** Must

**7.1.3 Seat Map & Selection (FR-8 to FR-12)**

**TC-016: Seat Map Rendering with All States**
- **Mapped to:** FR-8
- **Description:** Verify that the seat map renders correctly with all seat states.
- **Preconditions:** A hall has seats in all states: Available, Held, Sold, Blocked/Disabled, and Accessible.
- **Test Steps:**
  1. Navigate to a session's seat selection page
  2. Observe the seat map
  3. Identify seats in each state (Available, Held, Sold, Blocked, Accessible)
  4. Verify visual differentiation (color, icon, label)
  5. Measure initial render time
- **Expected Results:**
  - All seat states are visually distinct
  - Seat map renders within 2 seconds (median) for halls up to 250 seats
  - Legend or guide explains seat state colors/symbols
- **Priority:** Must

**TC-017: Seat Map Performance for Large Halls**
- **Mapped to:** FR-8
- **Description:** Verify seat map rendering performance for halls with maximum seat count.
- **Preconditions:** A hall configured with 250 seats.
- **Test Steps:**
  1. Navigate to seat selection for a session in the 250-seat hall
  2. Measure time from page load to full seat map render
  3. Repeat test 10 times and calculate median
- **Expected Results:**
  - Median render time ≤ 2 seconds
  - No rendering errors or missing seats
  - Interactive elements (seat selection) are responsive
- **Priority:** Must

**TC-018: Atomic Seat Hold Creation**
- **Mapped to:** FR-9
- **Description:** Verify that selecting a seat creates an atomic hold with proper expiration.
- **Preconditions:** User is on the seat selection page for an active session.
- **Test Steps:**
  1. Select an available seat
  2. Verify seat state changes to "Held"
  3. Check database for hold record with expiration timestamp
  4. Verify expiration is set to current time + 8 minutes (or configured duration)
- **Expected Results:**
  - Seat immediately shows as "Held"
  - Database contains hold record with correct expiration timestamp
  - Hold is attributed to the current user's session
- **Priority:** Must

**TC-019: Prevent Concurrent Seat Selection**
- **Mapped to:** FR-9
- **Description:** Verify that concurrent seat selections do not result in double assignment.
- **Preconditions:** Two users are viewing the same session's seat map simultaneously.
- **Test Steps:**
  1. User A selects seat 1A
  2. Simultaneously (within 100ms), User B attempts to select seat 1A
  3. Verify only one user successfully holds the seat
  4. Verify the other user receives appropriate feedback
- **Expected Results:**
  - Only one user's hold is created
  - Second user sees an error or seat immediately shows as held
  - No double assignment occurs in the database
- **Priority:** Must

**TC-020: Automatic Hold Release on Expiration**
- **Mapped to:** FR-10
- **Description:** Verify that expired seat holds are automatically released.
- **Preconditions:** Seat hold expiration time is configurable (set to 2 minutes for faster testing).
- **Test Steps:**
  1. User selects a seat, creating a hold
  2. Wait for hold to expire (2 minutes + 60 seconds buffer)
  3. Check seat state in the UI and database
  4. Verify seat is Available again
- **Expected Results:**
  - Seat hold is released within 60 seconds after expiration
  - Seat returns to "Available" state
  - Another user can now select the seat
- **Priority:** Must

**TC-021: Hold Release Timing Accuracy**
- **Mapped to:** FR-10
- **Description:** Verify the timing accuracy of automatic hold releases.
- **Preconditions:** Multiple seats are held with staggered expiration times.
- **Test Steps:**
  1. Create holds for 5 seats at 10-second intervals
  2. Monitor each seat's state change timestamp
  3. Calculate time between expiration and actual release
  4. Verify all releases occur within 60 seconds of expiration
- **Expected Results:**
  - All holds released within 60 seconds after their respective expirations
  - Releases occur in the correct order
- **Priority:** Must

**TC-022: Maximum Seats Per Booking Limit**
- **Mapped to:** FR-11
- **Description:** Verify that the system enforces a maximum of 10 seats per booking.
- **Preconditions:** User is on the seat selection page; default limit is 10 seats.
- **Test Steps:**
  1. Select 9 available seats
  2. Verify all selections are successful
  3. Attempt to select an 11th seat
  4. Observe system response
- **Expected Results:**
  - First 10 seats are successfully selected
  - Attempting to select an 11th seat is prevented
  - User receives clear message about the 10-seat limit
- **Priority:** Must

**TC-023: Configurable Maximum Seats Limit**
- **Mapped to:** FR-11
- **Description:** Verify that the maximum seats per booking limit is configurable.
- **Preconditions:** System configuration allows changing the seat limit.
- **Test Steps:**
  1. Configure seat limit to 5
  2. Restart application or reload configuration
  3. Attempt to select 6 seats
  4. Verify limit is enforced at the new value
- **Expected Results:**
  - System respects the configured limit (5 seats)
  - Attempting to exceed the limit is prevented
- **Priority:** Must

**TC-024: Accessible Seat Selection with Acknowledgment**
- **Mapped to:** FR-12
- **Description:** Verify that selecting accessible seats requires user acknowledgment.
- **Preconditions:** Session has seats marked as "Accessible".
- **Test Steps:**
  1. Identify an accessible seat on the seat map
  2. Click to select the accessible seat
  3. Observe if acknowledgment dialog appears
  4. Confirm acknowledgment (if required)
  5. Verify seat is selected
- **Expected Results:**
  - System prompts user to acknowledge accessibility requirements
  - User must confirm before seat is selected
  - Accessible seat is marked clearly in the UI
- **Priority:** Should

**7.1.4 Booking Flow & Confirmation (FR-13 to FR-15)**

**TC-025: Complete Booking Without Payment**
- **Mapped to:** FR-13
- **Description:** Verify users can complete booking by providing contact information only.
- **Preconditions:** User has selected seats and holds are active.
- **Test Steps:**
  1. Navigate to the booking information page
  2. Enter full name (valid format)
  3. Enter email address (valid format)
  4. Submit the booking
  5. Verify no payment information is requested
- **Expected Results:**
  - Booking proceeds with only name and email
  - No credit card or payment fields are present
  - Booking completes successfully
- **Priority:** Must

**TC-026: Booking Flow Time Budget**
- **Mapped to:** FR-13
- **Description:** Verify the booking flow completes within time budget for new users.
- **Preconditions:** New user (or cleared session) starts booking process.
- **Test Steps:**
  1. Start timer at session selection
  2. Select session
  3. Select seats
  4. Enter contact information
  5. Submit booking
  6. Stop timer at confirmation page
  7. Calculate total elapsed time
- **Expected Results:**
  - End-to-end flow completes in ≤ 3 minutes (median) for new users
  - No unexpected delays or errors
- **Priority:** Must

**TC-027: Booking Confirmation and Persistence**
- **Mapped to:** FR-14
- **Description:** Verify booking confirmation creates persistent records and sends confirmation.
- **Preconditions:** User completes all booking steps.
- **Test Steps:**
  1. Submit a valid booking
  2. Verify booking record is created in database
  3. Check that selected seats transition from "Held" to "Sold"
  4. Verify unique Booking ID is generated
  5. Check for confirmation email delivery or log entry
  6. Measure time from submission to confirmation
- **Expected Results:**
  - Booking record persists in database with all details
  - Seats are marked as "Sold"
  - Unique Booking ID is assigned and displayed
  - Confirmation email sent or logged within 1 minute
  - Confirmation page displays Booking ID and details
- **Priority:** Must

**TC-028: Confirmation Email Content**
- **Mapped to:** FR-14
- **Description:** Verify confirmation email/log contains necessary information.
- **Preconditions:** Booking is successfully confirmed.
- **Test Steps:**
  1. Complete a booking
  2. Retrieve the confirmation email or log entry
  3. Verify it contains: Booking ID, film title, session date/time, seat numbers, user contact info
- **Expected Results:**
  - Confirmation includes all booking details
  - Information is accurate and formatted clearly
  - Booking ID is prominently displayed
- **Priority:** Must

**TC-029: Failed Booking - Seat Hold Release**
- **Mapped to:** FR-15
- **Description:** Verify that failed bookings release seat holds immediately.
- **Preconditions:** Simulate a booking failure scenario (e.g., validation error, expired hold).
- **Test Steps:**
  1. Select seats (creating holds)
  2. Trigger a booking failure (e.g., invalid email format)
  3. Immediately check seat states in database
  4. Verify holds are released
  5. Refresh seat map and verify seats are available
- **Expected Results:**
  - All seat holds associated with the booking are released immediately
  - Seats return to "Available" state
  - Other users can select the seats
- **Priority:** Must

**TC-030: Failed Booking - Error Message Display**
- **Mapped to:** FR-15
- **Description:** Verify that booking failures show clear, actionable error messages.
- **Preconditions:** Various failure scenarios can be simulated.
- **Test Steps:**
  1. Trigger booking failure (e.g., missing required field, invalid email, expired hold)
  2. Observe displayed error message
  3. Verify message clarity and actionability
- **Expected Results:**
  - Error message is clear and non-technical
  - Message provides guidance for recovery (e.g., "Please check your email format")
  - User can retry or correct the issue
- **Priority:** Must

**7.1.5 Administrative Panel (FR-16 to FR-20)**

**TC-031: Admin Authentication Required**
- **Mapped to:** FR-16
- **Description:** Verify that admin login is required to access admin UI and CRUD operations.
- **Preconditions:** Admin user credentials exist in the system.
- **Test Steps:**
  1. Attempt to access admin UI without authentication
  2. Verify redirect to login page
  3. Enter valid admin credentials
  4. Verify access to admin UI is granted
  5. Attempt to access CRUD endpoints directly without session
- **Expected Results:**
  - Unauthenticated users cannot access admin UI
  - Valid credentials grant access
  - Direct API access requires authentication
- **Priority:** Must

**TC-032: Admin Account Lockout After Failed Attempts**
- **Mapped to:** FR-16
- **Description:** Verify account locks after 5 failed login attempts.
- **Preconditions:** Valid admin account exists.
- **Test Steps:**
  1. Attempt login with incorrect password (1st attempt)
  2. Repeat with incorrect password (2nd, 3rd, 4th, 5th attempts)
  3. Verify account is locked
  4. Attempt login with correct password
  5. Wait 15 minutes
  6. Attempt login with correct password again
- **Expected Results:**
  - After 5th failed attempt, account is locked
  - Correct password does not work during lockout period
  - After 15 minutes, account is unlocked and correct password works
- **Priority:** Must

**TC-033: Admin Session Expiration After Inactivity**
- **Mapped to:** FR-16
- **Description:** Verify admin sessions expire after 60 minutes of inactivity.
- **Preconditions:** Admin is logged in.
- **Test Steps:**
  1. Log in as admin
  2. Perform an action to establish session
  3. Wait 60 minutes without any activity
  4. Attempt to perform an admin action
  5. Verify session has expired
- **Expected Results:**
  - After 60 minutes of inactivity, session expires
  - User is redirected to login page
  - Must re-authenticate to continue
- **Priority:** Must

**TC-034: Create Film with Metadata and Poster**
- **Mapped to:** FR-17
- **Description:** Verify admins can create films with full metadata and poster images.
- **Preconditions:** Admin is authenticated and on the film creation page.
- **Test Steps:**
  1. Enter film title, synopsis, runtime, genre, and other metadata
  2. Upload a poster image (PNG, 1.5MB)
  3. Submit the form
  4. Verify film is created in database
  5. Verify poster is stored and accessible
  6. Check that responsive image sizes are generated
- **Expected Results:**
  - Film is created with all provided metadata
  - Poster image is uploaded successfully (PNG/JPG ≤ 2MB)
  - Responsive image sizes (thumbnail, medium, large) are generated
  - Film appears in public listings
- **Priority:** Must

**TC-035: Edit Existing Film**
- **Mapped to:** FR-17
- **Description:** Verify admins can edit film details.
- **Preconditions:** At least one film exists in the database.
- **Test Steps:**
  1. Navigate to film list in admin panel
  2. Select a film to edit
  3. Modify synopsis and runtime
  4. Update poster image
  5. Save changes
  6. Verify updates are reflected in database and public view
- **Expected Results:**
  - Film details are updated successfully
  - Changes are visible immediately in public UI
  - Previous poster is replaced (or versioned)
- **Priority:** Must

**TC-036: Delete Film**
- **Mapped to:** FR-17
- **Description:** Verify admins can delete films.
- **Preconditions:** A film exists that has no upcoming sessions (or system allows deletion with warnings).
- **Test Steps:**
  1. Navigate to film list in admin panel
  2. Select a film to delete
  3. Confirm deletion
  4. Verify film is removed from database
  5. Verify film no longer appears in public listings
- **Expected Results:**
  - Film is deleted from the database
  - Film does not appear in public UI
  - Associated poster images are removed or archived
- **Priority:** Must

**TC-037: Poster Upload Size Validation**
- **Mapped to:** FR-17
- **Description:** Verify that poster uploads enforce the 2MB size limit.
- **Preconditions:** Admin is on film creation or edit page.
- **Test Steps:**
  1. Attempt to upload a poster image larger than 2MB
  2. Observe validation response
  3. Upload a poster image exactly 2MB or smaller
  4. Verify upload succeeds
- **Expected Results:**
  - Images larger than 2MB are rejected with clear error message
  - Images ≤ 2MB are accepted and processed
- **Priority:** Must

**TC-038: Create Session with All Required Fields**
- **Mapped to:** FR-18
- **Description:** Verify admins can create sessions with all required fields.
- **Preconditions:** Films and halls exist in the database.
- **Test Steps:**
  1. Navigate to session creation in admin panel
  2. Select a film
  3. Select a hall
  4. Set start time (UTC)
  5. Add language and subtitle tags
  6. Set base price
  7. Submit the form
  8. Verify session is created and appears in public schedule
- **Expected Results:**
  - Session is created with all specified details
  - Start time is stored in UTC
  - Session appears in public schedule at correct time (converted to local)
- **Priority:** Must

**TC-039: Edit Session Details**
- **Mapped to:** FR-18
- **Description:** Verify admins can edit existing sessions.
- **Preconditions:** At least one session exists.
- **Test Steps:**
  1. Navigate to session list in admin panel
  2. Select a session to edit
  3. Modify start time and base price
  4. Save changes
  5. Verify updates in database and public schedule
- **Expected Results:**
  - Session details are updated successfully
  - Public schedule reflects the changes
- **Priority:** Must

**TC-040: Prevent Overlapping Sessions in Same Hall**
- **Mapped to:** FR-18
- **Description:** Verify system prevents overlapping sessions in the same hall.
- **Preconditions:** A hall has a session scheduled.
- **Test Steps:**
  1. Attempt to create a new session in the same hall
  2. Set start time that overlaps with existing session (within existing session duration + 15-minute buffer)
  3. Submit the form
  4. Observe validation response
- **Expected Results:**
  - System rejects the overlapping session
  - Error message explains the conflict and 15-minute buffer requirement
  - Existing session is not affected
- **Priority:** Must

**TC-041: Session Buffer Enforcement (15 minutes)**
- **Mapped to:** FR-18
- **Description:** Verify that a 15-minute buffer is enforced around each session.
- **Preconditions:** Session A in Hall 1 runs from 14:00 to 16:00.
- **Test Steps:**
  1. Attempt to create Session B in Hall 1 starting at 16:10 (10 minutes after Session A ends)
  2. Observe validation response
  3. Attempt to create Session C in Hall 1 starting at 16:15 or later
  4. Verify Session C is allowed
- **Expected Results:**
  - Session B (16:10 start) is rejected due to insufficient buffer
  - Session C (16:15 or later start) is accepted
  - Buffer ensures cleanup time between sessions
- **Priority:** Must

**TC-042: Create Hall with Seat Map**
- **Mapped to:** FR-19
- **Description:** Verify admins can create halls and define seat maps.
- **Preconditions:** Admin is on hall creation page.
- **Test Steps:**
  1. Enter hall name
  2. Define seat map: rows, columns, seat labels
  3. Mark specific seats as Blocked/Disabled
  4. Mark specific seats as Accessible
  5. Submit the form
  6. Verify hall is created in database
  7. Check seat map configuration
- **Expected Results:**
  - Hall is created with specified name and seat configuration
  - Seat map accurately reflects rows, columns, and labels
  - Blocked and Accessible seats are marked correctly
- **Priority:** Must

**TC-043: Edit Hall and Seat Map**
- **Mapped to:** FR-19
- **Description:** Verify admins can edit existing halls and seat maps.
- **Preconditions:** At least one hall exists.
- **Test Steps:**
  1. Navigate to hall list in admin panel
  2. Select a hall to edit
  3. Modify seat map (e.g., add a row, block additional seats)
  4. Save changes
  5. Verify updates in database
  6. Check that public seat maps reflect changes
- **Expected Results:**
  - Hall and seat map are updated successfully
  - Public seat selection uses updated configuration
  - Existing bookings remain valid (or handled appropriately)
- **Priority:** Must

**TC-044: Admin Audit Logging**
- **Mapped to:** FR-20
- **Description:** Verify that admin changes are audited with who, what, when details.
- **Preconditions:** Audit logging is enabled.
- **Test Steps:**
  1. Admin user logs in
  2. Create a new session
  3. Edit an existing film
  4. Delete a hall
  5. Check audit logs
- **Expected Results:**
  - Each action is logged with timestamp, admin user ID/name, action type, and affected entity
  - Critical fields show before/after values for edits
  - Logs are stored securely and are queryable
- **Priority:** Should

**TC-045: Audit Log - Before/After Values**
- **Mapped to:** FR-20
- **Description:** Verify audit logs capture before and after values for critical field changes.
- **Preconditions:** Audit logging is enabled.
- **Test Steps:**
  1. Edit a session's start time from 14:00 to 15:00
  2. Edit a hall's capacity from 100 to 120
  3. Retrieve audit logs for these actions
  4. Verify before and after values are recorded
- **Expected Results:**
  - Audit log shows original value (before) and new value (after)
  - Critical fields include session times, hall capacities, seat configurations
- **Priority:** Should

**7.1.6 API Layer (FR-21 to FR-24)**

**TC-046: Public Read API - List Films**
- **Mapped to:** FR-21
- **Description:** Verify the API endpoint to list films works correctly.
- **Preconditions:** Multiple films exist in the database.
- **Test Steps:**
  1. Send GET request to /api/films
  2. Verify response status is 200
  3. Check response contains array of films
  4. Verify only necessary fields are included (no sensitive data)
  5. Test pagination parameters if applicable
- **Expected Results:**
  - API returns list of films with appropriate fields
  - Response time is reasonable
  - Pagination works if implemented
- **Priority:** Must

**TC-047: Public Read API - Film Details**
- **Mapped to:** FR-21
- **Description:** Verify the API endpoint to retrieve specific film details.
- **Preconditions:** A film with known ID exists.
- **Test Steps:**
  1. Send GET request to /api/films/:id with valid film ID
  2. Verify response status is 200
  3. Check response contains full film details
  4. Send GET request with invalid film ID
  5. Verify appropriate error response (404)
- **Expected Results:**
  - Valid ID returns complete film details
  - Invalid ID returns 404 error
  - Response includes poster URL, synopsis, runtime, sessions
- **Priority:** Must

**TC-048: Public Read API - Fetch Schedules by Cinema and Date**
- **Mapped to:** FR-21
- **Description:** Verify the API endpoint to fetch schedules works correctly.
- **Preconditions:** Sessions exist for multiple cinemas and dates.
- **Test Steps:**
  1. Send GET request to /api/sessions with cinema and date parameters
  2. Verify response status is 200
  3. Check that returned sessions match the filter criteria
  4. Verify response time
  5. Test with different cinema and date combinations
- **Expected Results:**
  - API returns only sessions matching the specified cinema and date
  - Response includes session details (time, film, hall, price)
  - Pagination is supported if applicable
- **Priority:** Must

**TC-049: Booking API - Create Seat Hold**
- **Mapped to:** FR-22
- **Description:** Verify the API endpoint to create seat holds.
- **Preconditions:** A session with available seats exists.
- **Test Steps:**
  1. Send POST request to booking API with session ID and seat IDs
  2. Verify response status is 201 (Created)
  3. Check response contains hold details and expiration time
  4. Verify seats are marked as held in database
- **Expected Results:**
  - Seat hold is created successfully
  - Response includes hold ID and expiration timestamp
  - Seats cannot be held by another user
- **Priority:** Must

**TC-050: Booking API - Check Hold Status**
- **Mapped to:** FR-22
- **Description:** Verify the API endpoint to check hold status.
- **Preconditions:** A seat hold exists for a session.
- **Test Steps:**
  1. Send GET request to check hold status with hold ID
  2. Verify response includes hold details and remaining time
  3. Wait for hold to expire
  4. Send GET request again
  5. Verify response indicates hold has expired
- **Expected Results:**
  - Active hold returns status and expiration time
  - Expired hold returns appropriate status
- **Priority:** Must

**TC-051: Booking API - Confirm Booking (Idempotency)**
- **Mapped to:** FR-22
- **Description:** Verify booking confirmation is idempotent.
- **Preconditions:** User has created seat holds.
- **Test Steps:**
  1. Send POST request to confirm booking with hold ID and contact info
  2. Verify booking is created (status 201)
  3. Send the exact same POST request again (with same idempotency key if implemented)
  4. Verify response (should be 200 or 201 with same booking ID)
  5. Check database for duplicate bookings
- **Expected Results:**
  - First request creates booking
  - Duplicate request does not create second booking
  - Both requests return the same booking ID
- **Priority:** Must

**TC-052: Booking API - Race Condition Protection**
- **Mapped to:** FR-22
- **Description:** Verify booking API protects against race conditions.
- **Preconditions:** Two users attempt to book the same seat simultaneously.
- **Test Steps:**
  1. User A creates hold for seat 1A
  2. User B attempts to create hold for seat 1A (simultaneously or immediately after)
  3. Verify only one hold is created
  4. User A confirms booking
  5. Simultaneously, User B attempts to confirm booking for seat 1A
  6. Verify only one booking succeeds
- **Expected Results:**
  - Atomic updates prevent double-assignment
  - Only one user successfully creates hold and booking
  - Other user receives appropriate error message
- **Priority:** Must

**TC-053: Admin API - CRUD Authorization**
- **Mapped to:** FR-23
- **Description:** Verify admin API endpoints enforce authorization.
- **Preconditions:** Admin and non-admin users exist.
- **Test Steps:**
  1. Attempt to access admin CRUD endpoints without authentication
  2. Attempt to access with non-admin user credentials
  3. Attempt to access with valid admin credentials
  4. Verify authorization checks for each endpoint (films, sessions, halls)
- **Expected Results:**
  - Unauthenticated requests are rejected (401)
  - Non-admin users are rejected (403)
  - Admin users can access all endpoints
- **Priority:** Must

**TC-054: Admin API - Input Validation (Hall Capacity)**
- **Mapped to:** FR-23
- **Description:** Verify admin API validates hall capacity constraints.
- **Preconditions:** Admin is creating or editing a hall.
- **Test Steps:**
  1. Send POST/PUT request to halls endpoint with invalid capacity (e.g., negative, zero, exceeds limit)
  2. Verify response status is 400 (Bad Request)
  3. Check error message describes the validation failure
  4. Send request with valid capacity
  5. Verify hall is created/updated
- **Expected Results:**
  - Invalid capacity is rejected with clear error message
  - Valid capacity is accepted
- **Priority:** Must

**TC-055: Admin API - Input Validation (Session Overlaps)**
- **Mapped to:** FR-23
- **Description:** Verify admin API validates and prevents session overlaps.
- **Preconditions:** A session exists in a specific hall.
- **Test Steps:**
  1. Send POST request to create overlapping session in the same hall
  2. Verify response status is 400 or 409 (Conflict)
  3. Check error message explains the overlap issue
- **Expected Results:**
  - Overlapping session is rejected
  - Error message is clear and actionable
- **Priority:** Must

**TC-056: API Documentation - Request/Response Schemas**
- **Mapped to:** FR-24
- **Description:** Verify API documentation describes request/response schemas.
- **Preconditions:** API documentation is accessible (e.g., Swagger, README).
- **Test Steps:**
  1. Access API documentation
  2. Verify each endpoint has request schema (parameters, body)
  3. Verify each endpoint has response schema (success and error cases)
  4. Check for example payloads
- **Expected Results:**
  - All endpoints are documented
  - Request and response schemas are clear and accurate
  - Example payloads are provided
- **Priority:** Should

**TC-057: API Documentation - Error Codes**
- **Mapped to:** FR-24
- **Description:** Verify API documentation describes known error codes.
- **Preconditions:** API documentation is accessible.
- **Test Steps:**
  1. Review API documentation for error codes section
  2. Verify common error codes are listed (400, 401, 403, 404, 409, 500, etc.)
  3. Check that each error code has a description and typical scenarios
- **Expected Results:**
  - Error codes are documented with descriptions
  - Common error scenarios are explained
- **Priority:** Should

**7.1.7 User Accounts (Optional) (FR-25 to FR-26)**

**TC-058: User Registration**
- **Mapped to:** FR-25
- **Description:** Verify users can register and create accounts.
- **Preconditions:** Registration feature is enabled.
- **Test Steps:**
  1. Navigate to registration page
  2. Enter username/email and password meeting complexity policy
  3. Submit registration form
  4. Verify account is created
  5. Attempt to log in with new credentials
- **Expected Results:**
  - Registration succeeds with valid inputs
  - Account is stored in database
  - User can log in with new credentials
- **Priority:** Should

**TC-059: Password Complexity Policy**
- **Mapped to:** FR-25
- **Description:** Verify password complexity policy is enforced.
- **Preconditions:** Registration or password change page is accessible.
- **Test Steps:**
  1. Attempt to register with password "short"
  2. Attempt with password "onlylowercase"
  3. Attempt with password "NoDigitsOrSpecial"
  4. Attempt with password "Valid1Pass!"
  5. Observe validation messages
- **Expected Results:**
  - Passwords not meeting policy are rejected
  - Error messages explain requirements: ≥10 chars, uppercase, lowercase, digit, special character
  - Valid password ("Valid1Pass!") is accepted
- **Priority:** Should

**TC-060: User Login**
- **Mapped to:** FR-25
- **Description:** Verify users can log in to manage bookings.
- **Preconditions:** Registered user account exists.
- **Test Steps:**
  1. Navigate to login page
  2. Enter valid credentials
  3. Submit login form
  4. Verify successful login (redirect to account page or dashboard)
  5. Test with invalid credentials
- **Expected Results:**
  - Valid credentials grant access
  - Invalid credentials show error message
  - User session is established
- **Priority:** Should

**TC-061: View Booking History**
- **Mapped to:** FR-26
- **Description:** Verify registered users can view past and upcoming bookings.
- **Preconditions:** Registered user has completed at least one booking in the past 24 months.
- **Test Steps:**
  1. Log in as the user
  2. Navigate to booking history page
  3. Verify bookings from last 24 months are displayed
  4. Check that bookings include date, film, session, seats, booking ID
  5. Verify bookings older than 24 months are not shown
- **Expected Results:**
  - All bookings within last 24 months are listed
  - Booking details are accurate
  - Bookings are sorted (e.g., most recent first)
- **Priority:** Should

**TC-062: Re-download Booking Confirmation**
- **Mapped to:** FR-26
- **Description:** Verify users can re-download confirmation artifacts.
- **Preconditions:** User has a completed booking with confirmation.
- **Test Steps:**
  1. Log in and navigate to booking history
  2. Select a past booking
  3. Click "Download Confirmation" or similar action
  4. Verify confirmation file/email is regenerated or accessible
- **Expected Results:**
  - Confirmation can be accessed again
  - Downloaded confirmation matches original details
- **Priority:** Should

**7.1.8 Operations & Deployment (FR-27 to FR-29)**

**TC-063: Health Endpoint - Liveness Check**
- **Mapped to:** FR-27
- **Description:** Verify liveness health endpoint responds correctly.
- **Preconditions:** Application is running.
- **Test Steps:**
  1. Send GET request to /health or /health/liveness
  2. Measure response time
  3. Verify response status is 200
  4. Check response body indicates service is alive
- **Expected Results:**
  - Response status is 200
  - Response time ≤ 200 ms (p95) under normal load
  - Response body confirms liveness (e.g., {"status": "ok"})
- **Priority:** Must

**TC-064: Health Endpoint - Readiness Check**
- **Mapped to:** FR-27
- **Description:** Verify readiness health endpoint reflects DB connectivity.
- **Preconditions:** Application and database are running.
- **Test Steps:**
  1. Send GET request to /health/readiness
  2. Verify response status is 200 and indicates ready
  3. Simulate database disconnect
  4. Send GET request again
  5. Verify response status is 503 or indicates not ready
- **Expected Results:**
  - When DB is connected, response is 200 with "ready" status
  - When DB is disconnected, response is 503 with "not ready" status
  - Response time ≤ 200 ms (p95)
- **Priority:** Must

**TC-065: Health Endpoint Performance Under Load**
- **Mapped to:** FR-27
- **Description:** Verify health endpoints maintain performance under load.
- **Preconditions:** Load testing tool available.
- **Test Steps:**
  1. Generate normal load on the application
  2. Send 100 requests to /health/liveness
  3. Send 100 requests to /health/readiness
  4. Calculate p95 response time for each
- **Expected Results:**
  - Liveness p95 ≤ 200 ms
  - Readiness p95 ≤ 200 ms
  - Both endpoints remain responsive under load
- **Priority:** Must

**TC-066: Dockerfile and Build Reproducibility**
- **Mapped to:** FR-28
- **Description:** Verify Dockerfiles enable deterministic and reproducible builds.
- **Preconditions:** Dockerfile exists in project root or designated directory.
- **Test Steps:**
  1. Build Docker image from Dockerfile (build #1)
  2. Note image ID and size
  3. Build Docker image again without changes (build #2)
  4. Compare image IDs and layer checksums
  5. Verify builds are identical or reproducible
- **Expected Results:**
  - Docker image builds successfully
  - Builds are deterministic (same inputs produce same outputs)
  - Image size is reasonable
- **Priority:** Must

**TC-067: Deployment Manifests for Staging**
- **Mapped to:** FR-28
- **Description:** Verify deployment manifests enable staging deployments.
- **Preconditions:** Deployment manifests (e.g., docker-compose, k8s yaml) exist.
- **Test Steps:**
  1. Deploy to staging environment using provided manifests
  2. Verify all services start successfully
  3. Run health checks
  4. Access application UI and API
  5. Verify functionality in staging
- **Expected Results:**
  - Deployment completes without errors
  - All services are running and healthy
  - Application is functional in staging environment
- **Priority:** Must

**TC-068: Structured Logging with Correlation IDs**
- **Mapped to:** FR-29
- **Description:** Verify system emits structured JSON logs with correlation IDs.
- **Preconditions:** Application is running with logging enabled.
- **Test Steps:**
  1. Send an API request with correlation ID header (or generate one)
  2. Perform an action (e.g., create booking)
  3. Review application logs
  4. Verify logs are in JSON format
  5. Verify correlation ID is present in all related log entries
- **Expected Results:**
  - Logs are structured (JSON format)
  - Each request has a correlation ID
  - Correlation ID is consistent across all log entries for that request
- **Priority:** Must

**TC-069: Error Tracking Integration in Staging**
- **Mapped to:** FR-29
- **Description:** Verify error tracking (e.g., Sentry) is integrated and captures errors.
- **Preconditions:** Error tracking service is configured for staging.
- **Test Steps:**
  1. Trigger an intentional error in staging (e.g., invalid API request)
  2. Check error tracking dashboard
  3. Verify error is captured with stack trace and context
  4. Verify correlation ID is included in error report
- **Expected Results:**
  - Error is captured by error tracking service
  - Error includes stack trace, request details, and correlation ID
  - Errors are categorized and searchable
- **Priority:** Must

**7.1.9 Accessibility, Localization, and Analytics (FR-30 to FR-32)**

**TC-070: Keyboard Navigation - Browse Flow**
- **Mapped to:** FR-30
- **Description:** Verify keyboard navigation works on browse/schedule pages.
- **Preconditions:** User accesses site using keyboard only (no mouse).
- **Test Steps:**
  1. Navigate to home page
  2. Use Tab key to navigate through film tiles
  3. Use Enter key to select a film
  4. Navigate through filters using Tab and arrow keys
  5. Verify focus indicators are visible
- **Expected Results:**
  - All interactive elements are reachable via keyboard
  - Focus indicators are visible and clear
  - Tab order is logical
  - Enter/Space keys activate buttons and links
- **Priority:** Must

**TC-071: Keyboard Navigation - Seat Map**
- **Mapped to:** FR-30
- **Description:** Verify keyboard navigation works on seat selection page.
- **Preconditions:** User is on seat selection page using keyboard only.
- **Test Steps:**
  1. Use Tab key to navigate to seat map
  2. Use arrow keys to navigate between seats
  3. Use Enter/Space to select a seat
  4. Verify focus indicators show current seat
  5. Navigate to "Proceed" button and activate with Enter
- **Expected Results:**
  - Seat map is keyboard accessible
  - Arrow keys navigate between seats
  - Enter/Space selects seats
  - Focus indicators are clear
- **Priority:** Must

**TC-072: Keyboard Navigation - Booking Flow**
- **Mapped to:** FR-30
- **Description:** Verify keyboard navigation works through booking flow.
- **Preconditions:** User completes booking using keyboard only.
- **Test Steps:**
  1. Navigate to booking form fields using Tab
  2. Enter information in each field
  3. Navigate to Submit button
  4. Activate Submit with Enter
  5. Verify confirmation page is reached
- **Expected Results:**
  - All form fields are keyboard accessible
  - Tab order is logical
  - Form can be submitted via keyboard
- **Priority:** Must

**TC-073: Alt Text for Images**
- **Mapped to:** FR-30
- **Description:** Verify all images have appropriate alt text.
- **Preconditions:** Site has film posters and other images.
- **Test Steps:**
  1. Use browser inspector or screen reader to check images
  2. Verify film posters have alt text (e.g., film title)
  3. Verify decorative images have empty alt text (alt="")
  4. Check seat map icons have descriptive labels
- **Expected Results:**
  - All meaningful images have descriptive alt text
  - Decorative images have empty alt text
  - Alt text is concise and descriptive
- **Priority:** Must

**TC-074: Form Labels and ARIA**
- **Mapped to:** FR-30
- **Description:** Verify form fields have proper labels and ARIA attributes.
- **Preconditions:** Booking and admin forms exist.
- **Test Steps:**
  1. Inspect form fields with browser dev tools
  2. Verify each input has associated <label> or aria-label
  3. Check for aria-required on required fields
  4. Verify error messages are associated with fields (aria-describedby)
- **Expected Results:**
  - All form fields have labels
  - Required fields are marked with aria-required
  - Error messages are programmatically associated with fields
- **Priority:** Must

**TC-075: Color Contrast - WCAG AA**
- **Mapped to:** FR-30
- **Description:** Verify sufficient color contrast on critical flows.
- **Preconditions:** Color contrast checker tool available.
- **Test Steps:**
  1. Check contrast ratios on browse, schedule, seat map, and booking pages
  2. Verify text against background meets WCAG 2.2 AA (4.5:1 for normal text, 3:1 for large text)
  3. Check seat state colors are distinguishable and have sufficient contrast
- **Expected Results:**
  - All text meets WCAG 2.2 AA contrast requirements
  - Interactive elements have sufficient contrast
  - Seat states are visually distinguishable
- **Priority:** Must

**TC-076: Localization - Language Toggle**
- **Mapped to:** FR-31
- **Description:** Verify language toggle switches between English and Estonian.
- **Preconditions:** Localization scaffolding supports EN and ET.
- **Test Steps:**
  1. Access the site (default language: English)
  2. Locate language toggle/selector
  3. Switch to Estonian (ET)
  4. Verify page content updates to Estonian
  5. Check that preference persists across pages
  6. Clear session and verify default falls back to English
- **Expected Results:**
  - Language toggle is visible and accessible
  - Switching language updates UI text
  - Language preference persists for the session
  - Default fallback is English
- **Priority:** Should

**TC-077: Localization - Missing Translations Fallback**
- **Mapped to:** FR-31
- **Description:** Verify that missing translations fall back to English.
- **Preconditions:** Some strings are not translated to Estonian.
- **Test Steps:**
  1. Switch language to Estonian
  2. Navigate to pages/sections with missing Estonian translations
  3. Verify untranslated strings display in English
- **Expected Results:**
  - Missing translations fall back to English
  - No empty or broken text appears
  - User experience is not degraded
- **Priority:** Should

**TC-078: Privacy-Safe Analytics - No PII**
- **Mapped to:** FR-32
- **Description:** Verify analytics events do not include PII.
- **Preconditions:** Analytics is enabled and configured.
- **Test Steps:**
  1. Trigger analytics events (page view, booking funnel steps)
  2. Inspect analytics payloads (using browser dev tools or analytics dashboard)
  3. Verify no PII is present (names, emails, phone numbers, addresses)
  4. Check that only anonymous/aggregate data is collected
- **Expected Results:**
  - Analytics events contain no PII
  - Only pageviews, funnel steps, and aggregate data are tracked
  - User privacy is protected
- **Priority:** Should

**TC-079: Analytics - User Opt-Out**
- **Mapped to:** FR-32
- **Description:** Verify users can opt out of analytics.
- **Preconditions:** Analytics opt-out mechanism is implemented.
- **Test Steps:**
  1. Access analytics settings or privacy preferences
  2. Opt out of analytics
  3. Trigger events that would normally be tracked
  4. Verify no analytics events are sent
  5. Verify opt-out preference persists
- **Expected Results:**
  - Opt-out option is clearly available
  - After opting out, no analytics events are sent
  - Preference persists across sessions (cookie or local storage)
- **Priority:** Should

**7.1.10 Error Handling & Messaging (FR-33 to FR-34)**

**TC-080: Clear User-Facing Error Messages**
- **Mapped to:** FR-33
- **Description:** Verify all user-facing errors are clear and non-technical.
- **Preconditions:** Various error scenarios can be triggered.
- **Test Steps:**
  1. Trigger different errors (validation, network, server errors)
  2. Observe displayed error messages
  3. Verify messages are non-technical
  4. Check that recovery guidance is provided
- **Expected Results:**
  - Error messages avoid technical jargon (no stack traces, error codes shown to users)
  - Messages explain what went wrong in plain language
  - Recovery guidance is provided (e.g., "Please try again" or "Check your input")
- **Priority:** Must

**TC-081: Error Recovery Guidance**
- **Mapped to:** FR-33
- **Description:** Verify error messages provide actionable recovery steps.
- **Preconditions:** User encounters various errors.
- **Test Steps:**
  1. Trigger validation error (e.g., missing required field)
  2. Verify message suggests action (e.g., "Please enter your email address")
  3. Trigger hold expiration error
  4. Verify message suggests reselecting seats
  5. Trigger network error
  6. Verify message suggests retrying
- **Expected Results:**
  - Each error type has specific recovery guidance
  - Users know what action to take next
  - Contact support option is available for unrecoverable errors
- **Priority:** Must

**TC-082: Booking Error Categorization - Validation**
- **Mapped to:** FR-34
- **Description:** Verify validation errors are categorized and messaged appropriately.
- **Preconditions:** Booking form has validation rules.
- **Test Steps:**
  1. Submit booking with missing name
  2. Verify error is categorized as "validation"
  3. Submit booking with invalid email format
  4. Verify error is categorized as "validation"
  5. Check error messages for both scenarios
- **Expected Results:**
  - Validation errors are clearly identified
  - Error messages are specific to the validation failure
  - Users can correct and resubmit
- **Priority:** Should

**TC-083: Booking Error Categorization - Hold Expired**
- **Mapped to:** FR-34
- **Description:** Verify hold expiration errors are categorized and messaged.
- **Preconditions:** User holds seats and waits for expiration.
- **Test Steps:**
  1. Select seats (create holds)
  2. Wait for holds to expire
  3. Attempt to confirm booking
  4. Verify error is categorized as "hold_expired"
  5. Check error message
- **Expected Results:**
  - Error is categorized as "hold expired"
  - Message explains seats are no longer held
  - User is prompted to reselect seats
- **Priority:** Should

**TC-084: Booking Error Categorization - Concurrency Conflict**
- **Mapped to:** FR-34
- **Description:** Verify concurrency conflict errors are categorized and messaged.
- **Preconditions:** Two users attempt to book the same seat.
- **Test Steps:**
  1. User A holds seat 1A
  2. User B attempts to hold seat 1A
  3. Verify User B receives concurrency conflict error
  4. Check error message and category
- **Expected Results:**
  - Error is categorized as "concurrency_conflict" or similar
  - Message explains seat is no longer available
  - User is prompted to select different seats
- **Priority:** Should

7.2 Validation Criteria
- All Must (M) functional and non-functional requirements satisfied prior to release.
- ≥ 95% automated tests pass on the main branch before deploy.
- Performance budgets achieved in staging with representative data volumes.
- Accessibility audits pass for critical flows (WCAG 2.2 AA).
- Health, logging, and alerting validated in staging.

8. Maintenance and Support

8.1 Maintenance Procedures
- Monthly dependency updates; security patches prioritized.
- Database backups per environment policy (daily full, hourly incremental for staging/prod).
- Incident response with runbooks; postmortem within 48 hours for P1 incidents.
- Feature flags for risky changes; canary or blue/green where available.

8.2 Support and Helpdesk
- Developer/operator access to logs and error tracking dashboards.
- Basic help documentation for admins (film/session/hall management).
- Response targets: initial triage within 1 business day for non-critical issues.

9. Appendices

9.1 Glossary
- Hall: A cinema auditorium with a defined seat map.
- Seat Hold: Temporary reservation preventing other users from selecting the same seat.
- Booking: A confirmed allocation of seats to a user’s contact details.
- Booking ID: Unique identifier for a completed booking.
- p95 Latency: 95th percentile of response times.

9.2 Revision History
- v1.0 (2025-11-18): Initial SRS for MVP aligned with current stack.