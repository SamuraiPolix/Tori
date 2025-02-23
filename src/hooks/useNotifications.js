import { useEffect } from 'react';
import { Alert } from 'react-native';
import FirebaseApi from '../utils/FirebaseApi';

export const useNotifications = (navigation) => {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Initialize messaging
        const success = await FirebaseApi.setupMessaging();
        if (!success) {
          console.log('Failed to setup messaging');
          return;
        }

        // Handle foreground messages
        const unsubscribeForeground = FirebaseApi.onMessageReceived(async remoteMessage => {
          const { title, body } = remoteMessage.notification || {};
          if (title && body) {
            Alert.alert(title, body);
          }
        });

        // Handle notification taps when app is in background
        const unsubscribeBackground = FirebaseApi.onNotificationOpenedApp(remoteMessage => {
          handleNotificationNavigation(remoteMessage, navigation);
        });

        // Check if app was opened from a notification
        FirebaseApi.getInitialNotification().then(remoteMessage => {
          if (remoteMessage) {
            handleNotificationNavigation(remoteMessage, navigation);
          }
        });

        return () => {
          unsubscribeForeground();
          unsubscribeBackground();
        };
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, [navigation]);
};

const handleNotificationNavigation = (remoteMessage, navigation) => {
  const { type, appointmentId, businessId } = remoteMessage.data || {};

  switch (type) {
    case 'APPOINTMENT_APPROVED':
      navigation.navigate('MyAppointments', { appointmentId });
      break;
    case 'NEW_APPOINTMENT':
      if (businessId) {
        navigation.navigate('BusinessDashboard', { 
          screen: 'Appointments',
          params: { appointmentId } 
        });
      }
      break;
    // Add more cases as needed
    default:
      console.log('Unknown notification type:', type);
  }
};
