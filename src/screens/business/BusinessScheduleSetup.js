import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import FirebaseApi from '../../utils/FirebaseApi';

const BusinessScheduleSetup = ({ navigation, route }) => {
  const { businessData } = route.params;
  const [slotDuration, setSlotDuration] = useState('30');
  const [autoApprove, setAutoApprove] = useState(false);
  const [allowSameDayBooking, setAllowSameDayBooking] = useState(true);
  const [maxFutureBookingDays, setMaxFutureBookingDays] = useState('30');
  const [minTimeBeforeBooking, setMinTimeBeforeBooking] = useState('60');
  const [allowCancellation, setAllowCancellation] = useState(true);
  const [cancellationTimeLimit, setCancellationTimeLimit] = useState('24');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [workingHours, setWorkingHours] = useState({
    sunday: { isOpen: true, open: '09:00', close: '17:00' },
    monday: { isOpen: true, open: '09:00', close: '17:00' },
    tuesday: { isOpen: true, open: '09:00', close: '17:00' },
    wednesday: { isOpen: true, open: '09:00', close: '17:00' },
    thursday: { isOpen: true, open: '09:00', close: '17:00' },
    friday: { isOpen: true, open: '09:00', close: '14:00' },
    saturday: { isOpen: false, open: '00:00', close: '00:00' }
  });

  const daysTranslation = {
    sunday: 'ראשון',
    monday: 'שני',
    tuesday: 'שלישי',
    wednesday: 'רביעי',
    thursday: 'חמישי',
    friday: 'שישי',
    saturday: 'שבת'
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return [`${hour}:00`, `${hour}:30`];
  }).flat();

  const handleTimeSelect = (time) => {
    if (selectedDay && selectedField) {
      handleWorkingHoursChange(selectedDay, selectedField, time);
      setShowTimeModal(false);
      setSelectedDay(null);
      setSelectedField(null);
    }
  };

  const openTimePicker = (day, field) => {
    setSelectedDay(day);
    setSelectedField(field);
    setShowTimeModal(true);
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const slotOptions = [
    { value: '15', label: '15 דקות' },
    { value: '30', label: '30 דקות' },
    { value: '45', label: '45 דקות' },
    { value: '60', label: '60 דקות' },
  ];

  const handleNext = async () => {
    try {
      const currentUser = FirebaseApi.getCurrentUser();
      if (!currentUser) {
        Alert.alert('שגיאה', 'לא נמצא משתמש מחובר');
        return;
      }

      const scheduleSettings = {
        slotDuration,
        autoApprove,
        allowSameDayBooking,
        maxFutureBookingDays: parseInt(maxFutureBookingDays),
        minTimeBeforeBooking: parseInt(minTimeBeforeBooking),
        allowCancellation,
        cancellationTimeLimit: parseInt(cancellationTimeLimit),
        updatedAt: FirebaseApi.getServerTimestamp()
      };

      await FirebaseApi.updateBusinessSchedule(currentUser.uid, scheduleSettings);
      await FirebaseApi.updateBusinessWorkingHours(currentUser.uid, workingHours);

      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'BusinessDashboard',
          params: {
            businessId: currentUser.uid,
            businessData: {
              ...businessData,
              scheduleSettings: scheduleSettings,
              workingHours: workingHours
            }
          }
        }],
      });
    } catch (error) {
      console.error('Error saving schedule settings:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הגדרות הזמנים');
    }
  };

  const renderSectionTitle = (title) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderSlotDurationSelector = () => (
    <View style={styles.section}>
      {renderSectionTitle('⌚️ משך זמן לתור')}
      <Text style={styles.sectionDescription}>
        בחר את משך הזמן הסטנדרטי לכל תור
      </Text>
      <View style={styles.slotOptionsContainer}>
        {slotOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.slotOption,
              slotDuration === option.value && styles.selectedSlotOption
            ]}
            onPress={() => setSlotDuration(option.value)}
          >
            <Text style={[
              styles.slotOptionText,
              slotDuration === option.value && styles.selectedSlotOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSwitchOption = (title, description, value, onValueChange) => (
    <View style={styles.switchOptionContainer}>
      <View style={styles.switchOptionContent}>
        <Text style={styles.switchOptionTitle}>{title}</Text>
        {description && (
          <Text style={styles.switchOptionDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e0e0e0', true: Color.primaryColorAmaranthPurple }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-forward" size={24} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.title}>⏰ הגדרות זמנים</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>כמעט מוכן! 🎉</Text>
          <Text style={styles.subtitle}>
            בוא נגדיר את אופן ניהול הזמנים בעסק שלך 🗓️
          </Text>
        </View>

        {renderSlotDurationSelector()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 הגדרות תורים</Text>
          <Text style={styles.sectionDescription}>
            התאם את אופן ניהול התורים לצרכים שלך
          </Text>
          
          {renderSwitchOption(
            '✅ אישור תורים אוטומטי',
            'תורים יאושרו אוטומטית ללא צורך באישור ידני',
            autoApprove,
            setAutoApprove
          )}

          {renderSwitchOption(
            '📅 הזמנת תורים לאותו היום',
            'אפשר ללקוחות לקבוע תור ליום הנוכחי',
            allowSameDayBooking,
            setAllowSameDayBooking
          )}

          {renderSwitchOption(
            '❌ אפשר ביטול תורים',
            'לקוחות יוכלו לבטל תורים עד זמן מוגדר לפני התור',
            allowCancellation,
            setAllowCancellation
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ הגבלות זמן</Text>
          <Text style={styles.sectionDescription}>
            הגדר את מסגרת הזמנים לקביעת וביטול תורים
          </Text>
          
          {/* Not used for now */}
          {/* <View style={styles.timeSettingContainer}>
            <View style={styles.timeSettingHeader}>
              <Text style={styles.timeSettingLabel}>⚡️ זמן מינימלי לפני התור</Text>
              <Text style={styles.timeSettingUnit}>דקות</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={minTimeBeforeBooking}
              onChangeText={setMinTimeBeforeBooking}
              keyboardType="numeric"
              placeholder="60"
              textAlign="center"
            />
          </View> */}

          {/* <View style={styles.timeSettingContainer}>
            <View style={styles.timeSettingHeader}>
              <Text style={styles.timeSettingLabel}>📆 ימים מקסימלי להזמנה מראש</Text>
              <Text style={styles.timeSettingUnit}>ימים</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={maxFutureBookingDays}
              onChangeText={setMaxFutureBookingDays}
              keyboardType="numeric"
              placeholder="30"
              textAlign="center"
            />
          </View> */}

          {allowCancellation && (
            <View style={styles.timeSettingContainer}>
              <View style={styles.timeSettingHeader}>
                <Text style={styles.timeSettingLabel}>🚫 זמן מינימלי לביטול תור</Text>
                <Text style={styles.timeSettingUnit}>שעות</Text>
              </View>
              <TextInput
                style={styles.timeInput}
                value={cancellationTimeLimit}
                onChangeText={setCancellationTimeLimit}
                keyboardType="numeric"
                placeholder="24"
                textAlign="center"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕒 שעות פעילות</Text>
          <Text style={styles.sectionDescription}>
            הגדר את שעות הפעילות של העסק לכל יום בשבוע
          </Text>

          {Object.entries(workingHours).map(([day, hours]) => (
            <View key={day} style={styles.workingHoursRow}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{daysTranslation[day]}</Text>
                <Switch
                  value={hours.isOpen}
                  onValueChange={(value) => handleWorkingHoursChange(day, 'isOpen', value)}
                  trackColor={{ false: '#e0e0e0', true: Color.primaryColorAmaranthPurple }}
                  thumbColor={hours.isOpen ? '#fff' : '#f4f3f4'}
                />
              </View>

              {hours.isOpen && (
                <View style={styles.hoursContainer}>
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timeLabel}>פתיחה</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => openTimePicker(day, 'open')}
                    >
                      <Text style={styles.timeButtonText}>{hours.open}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.timeSeperator}>עד</Text>

                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timeLabel}>סגירה</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => openTimePicker(day, 'close')}
                    >
                      <Text style={styles.timeButtonText}>{hours.close}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>סיום והמשך לדאשבורד 🚀</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>בחר שעה</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.timeList}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={styles.timeOption}
                  onPress={() => handleTimeSelect(time)}
                >
                  <Text style={styles.timeOptionText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2196F3',
    textAlign: 'center',
    marginRight: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e40af',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2196F3',
    marginBottom: 8,
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'right',
  },
  slotOptionsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  slotOption: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedSlotOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  slotOptionText: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: FontFamily["Assistant-Medium"],
  },
  selectedSlotOptionText: {
    color: '#fff',
    fontFamily: FontFamily["Assistant-Bold"],
  },
  switchOptionContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  switchOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  switchOptionTitle: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#334155',
    textAlign: 'right',
  },
  switchOptionDescription: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
  timeSettingContainer: {
    marginBottom: 20,
  },
  timeSettingHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSettingLabel: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#334155',
    textAlign: 'right',
  },
  timeSettingUnit: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
  },
  timeInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Medium"],
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
  },
  bottomPadding: {
    height: 40,
  },
  workingHoursRow: {
    marginVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontFamily: FontFamily.heeboMedium,
    color: '#333',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timePickerContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  timeButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: FontFamily.heeboRegular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.heeboMedium,
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  timeList: {
    padding: 16,
  },
  timeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: FontFamily.heeboRegular,
  },
});

export default BusinessScheduleSetup;
