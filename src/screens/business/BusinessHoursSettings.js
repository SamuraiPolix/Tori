import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Pressable,
  Modal,
  Switch 
} from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const DAYS = {
  sunday: 'ראשון',
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
  saturday: 'שבת'
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export default function BusinessHoursSettings({ workHours, onHoursChange }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerType, setTimePickerType] = useState(null);

  const handleDayToggle = (day, isOpen) => {
    onHoursChange({
      ...workHours,
      [day]: {
        ...workHours[day],
        isOpen,
        open: isOpen ? (workHours[day]?.open || "09:00") : null,
        close: isOpen ? (workHours[day]?.close || "17:00") : null
      }
    });
  };

  const handleHourChange = (value) => {
    if (!selectedDay || !timePickerType) return;
    onHoursChange({
      ...workHours,
      [selectedDay]: {
        ...workHours[selectedDay],
        [timePickerType]: value
      }
    });
    setShowTimePicker(false);
  };

  const openTimePicker = (type) => {
    setTimePickerType(type);
    setShowTimePicker(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Icon name="clock-outline" size={28} color="#2563eb" style={styles.headerIcon} />
        <Text style={styles.headerTitle}>שעות פעילות העסק</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        הגדר את זמני הפעילות של העסק שלך לכל יום בשבוע 🗓️
      </Text>

      <View style={styles.daysContainer}>
        {Object.entries(DAYS).map(([day, label]) => (
          <Pressable
            key={day}
            style={[
              styles.dayCard,
              workHours[day]?.isOpen && styles.activeDayCard
            ]}
            onPress={() => setSelectedDay(day)}
          >
            <View style={styles.dayHeader}>
              <View style={styles.dayTitleContainer}>
                <Icon 
                  name="calendar" 
                  size={20} 
                  color={workHours[day]?.isOpen ? "#2563eb" : "#64748b"} 
                />
                <Text style={[
                  styles.dayTitle,
                  workHours[day]?.isOpen && styles.activeDayTitle
                ]}>
                  יום {label}
                </Text>
              </View>
              <Switch
                value={workHours[day]?.isOpen ?? false}
                onValueChange={(checked) => handleDayToggle(day, checked)}
                trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
                thumbColor={workHours[day]?.isOpen ? '#2563eb' : '#94a3b8'}
              />
            </View>

            {workHours[day]?.isOpen && (
              <View style={styles.timeContainer}>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => {
                    setSelectedDay(day);
                    openTimePicker('open');
                  }}
                >
                  <Text style={styles.timeLabel}>⏰ שעת פתיחה</Text>
                  <Text style={styles.timeValue}>{workHours[day]?.open || "09:00"}</Text>
                </Pressable>

                <Pressable
                  style={styles.timeButton}
                  onPress={() => {
                    setSelectedDay(day);
                    openTimePicker('close');
                  }}
                >
                  <Text style={styles.timeLabel}>🌙 שעת סגירה</Text>
                  <Text style={styles.timeValue}>{workHours[day]?.close || "17:00"}</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 טיפ שימושי</Text>
        <Text style={styles.tipText}>
          הגדרת שעות פעילות מדויקות תעזור ללקוחות שלך לדעת מתי העסק פתוח ומתי ניתן לקבוע תורים
        </Text>
      </View>

      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowTimePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {timePickerType === 'open' ? '⏰ בחר שעת פתיחה' : '🌙 בחר שעת סגירה'}
              </Text>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            <ScrollView style={styles.timeList}>
              {HOURS.map(({ value, label }) => (
                <Pressable
                  key={value}
                  style={[
                    styles.timeOption,
                    workHours[selectedDay]?.[timePickerType] === value && styles.selectedTimeOption
                  ]}
                  onPress={() => handleHourChange(value)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    workHours[selectedDay]?.[timePickerType] === value && styles.selectedTimeOptionText
                  ]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
    marginBottom: 24,
  },
  daysContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeDayCard: {
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#1e293b',
  },
  activeDayTitle: {
    color: '#2563eb',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#1e293b',
  },
  tipCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#0369a1',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#0c4a6e',
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e293b',
  },
  timeList: {
    padding: 8,
  },
  timeOption: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  selectedTimeOption: {
    backgroundColor: '#eff6ff',
  },
  timeOptionText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedTimeOptionText: {
    color: '#2563eb',
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleButtonText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#64748b',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
});
