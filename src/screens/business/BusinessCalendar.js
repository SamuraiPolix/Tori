import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';

const BusinessCalendar = ({ navigation, route }) => {
  const businessData = route.params?.businessData || {
    businessName: 'העסק שלי',
    businessType: 'מספרה',
    businessAddress: 'רחוב הראשי 1, תל אביב',
    businessPhone: '050-1234567',
  };

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([
    {
      id: '1',
      customerName: 'ישראל ישראלי',
      service: 'תספורת + זקן',
      time: '09:00',
      duration: 45,
      status: 'confirmed',
    },
    {
      id: '2',
      customerName: 'משה כהן',
      service: 'תספורת גברים',
      time: '10:00',
      duration: 30,
      status: 'pending',
    },
    {
      id: '3',
      customerName: 'דוד לוי',
      service: 'זקן',
      time: '11:30',
      duration: 20,
      status: 'confirmed',
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'cancelled':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'מאושר';
      case 'pending':
        return 'ממתין לאישור';
      case 'cancelled':
        return 'בוטל';
      default:
        return '';
    }
  };

  const renderTimeSlot = (hour) => {
    const appointmentsAtHour = appointments.filter(app => app.time.startsWith(hour));
    return (
      <View key={hour} style={styles.timeSlot}>
        <Text style={styles.appointmentTime}>{hour}:00</Text>
        <View style={styles.appointmentsContainer}>
          {appointmentsAtHour.map(appointment => (
            <TouchableOpacity
              key={appointment.id}
              style={[
                styles.appointmentCard,
                { backgroundColor: getStatusColor(appointment.status) }
              ]}
              onPress={() => navigation.navigate('CustomerDetails', {
                customer: { name: appointment.customerName }
              })}
            >
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentCustomer}>{appointment.customerName}</Text>
                <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
              </View>
              <Text style={styles.appointmentService}>{appointment.service}</Text>
              <Text style={styles.durationText}>{appointment.duration} דקות</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => String(i + 8).padStart(2, '0'));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>יומן תורים</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewAppointment')}>
          <Ionicons name="add-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <CalendarStrip
        style={styles.calendar}
        calendarHeaderStyle={styles.calendarHeader}
        dateNumberStyle={styles.dateNumber}
        dateNameStyle={styles.dateName}
        highlightDateNumberStyle={styles.highlightDateNumber}
        highlightDateNameStyle={styles.highlightDateName}
        daySelectionAnimation={{
          type: 'background',
          duration: 200,
          highlightColor: Color.primaryColorAmaranthPurple,
        }}
        selectedDate={selectedDate}
        onDateSelected={setSelectedDate}
        scrollable
        calendarAnimation={{ type: 'sequence', duration: 30 }}
        iconContainer={{ flex: 0.1 }}
      />

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{appointments.length}</Text>
          <Text style={styles.summaryLabel}>תורים היום</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {appointments.filter(app => app.status === 'pending').length}
          </Text>
          <Text style={styles.summaryLabel}>ממתינים לאישור</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>₪640</Text>
          <Text style={styles.summaryLabel}>הכנסה צפויה</Text>
        </View>
      </View>

      <ScrollView style={styles.timelineContainer}>
        {timeSlots.map(renderTimeSlot)}
      </ScrollView>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('NewAppointment', {
          customer: {
            name: '',
            phone: ''
          },
          businessData: {
            services: [
              { id: '1', name: 'תספורת גברים', duration: 30, price: 80 },
              { id: '2', name: 'תספורת + זקן', duration: 45, price: 100 },
              { id: '3', name: 'זקן', duration: 20, price: 40 },
            ]
          }
        })}
      >
        <Text style={styles.addButtonText}>תור חדש</Text>
      </TouchableOpacity>
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
    fontFamily: FontFamily.assistantBold,
    color: Color.primaryColorAmaranthPurple,
  },
  calendar: {
    height: 100,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  calendarHeader: {
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.assistantBold,
    fontSize: 14,
  },
  dateNumber: {
    color: '#333',
    fontFamily: FontFamily.assistantRegular,
    fontSize: 14,
  },
  dateName: {
    color: '#666',
    fontFamily: FontFamily.assistantRegular,
    fontSize: 12,
  },
  highlightDateNumber: {
    color: '#fff',
    fontFamily: FontFamily.assistantBold,
    fontSize: 14,
  },
  highlightDateName: {
    color: '#fff',
    fontFamily: FontFamily.assistantRegular,
    fontSize: 12,
  },
  summary: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontFamily: FontFamily.assistantBold,
    color: Color.primaryColorAmaranthPurple,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: '#666',
  },
  timelineContainer: {
    flex: 1,
    padding: 16,
  },
  timeSlot: {
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  appointmentTime: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: Color.primaryColorAmaranthPurple,
    marginBottom: 8,
  },
  appointmentCustomer: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: '#333',
    marginBottom: 4,
  },
  appointmentService: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.assistantRegular,
    color: '#fff',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
  }
});

export default BusinessCalendar;
