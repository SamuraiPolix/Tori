import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, I18nManager, RefreshControl, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/common/BottomNavigation';
import FirebaseApi from '../utils/FirebaseApi';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const MyAppointments = ({ navigation, route }) => {
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

  useEffect(() => {
    if (route.params?.refresh) {
      fetchAppointments();
      // Clear the refresh parameter
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const currentUser = FirebaseApi.getCurrentUser();
      if (!currentUser) {
        navigation.navigate('Login');
        return;
      }

      const userAppointments = await FirebaseApi.getUserAppointments(currentUser.uid);
      const now = new Date();
      const upcoming = [];
      const past = [];
      
      for (const appointment of userAppointments) {
        // Skip completed appointments
        if (appointment.status === 'completed') continue;

        const appointmentDate = appointment.startTime.toDate();
        
        // Fetch business details (only need name and image)
        const businessData = await FirebaseApi.getBusinessData(appointment.businessId);

        let serviceName = appointment.serviceName;
        let servicePrice = appointment.servicePrice;
        let serviceDuration = appointment.serviceDuration;

        // If service data is not denormalized, look it up from business data
        if (!serviceName || !servicePrice || !serviceDuration) {
          const service = businessData.services.find(
            service => service.id === appointment.serviceId
          );
          if (service) {
            serviceName = service.name;
            servicePrice = service.price;
            serviceDuration = service.duration;
          } else {
            serviceName = 'שירות לא ידוע';
            servicePrice = 0;
            serviceDuration = 30;
          }
        }
        
        const appointmentWithDetails = {
          id: appointment.id,
          ...appointment,
          businessName: businessData.name,
          businessImage: businessData.image,
          serviceName,
          servicePrice,
          serviceDuration,
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
          upcoming.push(appointmentWithDetails);
        } else {
          past.push(appointmentWithDetails);
        }
      }

      // Sort appointments by date
      upcoming.sort((a, b) => a.startTime.toDate() - b.startTime.toDate());
      past.sort((a, b) => b.startTime.toDate() - a.startTime.toDate());

      setAppointments({ upcoming, past });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      var errorMessage = 'אירעה שגיאה בטעינת התורים - ' + error;
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await FirebaseApi.cancelAppointment(appointmentId);
      Alert.alert('הצלחה', 'התור בוטל בהצלחה');
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error canceling appointment:', error);
      var errorMessage = 'אירעה שגיאה בביטול התור - ' + error;
      Alert.alert('שגיאה', errorMessage);
    }
  };

  const handleReschedule = (appointment) => {
    navigation.navigate('RescheduleAppointment', { appointmentId: appointment.id });
  };

  const handleCancel = (appointment) => {
    handleCancelAppointment(appointment.id);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, []);

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
