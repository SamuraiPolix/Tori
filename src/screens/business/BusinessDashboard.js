import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import BusinessSidebar from '../../components/BusinessSidebar';
import FirebaseApi from '../../utils/FirebaseApi';

const BusinessDashboard = ({ navigation, route }) => {
  const [businessData, setBusinessData] = useState(null);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [canceledAppointments, setCanceledAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    averageRating: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isManualRefresh, setIsManualRefresh] = useState(true);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const currentUser = FirebaseApi.getCurrentUser();
        if (!currentUser) {
          navigation.replace('BusinessLogin');
          return;
        }
  
        setBusinessId(currentUser.uid);
  
        // Subscribe to business data
        const businessUnsubscribe = FirebaseApi.subscribeToBusinessData(
          currentUser.uid,
          (data) => {
            console.log('Business data retrieved:', data);
            if (data) {
              setBusinessData(data);
              fetchAppointments(currentUser.uid, false);  // Auto-fetch on data load
            } else {
              navigation.replace('BusinessLogin');
            }
          },
          (error) => {
            console.error('Error in business data listener:', error);
          }
        );
  
        return () => {
          businessUnsubscribe();
        };
      } catch (error) {
        console.error('Error in loadBusinessData:', error);
      }
    };
  
    loadBusinessData();
  }, [navigation]);
  

  useEffect(() => {
    if (!businessId) return;
  
    const handleAppointmentUpdate = () => {
      fetchAppointments(businessId, false); // Ensure real-time updates match manual refresh
    };
  
    const pendingUnsubscribe = FirebaseApi.subscribeToPendingAppointments(
      businessId, 
      handleAppointmentUpdate, 
      (error) => console.error('Error in pending appointments:', error)
    );
  
    const approvedUnsubscribe = FirebaseApi.subscribeToApprovedAppointments(
      businessId, 
      handleAppointmentUpdate, 
      (error) => console.error('Error in approved appointments:', error)
    );
  
    const canceledUnsubscribe = FirebaseApi.subscribeToCanceledAppointments(
      businessId, 
      handleAppointmentUpdate, 
      (error) => console.error('Error in canceled appointments:', error)
    );
  
    const completedUnsubscribe = FirebaseApi.subscribeToCompletedAppointments(
      businessId, 
      handleAppointmentUpdate, 
      (error) => console.error('Error in completed appointments:', error)
    );
  
    return () => {
      pendingUnsubscribe();
      approvedUnsubscribe();
      canceledUnsubscribe();
      completedUnsubscribe();
    };
  }, [businessId]);
  
  const fetchAppointments = async (businessId, isManual = true) => {
    try {
      console.log('Fetching appointments for business:', businessId);
      
      // Only show loading if it's a manual refresh
      if (isManual) {
        setIsLoading(true);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch appointments for this specific business
      const appointments = await FirebaseApi.getBusinessAllAppointments(businessId);

      console.log('Appointments found:', appointments.length);

      if (appointments.length === 0) {
        console.log('No appointments found for this business');
        setPendingAppointments([]);
        setCanceledAppointments([]);
        setCompletedAppointments([]);
        setTodayAppointments([]);
        setFutureAppointments([]);
        setIsLoading(false);
        return;
      }

      // Process appointments
      const processedAppointments = appointments.map(appointment => {
        return {
          ...appointment,
          formattedDate: appointment.startTime ? new Date(appointment.startTime.seconds * 1000).toLocaleDateString('he-IL') : 'תאריך לא זמין',
          time: appointment.startTime ? new Date(appointment.startTime.seconds * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : 'שעה לא זמינה'
        };
      });

      setStats({
        totalAppointments: processedAppointments.length,
        totalRevenue: processedAppointments
          .filter(app => app.status === 'completed')
          .reduce((acc, app) => acc + (app.service?.price || 0), 0)
      });

      // Filter appointments by status and date
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const pending = processedAppointments.filter(app => app.status === 'pending');
      const canceled = processedAppointments.filter(app => app.status === 'canceled');
      const completed = processedAppointments.filter(app => app.status === 'completed');
      
      // Filter future appointments for today
      console.log('------------- Filtering Future Appointments -------------');
      console.log('Total appointments before filtering:', processedAppointments.length);
      
      const futureToday = processedAppointments.filter(app => {
        console.log('\nChecking appointment:', {
          id: app.id,
          status: app.status,
          startTime: app.startTime ? new Date(app.startTime.seconds * 1000).toLocaleString() : null,
          service: app.service?.name
        });

        if (!app.startTime) {
          console.log('Filtered out: No start time');
          return false;
        }
        if (app.status !== 'approved') {
          console.log('Filtered out: Status is not approved');
          return false;
        }

        const appDate = new Date(app.startTime.seconds * 1000);
        const appTime = appDate.getTime();
        const isToday = appTime > now.getTime() && appDate.getTime() < endOfDay.getTime();
        
        console.log('Time check:', {
          appointmentTime: appDate.toLocaleString(),
          currentTime: now.toLocaleString(),
          endOfDay: endOfDay.toLocaleString(),
          isInTimeRange: isToday
        });

        return isToday;
      }).sort((a, b) => {
        const timeA = new Date(a.startTime.seconds * 1000).getTime();
        const timeB = new Date(b.startTime.seconds * 1000).getTime();
        return timeA - timeB;
      });

      console.log('\nFinal future appointments:', futureToday.map(app => ({
        id: app.id,
        status: app.status,
        startTime: new Date(app.startTime.seconds * 1000).toLocaleString(),
        service: app.service?.name
      })));
      console.log('------------- End Filtering Future Appointments -------------\n');

      // Filter today's appointments
      const todayApps = processedAppointments.filter(app => {
        try {
          if (!app.startTime) return false;
          const appDate = new Date(app.startTime.seconds * 1000);
          return appDate >= startOfDay && appDate < endOfDay && app.status === 'completed';
        } catch (error) {
          console.error('Error filtering today appointments:', error);
          return false;
        }
      });

      console.log('Future appointments for today:', futureToday);

      setPendingAppointments(pending);
      setCanceledAppointments(canceled);
      setCompletedAppointments(completed);
      setTodayAppointments(todayApps);
      setFutureAppointments(futureToday);

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setIsLoading(false);
    }
  };

  const handleUpdateAppointment = async (appointmentId, newStatus) => {
    try {
      setIsLoading(true);

      await FirebaseApi.updateAppointmentStatus(appointmentId, newStatus);
      
      // Send notification to customer
      // not needed for now - using cloud functions
      // await FirebaseApi.sendAppointmentStatusNotification(
      //   appointmentId,
      //   newStatus
      // );

      const currentUser = FirebaseApi.getCurrentUser();
      if (currentUser) {
        await fetchAppointments(currentUser.uid);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון התור');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setIsManualRefresh(true); // Mark as manual refresh
    setRefreshing(true);
    try {
      const currentUser = FirebaseApi.getCurrentUser();
      if (currentUser) {
        fetchAppointments(currentUser.uid);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Add a check for complete data loading
  if (isLoading || !businessData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Color.primary} />
        <Text style={styles.loadingText}>טוען נתונים...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowSidebar(true)}
            >
              <Ionicons name="menu-outline" size={24} color={Color.primaryColorAmaranthPurple} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{businessData?.businessName || 'לוח בקרה'}</Text>
          <View style={styles.headerRight} />
        </View>
      </View>
      <BusinessSidebar 
        isVisible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        businessData={businessData}
        currentScreen="BusinessDashboard"
      />
      <ScrollView 
        style={styles.mainContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#156779']}
            tintColor="#156779"
            title="מרענן..."
            titleColor="#156779"
          />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>👋 ברוכים הבאים לדשבורד העסקי</Text>
          <Text style={styles.welcomeDescription}>
            כאן תוכלו לנהל את העסק שלכם ביעילות. צפו בתורים הממתינים לאישור, 
            תורים שבוטלו, ונהלו את הלקוחות שלכם במקום אחד. 
          </Text>
        </View>

        <View style={styles.appointmentSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>⏳ תורים ממתינים לאישור</Text>
          </View>
          {(isLoading && isManualRefresh) || isSubscriptionLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#156779" />
              <Text style={styles.loadingText}>טוען תורים ממתינים...</Text>
            </View>
          ) : pendingAppointments.length === 0 ? (
            <Text style={styles.emptyStateText}>אין תורים ממתינים</Text>
          ) : (
            pendingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <Text style={[styles.appointmentCustomer, { marginBottom: 8 }]}>
                  👤 {appointment.userData?.name || 'לקוח לא ידוע'}
                  {appointment.userData?.phone && `\n📱 ${appointment.userData.phone}`}
                </Text>
                <Text style={styles.appointmentDetails}>
                  {appointment.service?.name && `✂️ ${appointment.service.name}`}
                  {appointment.service?.price && ` - ₪${appointment.service.price}`}
                  {'\n'}
                  🗓️ {appointment.formattedDate} | ⏰ {appointment.time}
                </Text>
                <View style={styles.appointmentActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleUpdateAppointment(appointment.id, 'approved')}>
                    <Text style={styles.actionButtonText}>✓ אשר</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleUpdateAppointment(appointment.id, 'canceled')}>
                    <Text style={styles.actionButtonText}>✕ בטל</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.appointmentSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>🕒 תורים עתידיים להיום</Text>
          </View>
          {(isLoading && isManualRefresh) || isSubscriptionLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#156779" />
              <Text style={styles.loadingText}>טוען תורים עתידיים...</Text>
            </View>
          ) : futureAppointments.length === 0 ? (
            <Text style={styles.emptyStateText}>אין תורים עתידיים להיום</Text>
          ) : (
            futureAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <Text style={[styles.appointmentCustomer, { marginBottom: 8 }]}>
                  👤 {appointment.userData?.name || 'לקוח לא ידוע'}
                  {(appointment.userData?.phone || appointment.customerPhone) ? 
                    `\n📱 ${appointment.userData?.phone || appointment.customerPhone}` : ''}
                </Text>
                <Text style={styles.appointmentDetails}>
                  {appointment.service?.name && `✂️ ${appointment.service.name}`}
                  {appointment.service?.price && ` - ₪${appointment.service.price}`}
                  {'\n'}
                  🗓️ {appointment.formattedDate} | ⏰ {appointment.time}
                </Text>
                <Text style={[styles.statusText, { color: '#2563eb' }]}>✓ מאושר</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.appointmentSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>❌ תורים שבוטלו</Text>
          </View>
          {(isLoading && isManualRefresh) || isSubscriptionLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#156779" />
              <Text style={styles.loadingText}>טוען תורים שבוטלו...</Text>
            </View>
          ) : canceledAppointments.length === 0 ? (
            <Text style={styles.emptyStateText}>אין תורים שבוטלו</Text>
          ) : (
            canceledAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <Text style={[styles.appointmentCustomer, { marginBottom: 8 }]}>
                  👤 {appointment.userData?.name || 'לקוח לא ידוע'}
                  {(appointment.userData?.phone || appointment.customerPhone) ? 
                    `\n📱 ${appointment.userData?.phone || appointment.customerPhone}` : ''}
                </Text>
                <Text style={styles.appointmentDetails}>
                  {appointment.service?.name && `✂️ ${appointment.service.name}`}
                  {appointment.formattedDate && `\n🗓️ ${appointment.formattedDate}`}
                  {appointment.time && ` | ⏰ ${appointment.time}`}
                </Text>
                <Text style={styles.canceledStatus}>❌ בוטל</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.appointmentSection}>
          <Text style={styles.sectionTitle}>📊 סטטיסטיקות</Text>
          <Text style={styles.statsText}>
            מספר תורים: {stats.totalAppointments}
            {'\n'}
            הכנסות כוללות: {stats.totalRevenue}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: '#156779',
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: '#666',
    marginTop: 20,
  },
  header: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamily.rubikMedium,
    color: Color.primary,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: FontFamily.assistantBold,
    marginBottom: 10,
    textAlign: 'right',
    color: Color.primary,
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4a5568',
    textAlign: 'right',
    fontFamily: FontFamily.assistantRegular,
  },
  appointmentSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.assistantBold,
    textAlign: 'right',
    color: Color.primary,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  appointmentCustomer: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    marginBottom: 6,
    textAlign: 'right',
    color: '#2d3748',
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 10,
    textAlign: 'right',
    fontFamily: FontFamily.assistantRegular,
    lineHeight: 20,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#dcfce7',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantBold,
  },
  canceledStatus: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'right',
    fontFamily: FontFamily.assistantBold,
  },
  statsText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: '#4a5568',
    textAlign: 'right',
  }
});

export default BusinessDashboard;
