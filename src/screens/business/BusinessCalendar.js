import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import BusinessSidebar from '../../components/BusinessSidebar';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const BusinessCalendar = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [timeSlots, setTimeSlots] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [businessData, setBusinessData] = useState(null);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  useEffect(() => {
    if (businessData) {
      fetchAppointments();
    }
  }, [selectedDate, businessData]);

  const fetchBusinessData = async () => {
    try {
      const businessId = auth().currentUser.uid;
      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .get();

      if (!businessDoc.exists) {
        setError('לא נמצא מידע על העסק');
        return;
      }

      const data = businessDoc.data();
      console.log('Fetched business data:', {
        workingHours: data.workingHours,
        slotDuration: data.slotDuration
      });
      setBusinessData({ ...data, businessId });
    } catch (error) {
      console.error('Error fetching business data:', error);
      setError('שגיאה בטעינת נתוני העסק');
    }
  };

  // Function to get working hours for a specific day
  const getWorkingHours = (date) => {
    if (!date || !businessData?.workingHours) {
      console.log('Missing date or working hours:', { date, workingHours: businessData?.workingHours });
      return null;
    }
    
    // If date is a moment object (from CalendarStrip), convert to JS Date
    const jsDate = date._d ? new Date(date._d) : new Date(date);
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[jsDate.getDay()];
    
    console.log('Getting working hours for:', {
      dayName,
      workingHours: businessData.workingHours[dayName]
    });

    const dayWorkingHours = businessData.workingHours[dayName];
    
    if (!dayWorkingHours || !dayWorkingHours.isOpen) {
      console.log('Business is closed on:', dayName);
      return null;
    }

    // Make sure we have all required fields
    if (!dayWorkingHours.open || !dayWorkingHours.close) {
      console.log('Invalid working hours format:', dayWorkingHours);
      return null;
    }

    // Convert HH:MM format to hours and minutes
    const [startHour, startMinute = "00"] = dayWorkingHours.open.split(":");
    const [endHour, endMinute = "00"] = dayWorkingHours.close.split(":");

    return {
      isOpen: true,
      startHour: parseInt(startHour),
      startMinute: parseInt(startMinute),
      endHour: parseInt(endHour),
      endMinute: parseInt(endMinute)
    };
  };

  // Function to generate time slots
  const generateTimeSlots = (workingHours, appointments) => {
    console.log('Generating slots with:', { workingHours, appointmentsCount: appointments.length });
    
    if (!workingHours || !workingHours.isOpen) {
      console.log('No working hours or business is closed');
      return {};
    }

    const slots = {};
    const slotDuration = businessData.slotDuration || 30; // ברירת מחדל 30 דקות אם לא מוגדר
    console.log('Using slot duration:', slotDuration, 'minutes');
    
    // Convert working hours to minutes since midnight
    const startMinutes = parseInt(workingHours.startHour) * 60 + parseInt(workingHours.startMinute || 0);
    const endMinutes = parseInt(workingHours.endHour) * 60 + parseInt(workingHours.endMinute || 0);
    
    console.log('Working hours:', 
      `${Math.floor(startMinutes/60)}:${startMinutes%60} to ${Math.floor(endMinutes/60)}:${endMinutes%60}`);

    // Generate all possible slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Find appointment for this slot
      const appointment = appointments.find(app => {
        if (!app.startTime) return false;
        const appTime = app.startTime.toDate();
        const appHour = appTime.getHours();
        const appMinute = appTime.getMinutes();
        return appHour === hour && appMinute === minute;
      });

      if (!slots[hour]) {
        slots[hour] = [];
      }
      
      slots[hour].push({
        time: timeString,
        hour,
        minute,
        appointment: appointment || null,
        isAvailable: !appointment
      });
    }

    console.log('Generated slots structure:', {
      hours: Object.keys(slots),
      totalSlots: Object.values(slots).reduce((total, hourSlots) => total + hourSlots.length, 0)
    });
    
    return slots;
  };

  const fetchAppointments = async () => {
    if (!businessData || !selectedDate) {
      console.log('Missing required data:', { businessData, selectedDate });
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Convert moment date to JS Date if needed
      const jsDate = selectedDate._d ? new Date(selectedDate._d) : new Date(selectedDate);
      
      // Get start and end of selected date
      const startOfDay = new Date(jsDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(jsDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('Fetching appointments for:', {
        date: jsDate,
        businessId: businessData.businessId,
        businessHours: businessData.workingHours,
        scheduleSettings: businessData.scheduleSettings
      });

      // Get working hours for selected date
      const workingHours = getWorkingHours(selectedDate);
      console.log('Working hours:', workingHours);

      if (!workingHours || !workingHours.isOpen) {
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][jsDate.getDay()];
        setError(`העסק סגור ב${dayName}`);
        setIsLoading(false);
        return;
      }

      // Fetch appointments for selected date
      const appointmentsQuery = await firestore()
        .collection('appointments')
        .where('businessId', '==', businessData.businessId)
        .get();

      console.log('Found appointments:', appointmentsQuery.size);

      // Generate time slots even if there are no appointments
      if (appointmentsQuery.empty) {
        console.log('No appointments found, generating empty slots');
        const slots = generateTimeSlots(workingHours, []);
        console.log('Generated slots:', slots);
        if (Object.keys(slots).length === 0) {
          setError('שגיאה ביצירת מערכת השעות');
        } else {
          setTimeSlots(slots);
          setAppointments([]);
        }
        setIsLoading(false);
        return;
      }

      // Filter appointments for the selected date in memory
      const filteredAppointments = appointmentsQuery.docs.filter(doc => {
        const appointmentData = doc.data();
        if (!appointmentData.startTime) return false;
        
        const appointmentDate = new Date(appointmentData.startTime.toDate());
        return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
      });

      console.log('Filtered appointments for date:', filteredAppointments.length);

      // Get business services for reference
      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessData.businessId)
        .get();
      
      const businessServices = businessDoc.exists ? businessDoc.data().services || {} : {};

      const appointmentsData = await Promise.all(
        filteredAppointments.map(async doc => {
          const appointmentData = doc.data();
          
          // Get customer data
          let customerData = null;
          if (appointmentData.customerId) {
            try {
              const customerDoc = await firestore()
                .collection('users')
                .doc(appointmentData.customerId)
                .get();
              customerData = customerDoc.exists ? customerDoc.data() : null;
            } catch (error) {
              console.error('Error fetching customer data:', error);
            }
          }

          // Get service details
          const service = businessServices[appointmentData.serviceId] || null;

          return {
            id: doc.id,
            startTime: appointmentData.startTime,
            customerName: customerData?.name || customerData?.fullName || 'לקוח לא ידוע',
            service: service ? {
              name: service.name,
              duration: service.duration,
              price: service.price
            } : null,
            status: appointmentData.status || 'pending',
            customerPhone: customerData?.phone || customerData?.phoneNumber || '',
          };
        })
      );

      // Generate time slots with appointments
      const slots = generateTimeSlots(workingHours, appointmentsData);
      console.log('Generated slots structure:', {
        hours: Object.keys(slots),
        totalSlots: Object.values(slots).reduce((total, hourSlots) => total + hourSlots.length, 0)
      });
      
      if (Object.keys(slots).length === 0) {
        setError('שגיאה ביצירת מערכת השעות');
      } else {
        setTimeSlots(slots);
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('שגיאה בטעינת התורים');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'מאושר';
      case 'pending':
        return 'ממתין לאישור';
      case 'canceled':
        return 'בוטל';
      case 'completed':
        return 'הושלם';
      default:
        return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#34C759';
      case 'pending':
        return '#F7DC6F';
      case 'canceled':
        return '#DC2626';
      case 'completed':
        return '#8B9467';
      default:
        return '#fff';
    }
  };

  console.log('Rendering with:', {
    businessData,
    selectedDate,
    timeSlotsCount: Object.keys(timeSlots).length,
    isLoading,
    error
  });

  return (
    <View style={styles.container}>
      {showSidebar && (
        <BusinessSidebar
          businessData={businessData || {}}
          onClose={() => setShowSidebar(false)}
          navigation={navigation}
        />
      )}
      <SafeAreaView style={styles.mainContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={Color.primaryColorAmaranthPurple} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>יומן תורים</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowSidebar(true)}
            >
              <Ionicons name="menu-outline" size={24} color={Color.primaryColorAmaranthPurple} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.calendarContainer}>
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
              onDateSelected={date => setSelectedDate(date)}
              scrollable={true}
              locale={{
                name: 'he',
                config: {
                  weekdaysShort: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
                }
              }}
            />
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.scheduleContainer}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineTitle}>
                  {selectedDate && selectedDate._d ? 
                    selectedDate._d.toLocaleDateString('he-IL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 
                    new Date().toLocaleDateString('he-IL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  }
                </Text>
              </View>
              
              <ScrollView style={styles.timeline}>
                <View style={styles.tableContainer}>
                  <View style={styles.headerRow}>
                    <View style={styles.hourCell}>
                      <Text style={styles.headerText}>שעה</Text>
                    </View>
                    <View style={styles.slotsHeaderContainer}>
                      <Text style={styles.headerText}>תורים</Text>
                    </View>
                  </View>
                  {Object.keys(timeSlots).length === 0 ? (
                    <View style={styles.noSlotsContainer}>
                      <Text style={styles.noSlotsText}>
                        {error || 'אין שעות זמינות ליום זה'}
                      </Text>
                    </View>
                  ) : (
                    Object.entries(timeSlots)
                      .sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB))
                      .map(([hour, hourSlots]) => (
                        <View key={hour} style={styles.hourRow}>
                          <View style={styles.hourCell}>
                            <Text style={styles.hourText}>{hour.padStart(2, '0')}:00</Text>
                          </View>
                          <View style={styles.slotsContainer}>
                            {hourSlots.map((slot, index) => (
                              <View 
                                key={`${slot.hour}-${slot.minute}`} 
                                style={[
                                  styles.slotCell,
                                  slot.appointment ? styles.bookedSlot : styles.availableSlot,
                                  index === 0 && styles.firstSlot,
                                  index === hourSlots.length - 1 && styles.lastSlot
                                ]}
                              >
                                <Text style={styles.slotTime}>{slot.time}</Text>
                                {slot.appointment ? (
                                  <TouchableOpacity 
                                    style={styles.appointmentContent}
                                    onPress={() => navigation.navigate('EditAppointment', {
                                      appointmentId: slot.appointment.id,
                                      appointment: slot.appointment
                                    })}
                                  >
                                    <Text style={styles.customerName} numberOfLines={1}>
                                      {slot.appointment.customerName || slot.appointment.userData?.name}
                                    </Text>
                                    {slot.appointment.service && (
                                      <Text style={styles.serviceDetails} numberOfLines={1}>
                                        {slot.appointment.service.name}
                                      </Text>
                                    )}
                                    <View style={[
                                      styles.statusBadge,
                                      { backgroundColor: getStatusColor(slot.appointment.status) }
                                    ]}>
                                      <Text style={styles.statusText}>
                                        {getStatusText(slot.appointment.status)}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity 
                                    style={styles.bookButton}
                                    onPress={() => navigation.navigate('NewAppointment', {
                                      businessId: businessData.businessId,
                                      selectedDate: selectedDate,
                                      selectedTime: slot.time,
                                      businessData
                                    })}
                                  >
                                    <Text style={styles.bookButtonText}>פנוי</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            ))}
                          </View>
                        </View>
                      ))
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    height: Platform.OS === 'android' ? 80 : 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontFamily: FontFamily.rubikMedium,
    fontSize: 20,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'center',
  },
  iconButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  calendar: {
    height: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  calendarHeader: {
    color: '#1a1a1a',
    fontSize: 16,
    fontFamily: FontFamily.rubikMedium,
  },
  dateNumber: {
    color: '#1a1a1a',
    fontSize: 14,
    fontFamily: FontFamily.rubikRegular,
  },
  dateName: {
    color: '#666',
    fontSize: 12,
    fontFamily: FontFamily.rubikRegular,
  },
  highlightDateNumber: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FontFamily.rubikMedium,
  },
  highlightDateName: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FontFamily.rubikMedium,
  },
  scheduleContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  timelineHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  timelineTitle: {
    fontSize: 20,
    fontFamily: FontFamily.rubikMedium,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 16,
    fontFamily: FontFamily.rubikRegular,
    color: '#666',
  },
  timeline: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
  },
  slotsHeaderContainer: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontFamily: FontFamily.rubikMedium,
    color: '#495057',
  },
  hourRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  hourCell: {
    width: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  hourText: {
    fontSize: 16,
    fontFamily: FontFamily.rubikMedium,
    color: '#495057',
  },
  slotsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  slotCell: {
    flex: 1,
    padding: 8,
    minHeight: 60,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
    justifyContent: 'center',
  },
  firstSlot: {
    borderLeftWidth: 1,
    borderLeftColor: '#e9ecef',
  },
  lastSlot: {
    borderRightWidth: 0,
  },
  slotTime: {
    fontSize: 14,
    fontFamily: FontFamily.rubikMedium,
    color: '#495057',
    marginBottom: 4,
    textAlign: 'center',
  },
  availableSlot: {
    backgroundColor: '#fff',
  },
  bookedSlot: {
    backgroundColor: '#f8f9fa',
  },
  appointmentContent: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
  },
  customerName: {
    fontFamily: FontFamily.rubikMedium,
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceDetails: {
    fontFamily: FontFamily.rubikRegular,
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: FontFamily.rubikRegular,
    fontSize: 10,
    color: '#fff',
  },
  bookButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FontFamily.rubikMedium,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FontFamily.rubikMedium,
    color: '#dc3545',
    textAlign: 'center',
    padding: 20,
  },
  noSlotsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 16,
    fontFamily: FontFamily.rubikMedium,
    color: '#6c757d',
  },
});

export default BusinessCalendar;
