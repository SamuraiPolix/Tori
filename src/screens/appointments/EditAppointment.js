import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';

const EditAppointment = ({ navigation, route }) => {
  const { appointment, customer } = route.params;
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Mock data
  const treatments = [
    { id: '1', name: 'תספורת גבר', price: 80 },
    { id: '2', name: 'תספורת אישה', price: 120 },
    { id: '3', name: 'צבע', price: 200 },
    { id: '4', name: 'החלקה', price: 400 },
  ];

  const availableSlots = {
    '2024-01-20': ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
    '2024-01-21': ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
    '2024-01-22': ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
    '2024-01-23': ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSave = () => {
    if (selectedService && selectedDate && selectedTime) {
      setShowConfirmModal(true);
    }
  };

  const confirmAppointment = () => {
    setShowConfirmModal(false);
    // TODO: שמירת השינויים בשרת
    navigation.goBack();
  };

  const renderConfirmModal = () => {
    if (!selectedService || !selectedDate || !selectedTime) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✅ אישור עדכון תור</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.customerName}>👤 {customer.name}</Text>
              
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryValue}>✂️ {selectedService.name}</Text>
                  <Text style={styles.summaryLabel}>שירות</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryValue}>📅 {selectedDate}</Text>
                  <Text style={styles.summaryLabel}>תאריך</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryValue}>⏰ {selectedTime}</Text>
                  <Text style={styles.summaryLabel}>שעה</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryValue}>💰 ₪{selectedService.price}</Text>
                  <Text style={styles.summaryLabel}>מחיר</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmAppointment}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>אישור העדכון</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>חזור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-forward" size={24} color="#2196F3" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✏️ עריכת תור</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Services Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✂️ בחר שירות:</Text>
            <View style={styles.servicesGrid}>
              {treatments.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    selectedService?.id === service.id && styles.selectedServiceCard
                  ]}
                  onPress={() => handleServiceSelect(service)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.serviceName,
                    selectedService?.id === service.id && styles.selectedServiceText
                  ]}>
                    {service.name}
                  </Text>
                  <Text style={[
                    styles.servicePrice,
                    selectedService?.id === service.id && styles.selectedServiceText
                  ]}>
                    💰 ₪{service.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Selection */}
          {selectedService && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 בחר תאריך:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
                {Object.keys(availableSlots).map((date) => {
                  const dateObj = new Date(date);
                  const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][dateObj.getDay()];
                  const dayNumber = dateObj.getDate();
                  
                  return (
                    <TouchableOpacity
                      key={date}
                      style={[
                        styles.dateCard,
                        selectedDate === date && styles.selectedDateCard
                      ]}
                      onPress={() => handleDateSelect(date)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.dayName,
                        selectedDate === date && styles.selectedDateText
                      ]}>
                        {dayName}
                      </Text>
                      <Text style={[
                        styles.dayNumber,
                        selectedDate === date && styles.selectedDateText
                      ]}>
                        {dayNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Time Selection */}
          {selectedDate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ בחר שעה:</Text>
              <View style={styles.timeGrid}>
                {availableSlots[selectedDate].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeCard,
                      selectedTime === time && styles.selectedTimeCard
                    ]}
                    onPress={() => handleTimeSelect(time)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.timeText,
                      selectedTime === time && styles.selectedTimeText
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!selectedService || !selectedDate || !selectedTime) && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={!selectedService || !selectedDate || !selectedTime}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>💾 שמור שינויים</Text>
        </TouchableOpacity>

        {renderConfirmModal()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2196F3',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedServiceCard: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  serviceName: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  servicePrice: {
    fontSize: 15,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#666',
  },
  selectedServiceText: {
    color: '#333',
    fontFamily: FontFamily["Assistant-Bold"],
  },
  datesScroll: {
    marginBottom: 16,
  },
  dateCard: {
    width: 80,
    height: 80,
    marginRight: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateCard: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  dayName: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#666',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#333',
  },
  selectedDateText: {
    color: '#333',
    fontFamily: FontFamily["Assistant-Bold"],
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCard: {
    width: '23%',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  selectedTimeCard: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  timeText: {
    fontSize: 15,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#333',
  },
  selectedTimeText: {
    color: '#333',
    fontFamily: FontFamily["Assistant-Bold"],
  },
  saveButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#fff',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#fff',
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2196F3',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  customerName: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#334155',
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
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#64748b',
  },
});

export default EditAppointment;
