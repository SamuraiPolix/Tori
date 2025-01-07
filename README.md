# Tori - Business Management App

## Project Structure

```
src/
├── screens/              # Application screens/pages
│   ├── auth/            # Authentication related screens
│   │   ├── Login.js
│   │   ├── Signup.js
│   │   ├── Verification.js
│   │   ├── Resetpass.js
│   │   └── Welcome.js
│   ├── business/        # Business management screens
│   │   ├── BusinessDashboard.js
│   │   ├── BusinessCalendar.js
│   │   ├── BusinessCustomers.js
│   │   ├── BusinessStats.js
│   │   ├── BusinessSettings.js
│   │   ├── BusinessSignup.js
│   │   ├── BusinessProfileSetup.js
│   │   ├── BusinessServicesSetup.js
│   │   └── BusinessScheduleSetup.js
│   ├── appointments/    # Appointment management screens
│   │   ├── NewAppointment.js
│   │   └── EditAppointment.js
│   ├── customers/       # Customer management screens
│   │   ├── CustomerDetails.js
│   │   └── EditCustomer.js
│   └── Home.js         # Main home screen
├── components/          # Reusable React components
│   ├── categories/     # Category related components
│   │   ├── CategoriesList.js
│   │   ├── CategoryItem.js
│   │   └── categoriesData.js
│   ├── common/         # Common UI components
│   │   ├── BottomNavigation.js
│   │   └── SearchBar.js
│   ├── filters/        # Filter related components
│   │   └── FilterModal.js
│   └── salons/         # Salon related components
│       ├── SalonsList.js
│       ├── SalonCard.js
│       ├── SalonDetails.js
│       ├── NearbySalonsList.js
│       └── salonsData.js
├── styles/             # Global styles and themes
│   └── GlobalStyles.js
├── services/           # API services and external integrations
│   └── firebase.js
├── context/            # React Context and state management
│   └── AuthContext.js


## Key Features

- 🔐 Authentication System
  - Login/Signup
  - Phone verification
  - Password reset

- 💼 Business Management
  - Dashboard overview
  - Calendar management
  - Customer management
  - Statistics and analytics
  - Service setup
  - Schedule management

- 📅 Appointment System
  - Create new appointments
  - Edit existing appointments
  - View appointment details

- 👥 Customer Management
  - Customer profiles
  - Customer history
  - Edit customer details

- 🎨 UI Components
  - Category browsing
  - Search functionality
  - Filter system
  - Salon listings and details

## Technologies Used

- React Native
- Expo
- React Navigation
- Firebase Authentication
- Custom UI Components
- RTL Support
