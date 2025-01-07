import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';

const NewAppointment = ({ navigation, route }) => {
  const { customer = { name: '', phone: '' }, businessData = { services: [] } } = route.params || {};
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [note, setNote] = useState('');

  // דוגמה לשעות פנויות
  const availableTimes = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  ];

  const renderServiceItem = (service) => (
    <TouchableOpacity
      key={service.id}
      style={[
        styles.serviceItem,
        selectedService?.id === service.id && styles.selectedServiceItem
      ]}
      onPress={() => setSelectedService(service)}
    >
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceDetails}>
          {service.duration} דקות | ₪{service.price}
        </Text>
      </View>
      {selectedService?.id === service.id && (
        <Ionicons name="checkmark-circle" size={24} color={Color.primaryColorAmaranthPurple} />
      )}
    </TouchableOpacity>
  );

  const renderTimeSlot = (time) => (
    <TouchableOpacity
      key={time}
      style={[
        styles.timeSlot,
        selectedTime === time && styles.selectedTimeSlot
      ]}
      onPress={() => setSelectedTime(time)}
    >
      <Text style={[
        styles.timeText,
        selectedTime === time && styles.selectedTimeText
      ]}>
        {time}
      </Text>
    </TouchableOpacity>
  );

  const handleCreateAppointment = () => {
    // כאן יתבצע שמירת התור
    navigation.navigate('BusinessDashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>תור חדש</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* פרטי לקוח */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטי לקוח</Text>
          <View style={styles.customerInfo}>
            {customer.name ? (
              <>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerPhone}>{customer.phone}</Text>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.addCustomerButton}
                onPress={() => navigation.navigate('BusinessCustomers', { selectMode: true })}
              >
                <Text style={styles.addCustomerButtonText}>+ בחר לקוח</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* בחירת שירות */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>בחירת שירות</Text>
          {businessData.services.map(renderServiceItem)}
        </View>

        {/* בחירת שעה */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>בחירת שעה</Text>
          <View style={styles.timeGrid}>
            {availableTimes.map(renderTimeSlot)}
          </View>
        </View>

        {/* הערות */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הערות</Text>
          <TextInput
            style={styles.noteInput}
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
            placeholder="הוסף הערות לתור..."
            textAlign="right"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {selectedService && selectedTime ? (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateAppointment}
          >
            <Text style={styles.buttonText}>קבע תור</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.createButton, styles.disabledButton]}>
            <Text style={[styles.buttonText, styles.disabledText]}>
              יש לבחור שירות ושעה
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#333',
    marginBottom: 12,
  },
  customerInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  customerName: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#666',
  },
  addCustomerButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addCustomerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    marginBottom: 8,
  },
  selectedServiceItem: {
    backgroundColor: '#F8F0FF',
    borderColor: Color.primaryColorAmaranthPurple,
    borderWidth: 1,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#333',
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#666',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '23%',
    aspectRatio: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  selectedTimeSlot: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  timeText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#333',
  },
  selectedTimeText: {
    color: '#fff',
  },
  noteInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontFamily: FontFamily["Assistant-Regular"],
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
  },
  createButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
  },
  disabledText: {
    color: '#666',
  },
});

export default NewAppointment;
