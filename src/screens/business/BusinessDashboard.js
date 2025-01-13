import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import BusinessSidebar from '../../components/BusinessSidebar';
import firestore from '@react-native-firebase/firestore';

const BusinessDashboard = ({ navigation, route }) => {
  const { businessId, businessData: initialBusinessData } = route.params;
  const [businessData, setBusinessData] = useState(initialBusinessData);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [canceledAppointments, setCanceledAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchBusinessData();
    fetchAppointments();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .get();
      
      if (businessDoc.exists) {
        const data = businessDoc.data();
        setBusinessData(data);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Query for today's appointments
      const todayQuery = firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .where('date', '>=', today)
        .where('date', '<', tomorrow);

      // Queries for different appointment statuses
      const pendingQuery = firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .where('status', '==', 'pending');
      
      const canceledQuery = firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .where('status', '==', 'canceled');

      const completedQuery = firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .where('status', '==', 'completed');

      // Fetch all queries in parallel
      const [todaySnap, pendingSnap, canceledSnap, completedSnap] = await Promise.all([
        todayQuery.get(),
        pendingQuery.get(),
        canceledQuery.get(),
        completedQuery.get()
      ]);

      // Process results
      const todayAppts = todaySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pendingAppts = pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const canceledAppts = canceledSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedAppts = completedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate statistics
      const totalRevenue = completedAppts.reduce((sum, appt) => sum + (appt.price || 0), 0);
      const ratings = completedAppts.filter(appt => appt.rating).map(appt => appt.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      setTodayAppointments(todayAppts);
      setPendingAppointments(pendingAppts);
      setCanceledAppointments(canceledAppts);
      setCompletedAppointments(completedAppts);
      setStats({
        totalAppointments: completedAppts.length,
        totalRevenue,
        averageRating
      });

    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAppointment = async (appointmentId, newStatus) => {
    try {
      await firestore()
        .collection('appointments')
        .doc(appointmentId)
        .update({
          status: newStatus,
          updatedAt: new Date()
        });

      // Refresh data
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
          <Text style={styles.loadingText}>טוען נתונים...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BusinessSidebar 
        isVisible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        businessData={businessData}
        currentScreen="BusinessDashboard"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowSidebar(true)}
        >
          <Ionicons name="menu-outline" size={28} color={Color.primaryColorAmaranthPurple} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{businessData.businessName}</Text>
      </View>
      
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
          {pendingAppointments.length === 0 ? (
            <Text style={styles.emptyStateText}>אין תורים ממתינים לאישור</Text>
          ) : (
            pendingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <Text style={styles.appointmentCustomer}>👤 {appointment.customerName}</Text>
                <Text style={styles.appointmentDetails}>
                  ✂️ {appointment.service}
                  {'\n'}
                  🗓️ {appointment.date} | ⏰ {appointment.time}
                </Text>
                <View style={styles.appointmentActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleUpdateAppointment(appointment.id, 'confirmed')}
                  >
                    <Text style={styles.approveButtonText}>✅ אישור</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleUpdateAppointment(appointment.id, 'canceled')}
                  >
                    <Text style={styles.rejectButtonText}>❌ דחייה</Text>
                  </TouchableOpacity>
                </View>
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
                <Text style={styles.appointmentCustomer}>👤 {appointment.customerName}</Text>
                <Text style={styles.appointmentDetails}>
                  ✂️ {appointment.service}
                  {'\n'}
                  🗓️ {appointment.date} | ⏰ {appointment.time}
                </Text>
                <Text style={styles.canceledStatus}>❌ בוטל</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.appointmentSection}>
          <Text style={styles.sectionTitle}>📆 תורים שהתקיימו היום</Text>
          {todayAppointments.length === 0 ? (
            <Text style={styles.emptyStateText}>אין תורים שהתקיימו היום</Text>
          ) : (
            todayAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <Text style={styles.appointmentCustomer}>👤 {appointment.customerName}</Text>
                <Text style={styles.appointmentDetails}>
                  ✂️ {appointment.service}
                  {'\n'}
                  🗓️ {appointment.date} | ⏰ {appointment.time}
                </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamily.assistantBold,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'right',
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
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  approveButtonText: {
    fontSize: 14,
    color: '#16a34a',
    fontFamily: FontFamily.assistantBold,
  },
  rejectButtonText: {
    fontSize: 14,
    color: '#dc2626',
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
