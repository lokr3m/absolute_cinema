# Security Summary

This document summarizes the current security posture of Absolute Cinema.

## Current Protections

- **Input validation:** Booking and admin endpoints validate required fields and ObjectId formats.
- **Seat collision checks:** Booking creation checks for existing bookings before saving.
- **No card storage:** Payment fields in the UI are demo-only and are not persisted.

## Known Gaps

1. **No authentication or authorization**
   - Admin endpoints are publicly accessible.
   - Booking lookups use a booking number without user verification.

2. **No rate limiting**
   - API endpoints can be called without throttling.

3. **Limited audit logging**
   - Admin changes are not currently tracked.

## Recommendations

- Add authentication for admin routes and protect booking retrievals.
- Implement rate limiting (application or gateway-level).
- Add audit logs for booking and admin actions.

## Data Handling Notes

- Contact emails and phones are stored with bookings.
- Booking numbers should be treated as private identifiers.
