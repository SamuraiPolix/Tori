import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, I18nManager, Alert } from 'react-native';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import FirebaseApi from '../utils/FirebaseApi';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const RescheduleAppointment = ({ route, navigation }) => {
  const { appointmentId } = route.params;
  const [appointment, setAppointment] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const scrollViewRef = React.useRef(null);

  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        // Fetch appointment details
        const appointmentData = await FirebaseApi.getAppointmentById(appointmentId);
        if (!appointmentData) {
          console.error('Appointment not found');
          navigation.goBack();
          return;
        }

        setAppointment(appointmentData);

        // Fetch business details
        const business = await FirebaseApi.getBusinessData(appointmentData.businessId);
        setBusinessData(business);

        // Set the current service
        const currentService = {
          id: appointmentData.serviceId,
          name: appointmentData.serviceName,
          price: appointmentData.servicePrice,
          duration: appointmentData.serviceDuration
        };
        setSelectedService(currentService);

      } catch (error) {
        console.error('Error fetching appointment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentData();
  }, [appointmentId]);

  const findAvailableAppointments = async (businessId, selectedDate, serviceOverride = null) => {
    try {
      const serviceToUse = serviceOverride || selectedService;
      
      if (!serviceToUse) {
        return { available: [], booked: [], error: 'Please select a service first' };
      }

      const serviceDuration = serviceToUse.duration || 30;
      console.log(`Finding slots for business ${businessId}, service duration: ${serviceDuration}min`);

      // Query all appointments for the business on the selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // If it's today, use current time as start time
      const now = new Date();
      const isToday = startOfDay.toDateString() === now.toDateString();
      const queryStartTime = isToday ? now : startOfDay;

      const bookedSlots = await FirebaseApi.getBusinessAppointments(businessId, queryStartTime, endOfDay);

      // Get business working hours for the day
      const dayOfWeek = startOfDay.getDay();
      const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const workingHours = businessData.workingHours[daysMap[dayOfWeek]];

      if (!workingHours.isOpen) {
        return { available: [], booked: bookedSlots, error: 'Business is closed on this day' };
      }

      // Generate all possible slots based on working hours
      const slots = [];
      const slotDuration = businessData.scheduleSettings?.slotDuration || 30; // Default 30 minutes
      
      const [openHour, openMinute] = workingHours.open.split(':');
      const [closeHour, closeMinute] = workingHours.close.split(':');
      
      // Set initial slot time based on whether it's today or not
      let currentSlot;
      if (isToday) {
        currentSlot = new Date(now);
        // Round up to the next slot
        const minutes = currentSlot.getMinutes();
        const roundedMinutes = Math.ceil(minutes / slotDuration) * slotDuration;
        currentSlot.setMinutes(roundedMinutes, 0, 0);
      } else {
        currentSlot = new Date(startOfDay);
        currentSlot.setHours(parseInt(openHour), parseInt(openMinute), 0, 0);
      }
      
      const closeTime = new Date(startOfDay);
      closeTime.setHours(parseInt(closeHour), parseInt(closeMinute), 0, 0);

      // If today and current time is past closing time, return no slots
      if (isToday && currentSlot >= closeTime) {
        return { available: [], booked: bookedSlots, error: 'No more available slots today' };
      }

      while (currentSlot < closeTime) {
        const slotTime = FirebaseApi.getTimestampFromDate(currentSlot);
        
        // Check if this slot conflicts with any booked appointment
        const isSlotAvailable = !bookedSlots.some(booking => {
          // Skip the current appointment being rescheduled
          if (booking.id === appointmentId) return false;

          // Convert booking time to minutes since start of day
          const bookingDate = booking.startTime.toDate();
          const bookingMinutes = bookingDate.getHours() * 60 + bookingDate.getMinutes();
          
          // Convert current slot to minutes since start of day
          const slotMinutes = currentSlot.getHours() * 60 + currentSlot.getMinutes();
          
          // Check if there's any overlap between the service duration and the booked slot
          const serviceEndMinutes = slotMinutes + serviceDuration;
          const bookingEndMinutes = bookingMinutes + (booking.serviceDuration || 30);
          
          return (
            (slotMinutes >= bookingMinutes && slotMinutes < bookingEndMinutes) || // Start of service overlaps with booking
            (serviceEndMinutes > bookingMinutes && serviceEndMinutes <= bookingEndMinutes) || // End of service overlaps with booking
            (slotMinutes <= bookingMinutes && serviceEndMinutes >= bookingEndMinutes) // Service completely encompasses booking
          );
        });

        // Also check if the service can be completed before closing time
        const serviceEndTime = new Date(currentSlot.getTime() + serviceDuration * 60000);
        const canCompleteService = serviceEndTime <= closeTime;

        if (isSlotAvailable && canCompleteService) {
          const slotDate = currentSlot;
          // Add offset to compensate for timezone
          const hours = slotDate.getHours().toString().padStart(2, '0');
          const minutes = slotDate.getMinutes().toString().padStart(2, '0');
          slots.push({
            time: slotTime,
            formattedTime: `${hours}:${minutes}`,
            available: true,
            duration: serviceDuration,
            serviceName: serviceToUse.name,
            servicePrice: serviceToUse.price,
            serviceDuration: serviceDuration
          });
        }

        currentSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
      }

      return { available: slots, booked: bookedSlots, error: null };
    } catch (error) {
      console.error('Error finding available appointments:', error);
      return { available: [], booked: [], error: error.message };
    }
  };

  const handleDateSelect = async (date) => {
    try {
      setSelectedDate(date);
      setSelectedTime(null);
      setLoading(true);
      setAvailableSlots([]); // Reset slots while loading
      
      const result = await findAvailableAppointments(businessData.id, date);
      if (result.error) {
        Alert.alert('שגיאה', result.error);
        return;
      }
      
      setAvailableSlots(result.available || []); // Ensure we always set an array
    } catch (error) {
      console.error('Error in handleDateSelect:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת המועדים הזמינים');
      setAvailableSlots([]); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (slot) => {
    setSelectedTime(slot);
  };

  const handleReschedule = async () => {
    if (!selectedTime) {
      Alert.alert('שגיאה', 'נא לבחור מועד חדש');
      return;
    }

    try {
      setLoading(true);
      await FirebaseApi.rescheduleAppointment(appointmentId, selectedTime.time.toDate());
      await FirebaseApi.updateAppointmentStatus(appointmentId, 'pending');
      Alert.alert('הצלחה', 'התור עודכן בהצלחה');
      navigation.navigate('MyAppointments', { refresh: true });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון התור');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !appointment || !businessData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>טוען...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Color.grayscaleColorBlack} />
        </TouchableOpacity>
        <Text style={styles.title}>שינוי תור</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content}>
        {/* Current Appointment Info */}
        <View style={styles.currentAppointmentCard}>
          <Text style={styles.sectionTitle}>פרטי התור הנוכחי</Text>
          <Text style={styles.serviceText}>{appointment.serviceName}</Text>
          <Text style={styles.dateText}>
            {appointment.startTime.toDate().toLocaleDateString('he-IL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
          <Text style={styles.timeText}>
            {appointment.startTime.toDate().toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </Text>
        </View>

        {/* Date Selection */}
        <Text style={styles.sectionTitle}>בחר תאריך חדש</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
          {[...Array(30)].map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() + index);
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCard, isSelected && styles.selectedDate]}
                onPress={() => handleDateSelect(date)}
              >
                <Text style={[styles.dateText, isSelected && styles.selectedText]}>
                  {date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Selection */}
        {selectedDate && (
          <>
            <Text style={styles.sectionTitle}>בחר שעה חדשה</Text>
            <View style={styles.timeGrid}>
              {availableSlots.map((slot, index) => {
                const isSelected = selectedTime && selectedTime.time.toDate().getTime() === slot.time.toDate().getTime();
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.timeCard, isSelected && styles.selectedTime]}
                    onPress={() => handleTimeSelect(slot)}
                  >
                    <Text style={[styles.timeText, isSelected && styles.selectedText]}>
                      {slot.formattedTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedTime && styles.disabledButton]}
          onPress={handleReschedule}
          disabled={!selectedTime || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'מעדכן...' : 'עדכן תור'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Color.grayscaleColorLightGray,
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentAppointmentCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: Color.grayscaleColorLightGray,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 16,
  },
  dateList: {
    marginBottom: 24,
  },
  dateCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: Color.grayscaleColorWhite,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Color.grayscaleColorLightGray,
    minWidth: 120,
  },
  selectedDate: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeCard: {
    width: '31%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Color.grayscaleColorWhite,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Color.grayscaleColorLightGray,
    alignItems: 'center',
  },
  selectedTime: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  dateText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    textAlign: 'center',
  },
  timeText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    textAlign: 'center',
  },
  selectedText: {
    color: Color.grayscaleColorWhite,
  },
  serviceText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Color.grayscaleColorLightGray,
  },
  button: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Color.grayscaleColorLightGray,
  },
  buttonText: {
    color: Color.grayscaleColorWhite,
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default RescheduleAppointment;
