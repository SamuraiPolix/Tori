import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, I18nManager } from 'react-native';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { rescheduleAppointment } from '../utils/cloudFunctions';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const RescheduleAppointment = ({ route, navigation }) => {
  const { appointmentId } = route.params;
  const [appointment, setAppointment] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointmentAndSlots = async () => {
      try {
        // Fetch appointment details
        const appointmentDoc = await firestore()
          .collection('appointments')
          .doc(appointmentId)
          .get();

        if (!appointmentDoc.exists) {
          console.error('Appointment not found');
          navigation.goBack();
          return;
        }

        const appointmentData = appointmentDoc.data();
        setAppointment(appointmentData);

        // Fetch business details
        const businessDoc = await firestore()
          .collection('businesses')
          .doc(appointmentData.businessId)
          .get();

        const businessData = businessDoc.data();

        // Fetch available slots for the next 30 days
        const slots = [];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
          const dateStr = date.toISOString().split('T')[0];
          const slotsDoc = await firestore()
            .collection('businesses')
            .doc(appointmentData.businessId)
            .collection('availableSlots')
            .doc(dateStr)
            .get();

          if (slotsDoc.exists) {
            const daySlots = slotsDoc.data().slots || [];
            slots.push(...daySlots.map(slot => ({
              ...slot,
              businessName: businessData.name,
              date: new Date(slot.startTime.toDate())
            })));
          }
        }

        setAvailableSlots(slots.sort((a, b) => a.date - b.date));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentAndSlots();
  }, [appointmentId]);

  const handleReschedule = async () => {
    if (!selectedSlot) return;

    try {
      setLoading(true);
      await rescheduleAppointment(appointmentId, selectedSlot.date);
      navigation.goBack();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (loading) {
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

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>בחר מועד חדש</Text>
        
        {availableSlots.map((slot, index) => {
          const isSelected = selectedSlot && selectedSlot.date.getTime() === slot.date.getTime();
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.slotCard, isSelected && styles.selectedSlot]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.dateText, isSelected && styles.selectedText]}>
                {formatDate(slot.date)}
              </Text>
              <Text style={[styles.timeText, isSelected && styles.selectedText]}>
                {formatTime(slot.date)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedSlot && styles.disabledButton]}
          onPress={handleReschedule}
          disabled={!selectedSlot || loading}
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 16,
  },
  slotCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: Color.grayscaleColorWhite,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Color.grayscaleColorLightGray,
  },
  selectedSlot: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  dateText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  selectedText: {
    color: Color.grayscaleColorWhite,
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
    padding: 16,
  },
});

export default RescheduleAppointment;
