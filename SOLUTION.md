# Solution: Fix "No sessions available for the selected criteria" Error

## Problem

The booking page shows "No sessions available for the selected criteria" when the sessions in your MongoDB database are out of date.

## Root Cause

- The `/api/sessions` endpoint filters sessions by date
- Sessions in your database have `startTime` values that are in the past
- When users select current dates, no matching sessions are found
- The booking system correctly shows "No sessions available"

## Solution

Run the following command to refresh your sessions:

```bash
npm run add-sessions
```

This script will:
1. Connect to your MongoDB database using the `MONGODB_URI` environment variable
2. Remove all sessions older than today
3. Create new sessions for the next 7 days
4. Preserve all existing bookings and future sessions

## Prerequisites

Before running the script, ensure:

1. **MongoDB is running**
   ```bash
   # Test MongoDB connection
   mongosh --eval "db.version()"
   ```

2. **Environment variable is set**
   ```bash
   # For local MongoDB
   export MONGODB_URI="mongodb://localhost:27017/cinema"
   
   # For MongoDB Atlas (example)
   export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/cinema?retryWrites=true&w=majority"
   ```

3. **Node dependencies are installed**
   ```bash
   npm install
   ```

## Step-by-Step Instructions

1. **Set your MongoDB connection string**
   ```bash
   export MONGODB_URI="your_mongodb_connection_string"
   ```

2. **Run the session refresh script**
   ```bash
   npm run add-sessions
   ```

   You should see output like:
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

3. **Restart your backend server** (if it's running)
   ```bash
   npm run dev
   ```

4. **Test the booking page**
   - Open the booking page in your browser
   - Select a film
   - Select today's date or any date in the next 7 days
   - You should now see available sessions

## Alternative: Full Database Reset

If you want to start completely fresh with all sample data:

```bash
npm run seed
```

**Warning:** This will delete ALL data including films, halls, cinemas, sessions, and bookings.

## Verifying the Fix

After running the script, you can verify sessions were created:

1. Check MongoDB directly:
   ```bash
   mongosh
   use cinema
   db.sessions.find({ startTime: { $gte: new Date() } }).count()
   ```

2. Or test via the API:
   ```bash
   # Get today's date in YYYY-MM-DD format
   TODAY=$(date +%Y-%m-%d)
   
   # Query sessions for today
   curl "http://localhost:3000/api/sessions?date=$TODAY"
   ```

## Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `mongod` or check your MongoDB service
- Verify your `MONGODB_URI` is correct
- Check firewall and network connectivity

### "No films found" or "No halls found"
Your database is empty. Run the full seed script first:
```bash
npm run seed
```

### Sessions still not showing
- Clear browser cache
- Restart the backend server
- Check the date you're selecting is within the next 7 days
- Verify sessions were created in MongoDB

## How It Works

The script:
- Uses the same logic as the `seed.js` script to create sessions
- Creates 3 sessions per day (10:00, 14:30, 19:00) for each film
- Assigns sessions to random halls
- Sets realistic pricing and availability
- Only removes old sessions (preserves bookings and future sessions)

## Maintenance

You may need to run this script periodically (e.g., weekly) to ensure there are always upcoming sessions available for booking. Consider adding it to a cron job or scheduled task.

## Questions?

If you encounter any issues, please check:
1. MongoDB connection string is correct
2. Database has films and halls (run `npm run seed` if not)
3. Backend server is running on port 3000
4. Frontend is correctly configured to point to the backend
