# Textile SMS App

A React Native/Expo app for SMS inbox insights and management.

## Features

- 📊 **Dashboard**: View SMS metrics with categorized counts
- 🍔 **Hamburger Menu**: Easy access to all app functions
- 📥 **Import**: SMS backup import functionality
- 📤 **Share**: Export SMS analysis reports
- 👑 **Pro Features**: Premium upgrade options
- ⚙️ **Settings**: App configuration and preferences

## Categories

- **Expired**: Expired 2FA and time-sensitive messages
- **Upcoming**: Messages with upcoming deadlines
- **Spam**: Promotional and spam messages
- **Social**: Personal and social messages

## Tech Stack

- **React Native** with Expo
- **TypeScript**
- **Expo Linear Gradient** for UI styling
- **Material Community Icons**
- **SQLite** for local data storage
- **XML Parser** for SMS backup processing

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd textile-sms-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start --clear --localhost
   ```

4. Run on your device:
   - **Android**: Press 'a' or scan QR code with Expo Go
   - **iOS**: Press 'i' or scan QR code with Camera app

## Project Structure

```
├── App.tsx                 # Main app component
├── LedgerSheet.tsx         # Message list view component
├── importSMS.ts            # SMS backup import functionality
├── app.json                # Expo configuration
├── assets/                 # App icons and images
│   └── appicons/          # Platform-specific icons
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Development

### Available Scripts

- `npx expo start` - Start the development server
- `npx expo start --clear` - Start with cleared cache
- `npx expo start --localhost` - Start in localhost mode

### Building

- **Android**: `npx expo build:android`
- **iOS**: `npx expo build:ios`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, visit [pro.textilesms.app](https://pro.textilesms.app)