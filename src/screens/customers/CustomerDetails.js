import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import { Platform } from 'react-native';

const getDayName = (dateString) => {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const date = new Date(dateString);
  return days[date.getDay()];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('he-IL', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const CustomerDetails = ({ navigation, route }) => {
  const { customer } = route.params;
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCall = () => {
    Linking.openURL(`tel:${customer.phone}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=972${customer.phone.substring(1)}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${customer.email}`);
  };

  const handleCancelAppointment = () => {
    setShowCancelModal(false);
    // TODO: עדכון השרת
  };

  const renderCancelModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCancelModal}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>❌ ביטול תור</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>האם אתה בטוח שברצונך לבטל את התור?</Text>
              <Text style={styles.modalAppointmentDetails}>
                📅 {formatDate(customerWithNextAppointment.nextAppointment)} | ⏰ {formatTime(customerWithNextAppointment.nextAppointment)}
                {'\n'}
                ✂️ {customerWithNextAppointment.nextAppointmentService}
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCancelAppointment}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>כן, בטל תור</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCancelModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>חזור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const visitHistory = [
    {
      id: '1',
      date: '2024-01-15',
      service: 'תספורת + זקן',
      price: 120,
      stylist: 'דוד',
      status: 'completed', // completed או canceled
    },
    {
      id: '2',
      date: '2023-12-20',
      service: 'תספורת גברים',
      price: 80,
      stylist: 'משה',
      status: 'canceled',
    },
  ];

  // Add sample next appointment data if not provided
  const customerWithNextAppointment = {
    ...customer,
    nextAppointment: customer.nextAppointment || '2024-02-01T14:30:00',
    nextAppointmentService: customer.nextAppointmentService || 'תספורת גבר',
    nextAppointmentPrice: customer.nextAppointmentPrice || 80,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('EditCustomer', { customer })}>
            <Ionicons name="create-outline" size={24} color={Color.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 פרטי לקוח</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-forward" size={24} color={Color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* פרטי לקוח */}
          <View style={styles.section}>
            <View style={styles.customerHeader}>
              <View style={styles.contactButtons}>
                <TouchableOpacity 
                  style={[styles.contactButton, { backgroundColor: '#25D366' }]}
                  onPress={handleWhatsApp}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="whatsapp" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.contactButton, { backgroundColor: '#007AFF' }]}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="phone" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.contactButton, { backgroundColor: '#FF5722' }]}
                  onPress={handleEmail}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="envelope" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View>
                <Text style={styles.customerName}>👤 {customer.name}</Text>
                <Text style={styles.customerContact}>📱 {customer.phone}</Text>
                <Text style={styles.customerContact}>📧 {customer.email}</Text>
              </View>
            </View>
          </View>

          {/* סטטיסטיקות */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 סטטיסטיקות</Text>
            <View style={styles.statsGrid}>
            <View style={styles.statCard}>
                <Text style={[
                  styles.statValue,
                  customer.canceledAppointments > 0 && styles.canceledValue
                ]}>
                  {customer.canceledAppointments}
                </Text>
                <Text style={styles.statLabel}>❌ ביטולים</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{customer.totalVisits}</Text>
                <Text style={styles.statLabel}>✨ ביקורים</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>₪{customer.totalSpent}</Text>
                <Text style={styles.statLabel}>💰 סה"כ הוצאות</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.dateContainer}>
                  <Text style={styles.statValue}>{formatDate(customer.lastVisit)}</Text>
                  <Text style={styles.dayName}>יום {getDayName(customer.lastVisit)}</Text>
                </View>
                <Text style={styles.statLabel}>🕒 ביקור אחרון</Text>
              </View>
              
            </View>
          </View>

          {/* התור הבא */}
          {customerWithNextAppointment.nextAppointment && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    style={[styles.headerButton, styles.deleteButton]}
                    onPress={() => setShowCancelModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>ביטול</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.headerButton, styles.editButton]}
                    onPress={() => navigation.navigate('EditAppointment', { 
                      appointment: customerWithNextAppointment.nextAppointment,
                      customer: customerWithNextAppointment,
                      service: {
                        name: customerWithNextAppointment.nextAppointmentService,
                        price: customerWithNextAppointment.nextAppointmentPrice
                      }
                    })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={18} color="#10b981" />
                    <Text style={styles.editButtonText}>עריכה</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionTitle}>📅 התור הבא</Text>
              </View>
              <View style={styles.nextAppointment}>
                <View style={styles.nextAppointmentContent}>
                  <View style={styles.nextAppointmentRow}>
                    <View style={styles.appointmentBox}>
                      <Text style={styles.nextAppointmentTime}>
                        ⏰ {formatTime(customerWithNextAppointment.nextAppointment)}
                      </Text>
                      <Text style={styles.nextAppointmentLabel}>שעה</Text>
                    </View>
                    
                    <View style={styles.appointmentBox}>
                      <Text style={styles.nextAppointmentDate}>
                        {formatDate(customerWithNextAppointment.nextAppointment)}
                      </Text>
                      <Text style={styles.nextAppointmentLabel}>
                        יום {getDayName(customerWithNextAppointment.nextAppointment)}
                      </Text>
                    </View>

                    <View style={[styles.appointmentBox, styles.serviceBox]}>
                      <Text style={styles.nextAppointmentService}>
                        ✂️ {customerWithNextAppointment.nextAppointmentService}
                      </Text>
                      <Text style={styles.nextAppointmentPrice}>
                        💰 ₪{customerWithNextAppointment.nextAppointmentPrice}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* היסטוריית ביקורים */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 היסטוריית ביקורים</Text>
            {visitHistory.map(visit => (
              <View key={visit.id} style={styles.visitCard}>
                <Text style={styles.visitService}>✂️ {visit.service}</Text>
                <View style={styles.visitHeader}>
                  <View style={[
                    styles.statusBadge,
                    visit.status === 'completed' ? styles.completedBadge : styles.canceledBadge
                  ]}>
                    <Text style={styles.statusText}>
                      {visit.status === 'completed' ? '✅ בוצע' : '❌ בוטל'}
                    </Text>
                  </View>
                  <View style={styles.visitDateContainer}>
                    <Text style={styles.visitDate}>
                      📅 {formatDate(visit.date)} | יום {getDayName(visit.date)}
                    </Text>
                  </View>
                  <Text style={styles.visitPrice}>💰 ₪{visit.price}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.addAppointmentButton}
            onPress={() => navigation.navigate('BusinessDashboard', {
              screen: 'NewAppointment',
              params: { customer: customerWithNextAppointment }
            })}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>📅 קביעת תור חדש</Text>
          </TouchableOpacity>
        </View>
      </View>
      {renderCancelModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 20,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  customerContact: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'right',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    marginBottom: 16,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  canceledValue: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FontFamily.primary,
    color: '#64748b',
    textAlign: 'center',
  },
  visitCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  visitService: {
    fontSize: 15,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
  },
  canceledBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
    color: '#166534',
  },
  visitDateContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  visitDate: {
    fontSize: 13,
    fontFamily: FontFamily.primary,
    color: '#64748b',
    textAlign: 'right',
  },
  visitPrice: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  addAppointmentButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FontFamily.primary,
    fontWeight: 'bold',
  },
  dayName: {
    fontSize: 12,
    fontFamily: FontFamily.primary,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#dcfce7',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  editButtonText: {
    color: '#10b981',
    fontSize: 13,
    fontFamily: FontFamily.primary,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 13,
    fontFamily: FontFamily.primary,
    fontWeight: '500',
  },
  nextAppointment: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nextAppointmentContent: {
    flex: 1,
  },
  nextAppointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 12,
  },
  appointmentBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceBox: {
    flex: 1.5,
  },
  nextAppointmentTime: {
    fontSize: 16,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  nextAppointmentDate: {
    fontSize: 16,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  nextAppointmentLabel: {
    fontSize: 13,
    fontFamily: FontFamily.primary,
    color: '#64748b',
  },
  nextAppointmentService: {
    fontSize: 15,
    fontFamily: FontFamily.primary,
    color: Color.primary,
    marginBottom: 4,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextAppointmentPrice: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
    color: '#64748b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#ef4444',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalAppointmentDetails: {
    fontSize: 15,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'column',
    padding: 16,
    gap: 12,
  },
  modalButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#fff',
  },
  cancelButtonText: {
    color: '#6b7280',
  },
});

export default CustomerDetails;
