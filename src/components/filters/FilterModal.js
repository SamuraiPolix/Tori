import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Color, FontFamily } from '../../styles/GlobalStyles';
import { CATEGORIES } from '../categories/categoriesData';
import * as Location from 'expo-location';

// קונפיגורציה של RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Default location (Azrieli Mall)
const DEFAULT_LOCATION = {
  latitude: 32.0745963,
  longitude: 34.7918675,
};

// Israel boundaries
const ISRAEL_BOUNDS = {
  north: 33.33,    // Northern boundary
  south: 29.49,    // Southern boundary
  west: 34.23,     // Western boundary
  east: 35.90      // Eastern boundary
};

const isLocationInIsrael = (coords) => {
  return coords.latitude >= ISRAEL_BOUNDS.south &&
         coords.latitude <= ISRAEL_BOUNDS.north &&
         coords.longitude >= ISRAEL_BOUNDS.west &&
         coords.longitude <= ISRAEL_BOUNDS.east;
};

const FilterModal = ({ visible, onClose, filters, setFilters, onApplyFilters }) => {
  const formatDistance = useCallback((value) => {
    return `${value} ק"מ`;
  }, []);

  const formatRating = useCallback((value) => {
    return `${Math.round(value)} כוכבים`;
  }, []);

  const formatPrice = useCallback((value) => {
    return `₪${value}`;
  }, []);

  const handleApplyFilters = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  // Using local state to prevent slider stuttering
  const [localFilters, setLocalFilters] = useState(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // State for category dropdown
  const [showCategories, setShowCategories] = useState(false);

  // Handle numeric input changes
  const handleNumericInput = useCallback((key, value) => {
    const numValue = parseInt(value) || 0;
    let finalValue = numValue;

    // Validation rules
    switch(key) {
      case 'rating':
        finalValue = Math.min(Math.max(Math.round(numValue), 0), 5);
        break;
      case 'maxPrice':
      case 'distance':
        finalValue = Math.max(numValue, 0);
        break;
    }

    setLocalFilters(prev => ({ ...prev, [key]: finalValue }));
    setFilters(prev => ({ ...prev, [key]: finalValue }));
  }, [setFilters]);

  // Update parent state only when slider ends
  const handleSliderComplete = useCallback((key, value) => {
    const finalValue = key === 'rating' ? Math.round(value) : value;
    setFilters(prev => ({ ...prev, [key]: finalValue }));
  }, [setFilters]);

  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUsingDefaultLocation, setIsUsingDefaultLocation] = useState(false);

  // Check location permission and get user location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setIsLoadingLocation(true);
        setLocationError(null);
        setIsUsingDefaultLocation(false);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('נדרשת הרשאת מיקום לסינון לפי מרחק');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        
        // Check if location is in Israel
        if (!isLocationInIsrael(location.coords)) {
          console.log('Location outside Israel, using default Azrieli mall location');
          setUserLocation(DEFAULT_LOCATION);
          setIsUsingDefaultLocation(true);
        } else {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
        // Use default location on error
        setUserLocation(DEFAULT_LOCATION);
        setIsUsingDefaultLocation(true);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    if (visible) {
      getUserLocation();
    }
  }, [visible]);

  // Update parent filters with user location
  useEffect(() => {
    if (userLocation) {
      setFilters(prev => ({
        ...prev,
        userLocation
      }));
    }
  }, [userLocation, setFilters]);

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

          <ScrollView style={styles.filtersContainer}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterTitleContainer}>
                <Text style={styles.filterTitle}>
                  <Ionicons name="sparkles" size={20} color={Color.primaryColorAmaranthPurple} /> קטגוריה
                </Text>
                <Text style={styles.filterValue}>
                  {CATEGORIES.find(cat => cat.id === localFilters.categoryId)?.title || 'הכל'}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.categorySelector,
                  showCategories && styles.categorySelectorActive
                ]}
                onPress={() => setShowCategories(!showCategories)}
              >
                <Text style={styles.categoryText}>
                  {CATEGORIES.find(cat => cat.id === localFilters.categoryId)?.title || 'בחר קטגוריה'}
                </Text>
                <Ionicons 
                  name={showCategories ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={Color.primaryColorAmaranthPurple}
                />
              </Pressable>
              {showCategories && (
                <View style={styles.categoriesList}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        localFilters.categoryId === category.id && styles.selectedCategoryItem
                      ]}
                      onPress={() => {
                        setLocalFilters(prev => ({ ...prev, categoryId: category.id }));
                        setFilters(prev => ({ ...prev, categoryId: category.id }));
                        setShowCategories(false);
                      }}
                    >
                      <Text style={[
                        styles.categoryItemText,
                        localFilters.categoryId === category.id && styles.selectedCategoryItemText
                      ]}>
                        {category.title}
                      </Text>
                      {localFilters.categoryId === category.id && (
                        <Ionicons name="checkmark" size={20} color={Color.primaryColorAmaranthPurple} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterTitleContainer}>
                <Text style={styles.filterTitle}>
                  <Ionicons name="location" size={20} color={Color.primaryColorAmaranthPurple} /> מרחק
                </Text>
                {isLoadingLocation ? (
                  <ActivityIndicator color={Color.primaryColorAmaranthPurple} size="small" />
                ) : locationError ? (
                  <Text style={styles.errorText}>{locationError}</Text>
                ) : !userLocation ? (
                  <Text style={styles.warningText}>ממתין למיקום...</Text>
                ) : (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.numericInput}
                      value={String(localFilters.distance)}
                      onChangeText={(value) => handleNumericInput('distance', value)}
                      keyboardType="numeric"
                      maxLength={3}
                      editable={!!userLocation}
                    />
                    <Text style={styles.unitText}>ק"מ</Text>
                  </View>
                )}
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={50}
                value={localFilters.distance}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, distance: Math.round(value) }))}
                onSlidingComplete={(value) => handleSliderComplete('distance', Math.round(value))}
                minimumTrackTintColor={Color.primaryColorAmaranthPurple}
                maximumTrackTintColor="#D3D3D3"
                thumbTintColor={Color.primaryColorAmaranthPurple}
                enabled={!!userLocation && !locationError}
              />
              {userLocation && (
                <Text style={styles.locationStatus}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={Color.successColor} 
                  /> 
                  {isUsingDefaultLocation 
                    ? 'משתמש במיקום ברירת מחדל (עזריאלי ת"א)'
                    : 'המיקום שלך זמין'}
                </Text>
              )}
            </View>

            {/* Rating Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterTitleContainer}>
                <Text style={styles.filterTitle}>דירוג</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.numericInput}
                    value={String(localFilters.rating)}
                    onChangeText={(value) => handleNumericInput('rating', value)}
                    keyboardType="numeric"
                    maxLength={1}
                  />
                  <Text style={styles.unitText}>כוכבים</Text>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={5}
                step={1}
                value={localFilters.rating}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, rating: Math.round(value) }))}
                onSlidingComplete={(value) => handleSliderComplete('rating', Math.round(value))}
                minimumTrackTintColor={Color.primaryColorAmaranthPurple}
                maximumTrackTintColor="#D3D3D3"
                thumbTintColor={Color.primaryColorAmaranthPurple}
              />
            </View>

            {/* Price Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterTitleContainer}>
                <Text style={styles.filterTitle}>מחיר מקסימלי</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.numericInput}
                    value={String(localFilters.maxPrice)}
                    onChangeText={(value) => handleNumericInput('maxPrice', value)}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <Text style={styles.unitText}>₪</Text>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1000}
                value={localFilters.maxPrice}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, maxPrice: Math.round(value) }))}
                onSlidingComplete={(value) => handleSliderComplete('maxPrice', Math.round(value))}
                minimumTrackTintColor={Color.primaryColorAmaranthPurple}
                maximumTrackTintColor="#D3D3D3"
                thumbTintColor={Color.primaryColorAmaranthPurple}
              />
            </View>

            {/* Day Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterTitleContainer}>
                <Text style={styles.filterTitle}>
                  <Ionicons name="calendar" size={20} color="#666" /> בחר תאריך
                </Text>
                <Text style={styles.filterValue}>
                  {localFilters.selectedDay !== undefined ? nextWeekDays[localFilters.selectedDay].dayName : 'לא נבחר'} 📅
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
                      localFilters.selectedDay === day.id && styles.dayButtonSelected
                    ]}
                    onPress={() => {
                      const newDay = localFilters.selectedDay === day.id ? undefined : day.id;
                      setLocalFilters(prev => ({ ...prev, selectedDay: newDay }));
                      handleSliderComplete('selectedDay', newDay);
                    }}
                  >
                    <Text style={[
                      styles.dayName,
                      localFilters.selectedDay === day.id && styles.dayTextSelected
                    ]}>
                      {day.dayName}
                    </Text>
                    <Text style={[
                      styles.dayDate,
                      localFilters.selectedDay === day.id && styles.dayTextSelected
                    ]}>
                      {day.dayMonth}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Availability Filter */}
            <View style={styles.filterSection}>
              <View style={styles.availabilityFilter}>
                <Text style={styles.filterTitle}>
                  <Ionicons name="time" size={20} color="#666" /> זמינות להיום
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    localFilters.availability && styles.toggleButtonActive
                  ]}
                  onPress={() => {
                    const newAvailability = !localFilters.availability;
                    setLocalFilters(prev => ({ ...prev, availability: newAvailability }));
                    handleSliderComplete('availability', newAvailability);
                  }}
                >
                  <View style={[
                    styles.toggleCircle,
                    localFilters.availability && styles.toggleCircleActive
                  ]} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>החל פילטרים</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#333',
  },
  filterIconContainer: {
    width: 30,
    alignItems: 'flex-end',
  },
  filtersContainer: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 15,
  },
  filterTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterValue: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#666',
  },
  sliderContainer: {
    paddingHorizontal: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  daysScrollView: {
    marginTop: 10,
  },
  daysScrollContent: {
    paddingHorizontal: 5,
  },
  dayButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 80,
  },
  dayButtonSelected: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  dayName: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#333',
    marginBottom: 5,
  },
  dayDate: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#666',
  },
  dayTextSelected: {
    color: 'white',
  },
  availabilityFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    width: 50,
    height: 30,
    backgroundColor: '#DDD',
    borderRadius: 15,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    justifyContent: 'flex-end',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    backgroundColor: 'white',
    borderRadius: 13,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FontFamily.regular,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(158, 42, 155, 0.2)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categorySelectorActive: {
    borderColor: Color.primaryColorAmaranthPurple,
    backgroundColor: 'rgba(158, 42, 155, 0.05)',
  },
  categoryText: {
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
  categoriesList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(158, 42, 155, 0.2)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    maxHeight: 200,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(158, 42, 155, 0.1)',
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(158, 42, 155, 0.05)',
  },
  categoryItemText: {
    color: '#666',
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
  selectedCategoryItemText: {
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  numericInput: {
    width: 50,
    height: 30,
    borderWidth: 1,
    borderColor: Color.primaryColorAmaranthPurple,
    borderRadius: 5,
    paddingHorizontal: 5,
    marginRight: 5,
    textAlign: 'center',
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.regular,
  },
  unitText: {
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
  errorText: {
    color: Color.errorColor,
    fontSize: 12,
    fontFamily: FontFamily.primaryFontRegular,
    marginRight: 8,
  },
  warningText: {
    color: Color.warningColor,
    fontSize: 12,
    fontFamily: FontFamily.primaryFontRegular,
    marginRight: 8,
  },
  locationStatus: {
    fontSize: 12,
    color: Color.successColor,
    fontFamily: FontFamily.primaryFontRegular,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
});

export default FilterModal;
