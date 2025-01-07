import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import BusinessSidebar from '../../components/BusinessSidebar';

const BusinessDashboard = ({ navigation, route }) => {
  const businessData = route.params?.businessData || {
    businessName: 'העסק שלי',
    businessType: 'מספרה',
    businessAddress: 'רחוב הראשי 1, תל אביב',
    businessPhone: '050-1234567',
  };
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(false);
  const [pendingAppointments] = useState([
    {
      id: 'p1',
      customerName: 'יעקב לוי',
      service: 'תספורת גברים',
      date: '2024-02-01',
      time: '15:00',
      status: 'pending'
    },
    {
      id: 'p2',
      customerName: 'משה כהן',
      service: 'תספורת + זקן',
      date: '2024-02-02',
      time: '12:30',
      status: 'pending'
    }
  ]);

  const [canceledAppointments] = useState([
    {
      id: 'c1',
      customerName: 'דן אבידן',
      service: 'תספורת גברים',
      date: '2024-02-01',
      time: '16:00',
      status: 'canceled'
    }
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <BusinessSidebar 
        isVisible={showSidebar}
        onClose={() => setShowSidebar(false)}
        businessData={businessData}
        navigation={navigation}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowSidebar(true)}
        >
          <Ionicons name="menu" size={24} color={Color.primary} />
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
          {pendingAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <Text style={styles.appointmentCustomer}>👤 {appointment.customerName}</Text>
              <Text style={styles.appointmentDetails}>
                ✂️ {appointment.service}
                {'\n'}
                🗓️ {appointment.date} | ⏰ {appointment.time}
              </Text>
              <View style={styles.appointmentActions}>
                <TouchableOpacity style={[styles.actionButton, styles.approveButton]}>
                  <Text style={styles.approveButtonText}>✅ אישור</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.rejectButton]}>
                  <Text style={styles.rejectButtonText}>❌ דחייה</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.appointmentSection}>
          <Text style={styles.sectionTitle}>🚫 תורים שבוטלו</Text>
          {canceledAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <Text style={styles.appointmentCustomer}>👤 {appointment.customerName}</Text>
              <Text style={styles.appointmentDetails}>
                ✂️ {appointment.service}
                {'\n'}
                🗓️ {appointment.date} | ⏰ {appointment.time}
              </Text>
              <Text style={styles.canceledStatus}>❌ בוטל</Text>
            </View>
          ))}
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
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
    fontFamily: FontFamily.primary,
    color: Color.primary,
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4a5568',
    textAlign: 'right',
    fontFamily: FontFamily.primary,
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
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
    fontFamily: FontFamily.primary,
    color: Color.primary,
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
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'right',
    fontFamily: FontFamily.primary,
    color: '#2d3748',
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 10,
    textAlign: 'right',
    fontFamily: FontFamily.primary,
    lineHeight: 20,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
  },
  approveButton: {
    borderColor: '#10b981',
  },
  rejectButton: {
    borderColor: '#ef4444',
  },
  approveButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: FontFamily.primary,
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: FontFamily.primary,
  },
  canceledStatus: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    fontFamily: FontFamily.primary,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 16,
    fontFamily: FontFamily.primary,
    color: Color.primary,
  },
  menuButton: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
});

export default BusinessDashboard;
