import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, I18nManager, RefreshControl, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/common/BottomNavigation';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { processAppointmentCancellation } from '../utils/cloudFunctions';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const MyAppointments = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: Color.grayscaleColorSpanishGray };
      case 'approved':
        return { backgroundColor: '#34C759' }; // iOS green color
      case 'canceled':
      case 'declined':
        return { backgroundColor: '#FF3B30' }; // iOS red color
      case 'rescheduled':
        return { backgroundColor: '#FF9500' }; // iOS orange color
      default:
        return { backgroundColor: Color.grayscaleColorSpanishGray };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'ממתין לאישור';
      case 'approved':
        return 'מאושר';
      case 'canceled':
        return 'בוטל';
      case 'declined':
        return 'לא אושר';
      case 'rescheduled':
        return 'ממתין לאישור';
      default:
        return 'ממתין לאישור';
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const currentUser = auth().currentUser;
      if (!currentUser) {
        navigation.navigate('Login');
        return;
      }

      const appointmentsRef = firestore()
        .collection('appointments')
        .where('customerId', '==', currentUser.uid);

      const snapshot = await appointmentsRef.get();
      const now = new Date();
      const upcoming = [];
      const past = [];
      
      for (const doc of snapshot.docs) {
        const appointmentData = doc.data();
        // Skip completed appointments
        if (appointmentData.status === 'completed') continue;

        const appointmentDate = appointmentData.startTime.toDate();
        
        // Fetch business details and find service name
        const businessDoc = await firestore()
          .collection('businesses')
          .doc(appointmentData.businessId)
          .get();
        
        const businessData = businessDoc.data();
        
        // Find the service name from the services array
        const service = businessData.services.find(
          service => service.id === appointmentData.serviceId
        );
        const serviceName = service ? service.name : 'שירות לא ידוע';

        const appointment = {
          id: doc.id,
          ...appointmentData,
          businessName: businessData.name,
          businessImage: businessData.image,
          serviceName: serviceName, // Add service name
          date: appointmentDate.toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          time: appointmentDate.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        };

        if (appointmentDate > now) {
          upcoming.push(appointment);
        } else {
          past.push(appointment);
        }
      }

      setAppointments({
        upcoming: upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
        past: past.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת התורים');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAppointments().finally(() => setRefreshing(false));
  }, []);

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await processAppointmentCancellation(appointmentId);
      // Refresh appointments after cancellation
      setAppointments(prev => ({
        ...prev,
        upcoming: prev.upcoming.filter(apt => apt.id !== appointmentId)
      }));
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleReschedule = (appointment) => {
    navigation.navigate('RescheduleAppointment', { appointmentId: appointment.id });
  };

  const handleCancel = (appointment) => {
    handleCancelAppointment(appointment.id);
  };

  const renderAppointmentCard = (appointment, isPast = false) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Image
          source={{ uri: appointment.businessImage }}
          style={styles.businessImage}
        />
        <View style={styles.appointmentInfo}>
          <View style={styles.businessInfoRow}>
            <Text style={styles.businessName}>{appointment.businessName}</Text>
            <View style={[styles.statusBadge, getStatusStyle(appointment.status)]}>
              <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
            </View>
          </View>
          <Text style={styles.serviceText}>{appointment.serviceName}</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="calendar-outline" size={16} color={Color.grayscaleColorSpanishGray} />
            <Text style={styles.timeText}>{appointment.date}</Text>
            <Ionicons name="time-outline" size={16} color={Color.grayscaleColorSpanishGray} style={{ marginLeft: 8 }} />
            <Text style={styles.timeText}>{appointment.time}</Text>
          </View>
        </View>
      </View>

      {!isPast && appointment.status !== 'canceled' && appointment.status !== 'declined' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleReschedule(appointment)}
          >
            <Text style={styles.editButtonText}>שינוי תור</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancel(appointment)}
          >
            <Text style={styles.cancelButtonText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>התורים שלי</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            תורים קרובים
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            היסטוריית תורים
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Color.primaryColorAmaranthPurple]}
            tintColor={Color.primaryColorAmaranthPurple}
          />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>טוען...</Text>
        ) : (
          appointments[activeTab]?.map((appointment) => 
            renderAppointmentCard(appointment, activeTab === 'past')
          )
        )}
      </ScrollView>
      <BottomNavigation 
        activeTab="appointments"
        onTabPress={(tabId) => {
          if (tabId !== 'appointments') {
            const screens = {
              home: 'Home',
              saved: 'Saved',
              profile: 'Profile',
            };
            if (screens[tabId]) {
              navigation.navigate(screens[tabId]);
            }
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  header: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorWhite,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Color.grayscaleColorWhite,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Color.primaryColorAmaranthPurple,
  },
  activeTabText: {
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.assistantBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  appointmentCard: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  businessInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: '100%',
  },
  businessName: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.assistantSemiBold,
    color: Color.grayscaleColorWhite,
  },
  serviceText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    marginLeft: 4,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  noAppointmentsText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  editButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  cancelButton: {
    backgroundColor: Color.grayscaleColorWhite,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  editButtonText: {
    color: Color.grayscaleColorWhite,
    fontSize: 14,
    fontFamily: FontFamily.assistantBold,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: FontFamily.assistantBold,
  },
});

export default MyAppointments;
