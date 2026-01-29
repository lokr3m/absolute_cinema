# Booking Flow - Film Pre-selection from Schedule

## Overview
This document explains how the "Osta Piletid" button redirects users from the Schedule page to the Booking page with automatic film selection.

## User Flow

### 1. User Views Schedule
- User browses the Schedule page (`/schedule`)
- Schedule displays films from Apollo Kino API
- Each film session has an "Osta Piletid" button

### 2. User Clicks "Osta Piletid"
```javascript
// Schedule.vue - buyTickets method
buyTickets(session) {
  this.$router.push({ 
    name: 'Booking',
    query: { filmTitle: session.movieTitle }
  })
}
```
- Button click triggers navigation
- Film title is passed as URL query parameter
- Example: `/booking?filmTitle=Inception`

### 3. Booking Page Loads
```javascript
// Booking.vue - mounted hook
async mounted() {
  await this.loadFilms()  // Load all films from database
  
  // Priority: filmId > filmTitle
  // If filmId provided, use it directly (e.g., from direct link)
  if (this.filmId) {
    this.selectedFilmId = this.filmId
    await this.loadSessions()
  }
  // If filmTitle provided (from Schedule page), find matching film
  else if (this.filmTitle) {
    const matchingFilm = this.films.find(film => 
      film.title?.toLowerCase() === this.filmTitle.toLowerCase() ||
      film.originalTitle?.toLowerCase() === this.filmTitle.toLowerCase()
    )
    
    if (matchingFilm) {
      // Film found - auto-select it
      this.selectedFilmId = matchingFilm._id
      await this.loadSessions()  // Load sessions for this film
    } else {
      // Film not found - show message
      this.filmNotFoundMessage = `Film "${this.filmTitle}" is not currently available...`
    }
  }
  
  // Handle sessionId if provided
  if (this.sessionId) {
    this.selectedSessionId = this.sessionId
    await this.loadSessionDetails()
    await this.loadSeats()
    
    if (this.selectedFilm && this.selectedSession) {
      this.currentStep = 2
    }
  }
  
  this.loading = false
}
```

### 4. Film Selection Outcomes

#### Scenario A: Film Found in Database
✅ **Success Path**
1. Film is automatically selected in the dropdown
2. Available sessions are loaded and displayed
3. User can immediately select a session time
4. User proceeds to seat selection (Step 2)

#### Scenario B: Film Not Found in Database
ℹ️ **Informative Path**
1. Blue info message is displayed:
   - "Film '[Title]' is not currently available for booking. Please select from available films below."
2. Film dropdown shows all available films
3. User manually selects a different film
4. Sessions load for selected film
5. User proceeds with booking

## Technical Details

### Data Flow
```
Schedule Page (Apollo Kino Data)
    ↓ [User clicks "Osta Piletid"]
    ↓ [Passes: filmTitle]
    ↓
Booking Page (Local Database)
    ↓ [Loads all films]
    ↓ [Searches by title]
    ↓
    ├─→ [Match Found] → Auto-select → Load sessions
    └─→ [No Match] → Show message → Manual selection
```

### Title Matching Algorithm
- **Case-insensitive comparison**
- Checks both `title` and `originalTitle` fields
- Exact string match after lowercasing
- First match wins

### Example Matches
| Schedule Title | Database Title | Match? |
|----------------|----------------|--------|
| "Inception" | "Inception" | ✅ Yes |
| "INCEPTION" | "Inception" | ✅ Yes |
| "The Dark Knight" | "The Dark Knight" | ✅ Yes |
| "Interstellar" | "Interstellar" | ✅ Yes |
| "Some Apollo Film" | N/A | ❌ No - Shows message |

## Database Requirements

### Required Setup
1. MongoDB must be running and accessible
2. `MONGODB_URI` environment variable must be set
3. Films must be seeded in the database
4. Film titles in database should match Apollo Kino titles

### Seeding Database
```bash
npm run seed
```

This creates sample films:
- Inception
- The Dark Knight
- Interstellar
- (and more...)

## Testing

### Manual Testing Steps

1. **Start Backend**
   ```bash
   npm start
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Seed Database** (if not done)
   ```bash
   npm run seed
   ```

4. **Test Flow**
   - Navigate to `/schedule`
   - Click "Osta Piletid" on any film
   - Verify redirect to `/booking?filmTitle=...`
   - Verify film is auto-selected
   - Verify sessions are loaded

### Test Cases

#### Test Case 1: Matching Film
- **Given**: Film "Inception" exists in database
- **When**: User clicks "Osta Piletid" for "Inception"
- **Then**: 
  - Redirects to `/booking?filmTitle=Inception`
  - Film dropdown shows "Inception" selected
  - Sessions for Inception are displayed

#### Test Case 2: Non-Matching Film
- **Given**: Film "New Apollo Film" does NOT exist in database
- **When**: User clicks "Osta Piletid" for "New Apollo Film"
- **Then**:
  - Redirects to `/booking?filmTitle=New%20Apollo%20Film`
  - Blue info message displayed
  - Film dropdown shows all films but none selected
  - No sessions displayed (until user selects a film)

#### Test Case 3: No Film Title
- **Given**: User navigates directly to `/booking`
- **When**: Page loads
- **Then**:
  - No info message
  - All films shown in dropdown
  - User can manually select any film

## Production Considerations

### 1. Data Synchronization
To improve matching rates, consider:
- Running periodic sync from Apollo Kino API
- Using `/api/apollo-kino/sync` endpoint
- Maintaining mapping table between Apollo and local films

### 2. Fallback Handling
Current behavior when film not found:
- User sees informative message
- Can manually select any available film
- No error, graceful degradation

### 3. Performance
- Film search is O(n) but typically small dataset
- Could optimize with Map/Object if needed
- Lazy loading of sessions improves initial load

## Files Modified

1. `frontend/src/views/Schedule.vue`
   - Updated `buyTickets()` method

2. `frontend/src/router/index.js`
   - Added `filmTitle` to Booking route props

3. `frontend/src/views/Booking.vue`
   - Added `filmTitle` prop
   - Added `filmNotFoundMessage` data
   - Enhanced `mounted()` with search logic
   - Added info message display
   - Added `.info-message` CSS

## Future Enhancements

1. **Fuzzy Matching**: Handle slight title variations
2. **Film ID Mapping**: Store Apollo Kino IDs in database
3. **Recent Searches**: Show recently viewed films
4. **Pre-populated Session**: Select best matching session time
5. **Analytics**: Track which films have booking mismatches
