import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Color, FontFamily } from '../../styles/GlobalStyles';

// קונפיגורציה של RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const FilterModal = ({ visible, onClose, filters, setFilters }) => {
  const formatDistance = useCallback((value) => {
    return `${value} ק"מ`;
  }, []);

  const formatRating = useCallback((value) => {
    return `${value.toFixed(1)} כוכבים`;
  }, []);

  const formatPrice = useCallback((value) => {
    return `₪${value}`;
  }, []);

  // יצירת מערך של 7 ימים קדימה
  const nextWeekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date,
        dayName: dayNames[date.getDay()],
        dayMonth: `${date.getDate()}/${date.getMonth() + 1}`,
        id: i
      });
    }
    return days;
  }, []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Ionicons name="close-circle" size={24} color={Color.primaryColorAmaranthPurple} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.modalTitle}>פילטרים</Text>
            </View>
            <View style={styles.filterIconContainer}>
              <Ionicons name="options" size={24} color={Color.primaryColorAmaranthPurple} />
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterTitleContainer}>
              <Text style={styles.filterTitle}>
                <Ionicons name="location" size={20} color="#666" /> מרחק
              </Text>
              <Text style={styles.filterValue}>
                {formatDistance(filters.distance)} 🚗
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={120}
                step={1}
                value={filters.distance}
                onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, distance: value }))
                }
                minimumTrackTintColor={Color.primaryColorAmaranthPurple}
                maximumTrackTintColor="#DDD"
                thumbTintColor={Color.primaryColorAmaranthPurple}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterTitleContainer}>
              <Text style={styles.filterTitle}>
                <Ionicons name="star" size={20} color="#FFD700" /> דירוג
              </Text>
              <Text style={styles.filterValue}>
                {formatRating(filters.rating)} ⭐
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={5}
                step={0.5}
                value={filters.rating}
                onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, rating: value }))
                }
                minimumTrackTintColor={Color.primaryColorAmaranthPurple}
                maximumTrackTintColor="#DDD"
                thumbTintColor={Color.primaryColorAmaranthPurple}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterTitleContainer}>
              <Text style={styles.filterTitle}>
                <Ionicons name="cash" size={20} color="#2E8B57" /> מחיר
              </Text>
              <Text style={styles.filterValue}>
                {formatPrice(filters.price)} 💰
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={1000}
                step={10}
                value={filters.price}
                onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, price: value }))
                }
                minimumTrackTintColor={Color.primaryColorAmaranthPurple}
                maximumTrackTintColor="#DDD"
                thumbTintColor={Color.primaryColorAmaranthPurple}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterTitleContainer}>
              <Text style={styles.filterTitle}>
                <Ionicons name="calendar" size={20} color="#666" /> בחר תאריך
              </Text>
              <Text style={styles.filterValue}>
                {filters.selectedDay !== undefined ? nextWeekDays[filters.selectedDay].dayName : 'לא נבחר'} 📅
              </Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.daysScrollView}
              contentContainerStyle={styles.daysScrollContent}
            >
              {nextWeekDays.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButton,
                    filters.selectedDay === day.id && styles.dayButtonSelected
                  ]}
                  onPress={() => setFilters(prev => ({
                    ...prev,
                    selectedDay: prev.selectedDay === day.id ? undefined : day.id
                  }))}
                >
                  <Text style={[
                    styles.dayName,
                    filters.selectedDay === day.id && styles.dayTextSelected
                  ]}>
                    {day.dayName}
                  </Text>
                  <Text style={[
                    styles.dayDate,
                    filters.selectedDay === day.id && styles.dayTextSelected
                  ]}>
                    {day.dayMonth}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.availabilityFilter}>
              <Text style={styles.filterTitle}>זמינות להיום</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  filters.availability && styles.toggleButtonActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, availability: !prev.availability }))}
              >
                <View style={[
                  styles.toggleCircle,
                  filters.availability && styles.toggleCircleActive
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>החל פילטרים</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: FontFamily.assistantBold,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'center',
  },
  closeButton: {
    width: 24,
    height: 24,
  },
  filterIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    marginBottom: 25,
  },
  filterTitleContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
  },
  filterValue: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.primaryColorAmaranthPurple,
  },
  sliderContainer: {
    transform: [{ scaleX: -1 }],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  availabilityFilter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DDD',
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    transform: [{ translateX: 20 }],
  },
  toggleCircleActive: {
    transform: [{ translateX: 0 }],
  },
  applyButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
  },
  daysScrollView: {
    marginTop: 10,
  },
  daysScrollContent: {
    paddingHorizontal: 5,
  },
  dayButton: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayButtonSelected: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  dayName: {
    fontSize: 16,
    fontFamily: FontFamily.assistantSemiBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorGray,
  },
  dayTextSelected: {
    color: Color.grayscaleColorWhite,
  },
});

export default FilterModal;
