# 📦 Rentory - Firebase Authentication Integration Guide

Firebase Authentication has been integrated into the **Rentory Mobile App** (Expo / React Native) with:
- ✅ **Email & Password Authentication** (Sign In & Sign Up)
- ✅ **Real-time Auth State Management** via `AuthContext`
- ✅ **Password Reset Flow** ("Forgot password?" with email reset link)
- ✅ **User Profile & Sign Out Modal** on the Dashboard
- ✅ **Zero-Crash Fallback**: Automatically operates in *Demo Session Mode* until real Firebase keys are added, and seamlessly switches to *Live Firebase Auth* once configured in `.env`.
- ✅ **Backend API Synchronisation**: authenticated mobile requests send the Firebase ID token when live Firebase is configured, and account/inventory/rental operations use the FastAPI API.

---

## 🚀 Quick Setup: Connecting Your Live Firebase Project

Follow these 4 simple steps to connect your Firebase project:

### Step 1: Open or Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** (or select your existing project).
3. Name your project (e.g. `rentory-inventory`) and complete project creation.

### Step 2: Enable Email/Password Sign-In
1. In your Firebase Console sidebar, navigate to **Build** → **Authentication**.
2. Click **Get Started** (if opening Auth for the first time).
3. Go to the **Sign-in method** tab.
4. Select **Email/Password**.
5. Toggle **Enable** to ON and click **Save**.

### Step 3: Register a Web App & Copy Keys
1. In the Firebase Console, click the **Gear Icon (⚙️)** next to *Project Overview* in the left sidebar → **Project settings**.
2. Under the **General** tab, scroll down to the **Your apps** section.
3. Click the **Web (`</>`)** icon to register a web app:
   - App nickname: `Rentory Mobile`
   - Leave *Firebase Hosting* unchecked.
   - Click **Register app**.
4. You will see a `firebaseConfig` snippet like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "rentory-inventory.firebaseapp.com",
     projectId: "rentory-inventory",
     storageBucket: "rentory-inventory.appspot.com",
     messagingSenderId: "123456789...",
     appId: "1:123456789:web:abcdef..."
   };
   ```

### Step 4: Add Keys to `apps/mobile/.env`
Open [`apps/mobile/.env`](apps/mobile/.env) and replace the placeholder values with your credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=rentory-inventory.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=rentory-inventory
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=rentory-inventory.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789...
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...
```

---

## 📱 Running the App

From the project root:

```bash
# Start the Expo development server
npm run mobile

# Or directly target web preview
npm run mobile:web

# Or target Android emulator / device
npm run mobile:android
```

---

## 🔍 Features & Verification

1. **Connection Status Badge**:
   - The Login screen shows a connection badge:
     - 🟢 `Firebase Auth Live`: Live credentials are loaded and ready.
     - 🟡 `Demo Mode (Configure .env for Live Firebase)`: Safe local fallback mode.
2. **Sign Up**:
   - Switch to the **Sign Up** tab, enter work email & password (minimum 6 characters), and tap **Sign Up with Firebase →**.
   - The user account will immediately appear in your Firebase Console under **Authentication** → **Users**.
3. **Log In**:
   - Enter your email and password, then tap **Log In to Inventory →**.
4. **Forgot Password**:
   - Enter your email and tap **Forgot password?** to send a password reset email via Firebase.
5. **Dashboard & Sign Out**:
   - Once logged in, the Dashboard greets you with your real account email/name and initial avatar.
   - Tap the initial avatar in the top right (or tap **Settings** in the bottom navigation) to open the Profile Modal.
   - Tap **Log Out from Firebase** to safely sign out and return to the login screen.

## Backend security boundary

The current FastAPI service accepts the mobile `Authorization: Bearer` header for
transport, but it does not yet verify Firebase ID tokens with the Firebase Admin SDK.
This means the local/demo workflow is connected end-to-end, while production backend
authorization is not complete. Before deploying, add Firebase Admin credentials,
verify tokens in a FastAPI dependency, and require that dependency on inventory,
rental, and user write routes.
