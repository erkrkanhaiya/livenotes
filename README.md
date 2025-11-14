# Google Notes Chrome Extension

A comprehensive note-taking Chrome extension with Google authentication, Firebase cloud sync, and modern React UI.

## 🚀 Features

- **Multiple Authentication Options**: 
  - Google OAuth (Chrome Identity API)
  - Email/Password with Sign Up & Sign In
- **Cloud Sync**: Real-time synchronization with Firebase Firestore
- **Modern UI**: Clean, responsive design with dark/light mode
- **Note Management**: Create, edit, delete, and organize notes
- **Search & Filter**: Advanced search and filtering capabilities
- **Pin Notes**: Pin important notes to the top
- **Color Coding**: Organize notes with custom colors
- **Analytics**: Firebase Analytics with Chrome extension compatibility

## 🛠️ Setup & Development

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Console project
- Firebase project

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd chrome-Ext
npm install
```

### 2. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Chrome Extension Configuration
VITE_EXTENSION_KEY=your_chrome_extension_key_here
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication > Sign-in method:
   - **Google** (for OAuth)
   - **Email/Password** (for email authentication)
3. Enable Firestore Database
4. Add your domain to authorized domains
5. Copy configuration values to `.env`

### 4. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google+ API and Google OAuth2 API
3. Create OAuth 2.0 credentials
4. Set authorized redirect URIs:
   - `https://[your-extension-id].chromiumapp.org/`
   - For development: `http://localhost:5173`
5. Copy Client ID to `.env`

### 5. Build & Development

**Development mode:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build:extension
```

**Generate manifest only:**
```bash
npm run generate:manifest
```

### 6. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder
5. Pin the extension to toolbar

## 📁 Project Structure

```
src/
├── components/          # React UI components
├── contexts/           # React contexts (Auth, Notes)
├── config/             # Configuration files
├── services/           # API services
├── types/              # TypeScript definitions

scripts/
└── generate-manifest.cjs  # Manifest generation script

public/
└── manifest.json          # Generated Chrome extension manifest
```

## 🔧 Environment Variables

All sensitive configuration is stored in environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_EXTENSION_KEY` | Chrome extension key (for consistent ID) |

## 🚨 Security Notes

- Never commit `.env` files to version control
- Use different OAuth clients for development and production
- Regularly rotate API keys and secrets
- Set appropriate CORS and domain restrictions in Firebase/Google Cloud

## 🐛 Troubleshooting

### "Authorization page could not be loaded"
- Check that OAuth client ID matches in `.env` and Google Cloud Console
- Verify authorized redirect URIs include your extension ID
- Clear extension data and reload

### Firebase connection issues
- Verify all Firebase environment variables are correct
- Check Firebase project permissions and enabled APIs
- Ensure Firestore rules allow authenticated access

### Build issues
- Run `npm run generate:manifest` to update manifest with latest env vars
- Clear node_modules and reinstall if needed
- Check all required environment variables are set

## 📦 Deployment

1. Set production environment variables
2. Run `npm run build:extension`
3. Upload `dist` folder to Chrome Web Store
4. Configure store listing and permissions

Currently, the extension uses these official technologies:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
