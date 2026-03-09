# Workout Tracker Mobile App

A comprehensive React Native mobile application for tracking workouts. This project consists of a React Native frontend and a Node.js/Express backend with Supabase integration.

## 🚧 Project Status

**Currently in development** - This is an active work-in-progress project.

## 📱 Overview

This mobile workout tracking app provides users with a complete fitness management solution, including:

- **Workout Tracking**: Create, start, pause, and complete workouts with real-time exercise tracking
- **Exercise Management**: Build custom exercises with detailed specifications (sets, reps, weight, duration)
- **Routine Templates**: Create reusable workout templates for consistent training
- **Progress History**: View detailed workout history with performance analytics
- **User Authentication**: Secure account management with email verification
- **Media Support**: Upload and manage exercise images/videos
- **Offline Capability**: Local data storage with sync when online

## 🏗️ Technical Architecture

### Frontend (React Native)

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v7 with deep linking support
- **State Management**: React Context API for global state
- **Local Storage**: SQLite for offline data persistence
- **Authentication**: JWT token-based authentication with refresh tokens
- **Media Handling**: Expo Image Picker with local caching
- **UI Components**: Custom components with theme support (light/dark mode)

### Backend (Node.js/Express)

- **Runtime**: Node.js with Express.js framework
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage for media files
- **Security**: Helmet.js, CORS, rate limiting, input validation
- **Media Processing**: FFmpeg for video/image optimization
- **API Design**: RESTful API with comprehensive error handling

## 📁 Project Structure

```
mobile-app-dev/
├── Workout/                          # React Native Frontend
│   ├── App.jsx                       # Main app component with navigation
│   ├── components/                   # Reusable UI components
│   │   ├── activeExerciseCard.jsx    # Workout exercise tracking
│   │   ├── modals/                   # Modal components
│   │   └── static/                   # Static UI components
│   ├── pages/                        # Screen components
│   │   ├── workouts/                 # Workout-related screens
│   │   ├── exercises/                # Exercise management
│   │   ├── templates/                # Routine templates
│   │   └── settings/                 # User settings
│   ├── API/                          # API layer
│   │   ├── auth/                     # Authentication API
│   │   ├── local/                    # Local storage management
│   │   └── utils/                    # API utilities
│   ├── state/                        # Context providers
│   ├── styles/                       # Component styling
│   └── utils/                        # Helper functions
│
├── backend/                          # Node.js Backend
│   ├── app.js                        # Express app configuration
│   ├── auth/                         # Authentication routes
│   ├── controller/                   # Business logic controllers
│   ├── database/                     # Database configuration
│   ├── routes/                       # API route definitions
│   └── media/                        # Media processing utilities
│
└── README.md                         # This file
```

## 🔧 Key Features

### Authentication & Security

- Email/password registration with verification
- Secure JWT token management with refresh tokens
- Password reset functionality
- Rate limiting and security headers
- Account management (username/email changes)

### Workout Management

- **Active Workout Tracking**: Real-time exercise tracking with pause/resume
- **Exercise Library**: Custom exercise creation with media support and secondary muscle group targeting
- **Template System**: Reusable workout routines
- **Progress Analytics**: Volume, sets, and performance tracking
- **Workout History**: Detailed historical data with filtering

### Data Management

- **Offline Support**: Local SQLite database for offline functionality
- **Sync Management**: Automatic data synchronization when online
- **Media Caching**: Local storage for exercise images/videos
- **Background Processing**: Efficient data handling and cleanup

### User Experience

- **Deep Linking**: Email verification and password reset links
- **Haptic Feedback**: Enhanced user interaction
- **Theme Support**: Light/dark mode switching
- **Responsive Design**: Optimized for various screen sizes
- **Loading States**: Comprehensive loading and error handling

## 📱 Platform Support

- **IOS**: Native IOS app via Expo Go

## 🔮 Planned Features

- Calendar view support
- Account deletion functionality
- Enhanced password security
- Session timeout management
- Improved error messaging
- Advanced analytics and reporting
- Social features (sharing workouts)
- Integration with Apple watch
- Better Andriod support

## 🐛 Known Issues

- Email verification flow can break in specific cases
- Token expiration handling needs enhancement
- Error messages could be more user-friendly
- UI is not completely thought out

## 🤝 Contributing

This is a personal project currently in active development. Contributions will not be used.
