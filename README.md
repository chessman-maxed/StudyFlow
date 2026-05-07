# StudyFlow - AI-Powered Smart Learning Planner

StudyFlow is a premium, AI-driven study management application designed to help students optimize their learning schedules, track progress with advanced analytics, and achieve academic excellence.

![StudyFlow Dashboard](https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop)

## 🚀 Key Features

- **AI-Powered Study Planner**: Generates personalized daily and weekly schedules based on subjects, exam dates, and difficulty levels.
- **Advanced Progress Dashboard**: 
  - **Circular Progress**: Real-time visual tracking of overall completion.
  - **Velocity Charts**: Monitor your study consistency over time.
  - **Subject Distribution**: Analysis of focus areas and topic mastery.
  - **Milestone Flowchart**: Visual journey through your study phases.
- **Dynamic User Experience**:
  - **Theme System**: Seamless transition between Dark and Light modes.
  - **Cinematic Backgrounds**: Interactive Vanta.js net backgrounds for an immersive experience.
  - **Responsive Design**: Fully optimized for mobile, tablet, and desktop.
- **Data Persistence**: Local storage integration ensures your study plans and progress are saved across sessions.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS.
- **Visuals**: Chart.js (Data Visualization), Three.js & Vanta.js (Background Animations).
- **Icons**: Font Awesome 6.
- **Fonts**: Google Fonts (Inter, Manrope).
- **Deployment**: Vercel optimized.

## 📁 Project Structure & Recent Work

| File | Description | Recent Work |
|------|-------------|-------------|
| `index.html` / `js` | Landing page | Implemented premium hero section, feature grid, and testimonials. |
| `planner.html` / `js` | AI Study Generator | Enhanced parsing logic for subjects and task categorization. |
| `progress.html` / `js` | Progress Dashboard | **Major Update**: Fixed Focus Areas charts, added theme-aware colors, and implemented auto-refresh logic. |
| `study-plans.html` / `js`| Plan Library | Added functionality to view and manage multiple study tracks. |
| `theme.js` | Theme Management | Robust dark/light mode toggle with persistence. |
| `auth.html` / `js` | User Authentication | Built a sleek authentication UI with modal support. |
| `vercel.json` | Deployment Config | Configured routing and clean URLs for Vercel. |

## 📈 Recent Updates

- **Enhanced Chart Visibility**: Fixed issues where graphs were not visible in light mode.
- **Focus Area Accuracy**: Improved the subject identification algorithm to correctly categorize tasks from the study plan.
- **Real-time Sync**: Implemented a visibility-aware refresh system that updates progress when switching tabs.
- **SEO & Legal**: Added comprehensive meta descriptions, unique IDs for testing, and legal compliance pages (Privacy, Terms, Cookies).

## 🚀 Getting Started

1. Clone the repository.
2. Open `index.html` in any modern browser.
3. No build step required for local preview.

## ☁️ Vercel Deployment & Security

This project is optimized for Vercel and includes a secure backend for AI generation.

### 1. Environment Variables
To keep your API keys secure, set the following environment variables in your **Vercel Dashboard** under **Project Settings > Environment Variables**:

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `FIREBASE_API_KEY` | Firebase API Key |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `FIREBASE_PROJECT_ID` | Firebase Project ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `FIREBASE_APP_ID` | Firebase App ID |

### 2. Automatic Injection
During the Vercel build process, the `setup-env.js` script will automatically inject these variables into `firebase-config.js`. The Gemini API calls are routed through a secure Serverless Function (`/api/generate-plan.js`) so your AI key is never exposed to the browser.

---
*Created with ❤️ by the StudyFlow Team*
