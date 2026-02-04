# Quick Fix Guide

## TL;DR - Fix "No sessions available" Error

Your sessions are outdated. Run this command to fix it:

```bash
# 1. Set your MongoDB connection (replace with your actual connection string)
export MONGODB_URI="mongodb://localhost:27017/cinema"

# 2. Run the fix
npm run add-sessions

# 3. Restart your server if running
npm run dev
```

## What This Does

- ✅ Removes sessions older than today (November 2025 sessions)
- ✅ Creates fresh sessions for the next 7 days
- ✅ Keeps all your bookings safe
- ✅ Doesn't delete films, halls, or cinemas

## Expected Output

```
Connecting to MongoDB...
✓ Connected to MongoDB successfully
✓ Found 6 films
✓ Found 6 halls
✓ Removed 126 old sessions
✓ Inserted 126 new sessions

=== Sessions updated successfully! ===
Total: 126 new sessions for the next 7 days
```

## Verify It Worked

1. Open your booking page: http://localhost:5173/booking
2. Select a film
3. Choose today's date
4. You should see available sessions!

## Need More Help?

See [SOLUTION.md](SOLUTION.md) for detailed instructions and troubleshooting.

## Alternative: Fresh Start

If you want to reset everything:
```bash
npm run seed
```
⚠️ Warning: This deletes ALL data including bookings!
