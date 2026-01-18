# Wine Club - Deployment Guide

A Jackbox-style interactive wine tasting app for blind tastings with friends.

## Quick Start

### 1. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" (or "Add project")
3. Name it `wine-club` (or any name you prefer)
4. Disable Google Analytics (optional, not needed)
5. Click "Create project"

### 2. Enable Firestore Database

1. In Firebase Console, click "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location closest to you (e.g., `us-central`)
5. Click "Enable"

### 3. Set Up Firestore Security Rules

1. In Firestore, click the "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events collection
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;

      // Subcollections
      match /participants/{oderId} {
        allow read, write: if request.auth != null;
      }
      match /wines/{wineId} {
        allow read, write: if request.auth != null;
      }
      match /ratings/{ratingId} {
        allow read, write: if request.auth != null;
      }
    }

    // Wine history
    match /wineHistory/{historyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

### 4. Enable Anonymous Authentication

1. In Firebase Console, click "Build" → "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Click "Anonymous"
5. Toggle "Enable" to ON
6. Click "Save"

### 5. Get Your Firebase Config

1. In Firebase Console, click the gear icon → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register app with nickname "wine-club-web"
5. Copy the `firebaseConfig` object

### 6. Update firebase-config.js

Open `js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### 7. Deploy to Netlify

#### Option A: Deploy via GitHub

1. Push this folder to a GitHub repository:
   ```bash
   cd wine-club
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/wine-club.git
   git push -u origin main
   ```

2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Build settings:
   - Build command: (leave empty)
   - Publish directory: `.` or `/`
6. Click "Deploy site"

#### Option B: Deploy via Drag & Drop

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag the entire `wine-club` folder onto the page
3. Your site will be live in seconds

### 8. Custom Domain (Optional)

1. In Netlify, go to "Domain settings"
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

---

## Project Structure

```
wine-club/
├── index.html              # Landing page
├── css/
│   ├── styles.css          # Global styles
│   ├── host.css            # Host dashboard
│   ├── participant.css     # Mobile participant UI
│   └── animations.css      # Reveal animations
├── js/
│   ├── firebase-config.js  # Firebase setup ← UPDATE THIS
│   ├── auth.js             # Authentication
│   ├── event-manager.js    # Event CRUD
│   ├── wine-manager.js     # Wine registration
│   ├── rating-manager.js   # Ratings
│   ├── realtime-listeners.js # Live sync
│   ├── reveal-animations.js  # Animations
│   └── scoring.js          # Winner calculation
├── host/
│   ├── create.html         # Create event
│   ├── dashboard.html      # Host controls
│   └── reveal.html         # Reveal screen
├── participant/
│   ├── join.html           # Join via code
│   ├── register-wine.html  # Register wine
│   ├── rate.html           # Rate wines
│   └── reveal.html         # Watch reveal
└── history/
    ├── index.html          # Past events
    └── wines.html          # Wine database
```

---

## How It Works

### Host Flow
1. Host visits site → clicks "Host Event"
2. Fills in event details → gets join code (e.g., `ZIN-7K3M`)
3. Shares code with friends
4. Sees participants join in real-time
5. Clicks "Start Tasting" when ready
6. Controls which wine is being tasted
7. Triggers dramatic reveal
8. Event saved to history

### Participant Flow
1. Guest visits site → enters join code
2. Registers their wine + picks bag number
3. Waits in lobby until tasting starts
4. Rates each wine 1-10 with optional notes
5. Watches the reveal on their device
6. Sees winner announcement

---

## Testing Locally

You can test locally using any static file server:

```bash
# Using Python
cd wine-club
python -m http.server 8000
# Open http://localhost:8000

# Using Node.js (npx)
npx serve .
# Open http://localhost:3000

# Using PHP
php -S localhost:8000
```

**Note:** Firebase will still work locally - it connects to your cloud database.

---

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules are published
- Ensure Anonymous auth is enabled
- Verify firebase-config.js has correct values

### Join code not found
- Ensure Firestore database is created
- Check browser console for errors
- Verify the event was created successfully

### Real-time updates not working
- Check browser console for Firebase errors
- Ensure Firestore is in the correct region
- Try refreshing the page

### Animations not playing
- Some browsers block autoplay audio
- Click anywhere on the page first to enable audio
- Check if CSS animations are supported

---

## Cost

**Free tier covers everything** for typical use:
- Firestore: 50K reads/day, 20K writes/day
- Auth: 10K verifications/month
- Netlify: Unlimited static hosting

For monthly events with 8-12 friends, you'll use ~500 reads per event.

---

## Future Enhancements

- [ ] Wine barcode scanner
- [ ] Photo uploads for wines
- [ ] Export results to PDF/image
- [ ] Prediction game (guess which wine is which)
- [ ] Price reveal for value scoring
- [ ] Persistent user accounts
- [ ] Wine recommendations based on ratings

---

## Support

For issues or questions, check the browser console for error messages. Most issues are related to Firebase configuration.
