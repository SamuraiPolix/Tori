import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nManager } from 'react-native';

// Enable RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Auth Screens
import Welcome from "./src/screens/auth/Welcome";
import Login from "./src/screens/auth/Login";
import Signup from "./src/screens/auth/Signup";
import Verification from "./src/screens/auth/Verification";
import Resetpass from "./src/screens/auth/Resetpass";

// Main Screen
import Home from "./src/screens/Home";

// Business Screens
import BusinessDashboard from "./src/screens/business/BusinessDashboard";
import BusinessCalendar from "./src/screens/business/BusinessCalendar";
import BusinessCustomers from "./src/screens/business/BusinessCustomers";
import BusinessStats from "./src/screens/business/BusinessStats";
import BusinessSettings from "./src/screens/business/BusinessSettings";
import BusinessSignup from "./src/screens/business/BusinessSignup";
import BusinessProfileSetup from "./src/screens/business/BusinessProfileSetup";
import BusinessServicesSetup from "./src/screens/business/BusinessServicesSetup";
import BusinessScheduleSetup from "./src/screens/business/BusinessScheduleSetup";

// Appointment Screens
import NewAppointment from "./src/screens/appointments/NewAppointment";
import EditAppointment from "./src/screens/appointments/EditAppointment";

// Customer Screens
import CustomerDetails from "./src/screens/customers/CustomerDetails";
import EditCustomer from "./src/screens/customers/EditCustomer";

// Components
import BusinessSidebar from "./src/components/BusinessSidebar";
import SalonDetails from "./src/components/salons/SalonDetails";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [hideSplashScreen, setHideSplashScreen] = React.useState(true);

  const [fontsLoaded, error] = useFonts({
    "Assistant-ExtraLight": require("./src/assets/fonts/Assistant-ExtraLight.ttf"),
    "Assistant-Regular": require("./src/assets/fonts/Assistant-Regular.ttf"),
    "Assistant-Bold": require("./src/assets/fonts/Assistant-Bold.ttf"),
  });

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fff" }
      }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Verification" component={Verification} />
      <Stack.Screen name="Resetpass" component={Resetpass} />

      {/* Main Screen */}
      <Stack.Screen name="Home" component={Home} />

      {/* Business Screens */}
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboard} />
      <Stack.Screen name="BusinessCalendar" component={BusinessCalendar} />
      <Stack.Screen name="BusinessCustomers" component={BusinessCustomers} />
      <Stack.Screen name="BusinessStats" component={BusinessStats} />
      <Stack.Screen name="BusinessSettings" component={BusinessSettings} />
      <Stack.Screen name="BusinessSignup" component={BusinessSignup} />
      <Stack.Screen name="BusinessProfileSetup" component={BusinessProfileSetup} />
      <Stack.Screen name="BusinessServicesSetup" component={BusinessServicesSetup} />
      <Stack.Screen name="BusinessScheduleSetup" component={BusinessScheduleSetup} />

      {/* Appointment Screens */}
      <Stack.Screen name="NewAppointment" component={NewAppointment} />
      <Stack.Screen name="EditAppointment" component={EditAppointment} />

      {/* Customer Screens */}
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
      <Stack.Screen name="EditCustomer" component={EditCustomer} />

      {/* Other Screens */}
      <Stack.Screen name="SalonDetails" component={SalonDetails} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});