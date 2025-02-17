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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import BusinessSidebar from '../../components/BusinessSidebar';
import FirebaseApi from '../../utils/FirebaseApi';

const BusinessDashboard = ({ navigation, route }) => {
  const [businessData, setBusinessData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [canceledAppointments, setCanceledAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    averageRating: 0
  });

  useEffect(() => {
    const loadBusinessData = async () => {
      setIsLoading(true);
      try {
        const currentUser = FirebaseApi.getCurrentUser();
        const userId = currentUser.uid;
        console.log('Current user ID:', userId);
        
        // Subscribe to business data changes
        const businessUnsubscribe = FirebaseApi.subscribeToBusinessData(
          userId,
          (data) => {
            console.log('Business data updated:', data);
            setBusinessData(data);
          },
          (error) => {
            console.error('Error in business listener:', error);
          }
        );

        // Subscribe to appointments changes
        const appointmentsUnsubscribe = FirebaseApi.subscribeToAppointments(
          userId,
          (appointments) => {
            console.log('Appointments updated');
            if (appointments.length > 0) {
              fetchAppointments(userId);
            } else {
              setPendingAppointments([]);
              setCanceledAppointments([]);
              setCompletedAppointments([]);
              setTodayAppointments([]);
              setFutureAppointments([]);
            }
          },
          (error) => {
            console.error('Error in appointments listener:', error);
          }
        );

        // Cleanup function
        return () => {
          businessUnsubscribe();
          appointmentsUnsubscribe();
        };
      } catch (error) {
        console.error('Error setting up listeners:', error);
      }
      finally {
        setIsLoading(false);
      }
    };

    loadBusinessData();
  }, []);  // Empty dependency array means this runs once on mount

  const fetchAppointments = async (businessId) => {
    try {
      console.log('Fetching appointments for business:', businessId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch appointments for this specific business
      const appointments = await FirebaseApi.getAppointments(businessId);

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

      // Collect all appointments and unique customer IDs
      const customerIds = new Set();

      appointments.forEach(appointment => {
        if (appointment.customerId) {
          customerIds.add(appointment.customerId);
        }
      });

      console.log('Unique customer IDs:', Array.from(customerIds));

      // Fetch all customers data in one batch
      const customersData = {};
      if (customerIds.size > 0) {
        const customerSnapshots = await Promise.all(
          Array.from(customerIds).map(customerId =>
            FirebaseApi.getCustomerData(customerId)
          )
        );

        customerSnapshots.forEach(customerDoc => {
          if (customerDoc.exists) {
            console.log('Customer data found:', customerDoc.id, customerDoc.data());
            customersData[customerDoc.id] = customerDoc.data();
          }
        });
      }

      // Process appointments and add customer data
      const processedAppointments = await Promise.all(appointments.map(async appointment => {
        console.log('------- Processing appointment -------');
        console.log('Full appointment data:', {
          id: appointment.id,
          serviceId: appointment.serviceId,
          businessId: appointment.businessId,
          status: appointment.status
        });
        
        // Format date and time from startTime
        let formattedDate = 'תאריך לא זמין';
        let formattedTime = 'שעה לא זמינה';
        
        try {
          if (appointment.startTime) {
            const date = new Date(appointment.startTime.seconds * 1000);
            formattedDate = date.toLocaleDateString('he-IL');
            formattedTime = date.toLocaleTimeString('he-IL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }
        } catch (error) {
          console.error('Error formatting date/time for appointment:', error);
        }

        // Get service details
        let service = null;
        if (appointment.serviceId && appointment.businessId) {
          try {
            // Get business data from Firestore
            console.log(`Fetching business data for ID: ${appointment.businessId}`);
            const businessDoc = await FirebaseApi.getBusinessData(appointment.businessId);
            
            if (businessDoc.exists) {
              const businessData = businessDoc.data();
              console.log('Business data:', {
                name: businessData.businessName,
                hasServices: !!businessData.services,
                serviceKeys: businessData.services ? Object.keys(businessData.services) : []
              });
              
              const businessServices = businessData.services || {};
              service = businessServices[appointment.serviceId];
              
              console.log('Service lookup:', {
                lookingFor: appointment.serviceId,
                found: !!service,
                serviceDetails: service ? {
                  name: service.name,
                  duration: service.duration,
                  price: service.price
                } : null
              });
            } else {
              console.log(`Business document not found for ID: ${appointment.businessId}`);
            }
          } catch (error) {
            console.error('Error fetching service details:', error);
            console.error('Error details:', {
              message: error.message,
              code: error.code
            });
          }
        } else {
          console.log('Missing required IDs:', { 
            hasServiceId: !!appointment.serviceId, 
            hasBusinessId: !!appointment.businessId 
          });
        }

        // Get customer data
        const customerData = customersData[appointment.customerId];
        
        const serviceDetails = service ? {
          id: appointment.serviceId,
          name: service.name || 'שם שירות לא זמין',
          duration: parseInt(service.duration) || 0,
          price: parseInt(service.price) || 0
        } : {
          name: 'שירות לא זמין',
          duration: 0,
          price: 0
        };

        console.log('Final processed appointment:', {
          id: appointment.id,
          status: appointment.status,
          serviceDetails,
          hasCustomerData: !!customerData
        });
        console.log('------- End processing appointment -------\n');
        
        return {
          ...appointment,
          formattedDate,
          time: formattedTime,
          service: serviceDetails,
          userData: customerData ? {
            name: customerData.name || customerData.fullName || 'לקוח לא ידוע',
            phone: customerData.phone || customerData.phoneNumber || 'מספר טלפון לא זמין',
            email: customerData.email || 'אימייל לא זמין'
          } : null
        };
      }));

      setStats({
        totalAppointments: processedAppointments.length,
        totalRevenue: processedAppointments
          .filter(app => app.status === 'completed')
          .reduce((acc, app) => acc + (app.service?.price || 0), 0),
        averageRating: calculateAverageRating(processedAppointments)
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

  const calculateAverageRating = (appointments) => {
    const completedWithRating = appointments.filter(app => app.status === 'completed' && app.rating);
    if (completedWithRating.length === 0) return 0;
    const totalRating = completedWithRating.reduce((sum, app) => sum + app.rating, 0);
    return totalRating / completedWithRating.length;
  };

  const handleUpdateAppointment = async (appointmentId, newStatus) => {
    try {
      setIsLoading(true);
      console.log(`Updating appointment ${appointmentId} to status: ${newStatus}`);

      const appointmentRef = FirebaseApi.getAppointmentRef(appointmentId);

      // עדכון הסטטוס והתאריך עדכון
      await FirebaseApi.updateAppointmentStatus(appointmentRef, newStatus);

      // הודעה למשתמש
      Alert.alert(
        'עדכון סטטוס',
        newStatus === 'approved' ? 'התור אושר בהצלחה!' : 'התור בוטל בהצלחה!',
        [{ text: 'אישור', style: 'default' }]
      );

      // רענון הנתונים
      const userId = FirebaseApi.getCurrentUser().uid;
      fetchAppointments(userId);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert(
        'שגיאה',
        'אירעה שגיאה בעדכון התור. אנא נסה שוב.',
        [{ text: 'אישור', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // if (isLoading) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.loadingContainer}>
  //         <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
  //         <Text style={styles.loadingText}>טוען נתונים...</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

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

      <ScrollView style={styles.mainContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>👋 ברוכים הבאים לדשבורד העסקי</Text>
          <Text style={styles.welcomeDescription}>
            כאן תוכלו לנהל את העסק שלכם ביעילות. צפו בתורים הממתינים לאישור, 
            תורים שבוטלו, ונהלו את הלקוחות שלכם במקום אחד. 
          </Text>
        </View>

        <View style={styles.appointmentSection}>
          <Text style={styles.sectionTitle}>⏳ תורים ממתינים לאישור</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
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
                    onPress={() => handleUpdateAppointment(appointment.id, 'approved')}
                    disabled={isLoading}
                  >
                    <Text style={[styles.actionButtonText, { color: '#16a34a' }]}>
                      {isLoading ? '...מעדכן' : '✓ אשר'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleUpdateAppointment(appointment.id, 'canceled')}
                    disabled={isLoading}
                  >
                    <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
                      {isLoading ? '...מעדכן' : '✕ בטל'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.appointmentSection}>
          <Text style={styles.sectionTitle}>🕒 תורים עתידיים להיום</Text>
          {futureAppointments.length === 0 ? (
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
          <Text style={styles.sectionTitle}>🚫 תורים שבוטלו</Text>
          {canceledAppointments.length === 0 ? (
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
            {'\n'}
            ממוצע דירוג: {stats.averageRating}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.primaryColorAmaranthPurple,
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
    color: Color.primaryColorAmaranthPurple,
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
    color: Color.primaryColorAmaranthPurple,
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.assistantBold,
    marginBottom: 16,
    textAlign: 'right',
    color: Color.primaryColorAmaranthPurple,
  },
  appointmentCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
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
