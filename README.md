# Tori - Business Management and Appointments System

A React Native application for managing business appointments, services, and customer relationships.

## System Requirements

- Node.js v22.11.0 or higher
- npm v11.1.0 or higher
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Firebase project setup

## Installation

1. Clone the repository:
```bash
git clone https://github.com/SamuraiPolix/Tori.git
cd Tori
```

2. Install dependencies:
```bash
npm install
```

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add your Android and iOS apps to the Firebase project
3. Download the configuration files:
   - `google-services.json` for Android (place in `src/services/`)
   - `GoogleService-Info.plist` for iOS (place in `src/services/`)
4. Enable the following Firebase services:
   - Authentication
   - Cloud Firestore
   - Cloud Storage

## Running the App

### Android

```bash
# Start Metro bundler
npm start

# In a new terminal, run on Android
npm run android
```

### iOS

```bash
# Start Metro bundler
npm start

# In a new terminal, run on iOS
npm run ios
```

## Features

- 📅 Appointment Management
- 👥 Customer Management
- 💇‍♂️ Service Management
- 📊 Business Analytics
- ⚙️ Business Settings
- 🔔 Push Notifications
- 📱 Mobile-First Design

## Project Structure

```
Tori/
├── src/
│   ├── components/      # Reusable components
│   ├── screens/         # Screen components
│   ├── services/        # API and service functions
│   ├── styles/         # Global styles
│   └── assets/         # Images, fonts, etc.
├── android/            # Android specific files
├── ios/               # iOS specific files
└── package.json       # Project dependencies
```

## Development

- The app uses React Native for cross-platform mobile development
- Firebase is used for backend services
- RTL support is enabled for Hebrew language
- Follows modern React practices with hooks and functional components

## Troubleshooting

If you encounter any issues:

1. Clear Metro bundler cache:
```bash
npm start -- --reset-cache
```

2. Clean and rebuild Android:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

3. Clean and rebuild iOS:
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request