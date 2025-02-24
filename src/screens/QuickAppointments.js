import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  ScrollView
} from 'react-native';
import { Image } from 'expo-image';
import { Color, FontFamily } from '../styles/GlobalStyles';
import FirebaseApi from '../utils/FirebaseApi';
import FilterModal from '../components/filters/FilterModal';
import * as Location from 'expo-location';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { Slider } from 'react-native';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const QuickAppointments = ({ navigation }) => {
  const getCurrentTimePercentage = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    return ((currentHour * 60 + currentMinute) / (24 * 60)) * 100;
  };

  const [allAppointments, setAllAppointments] = useState([]);
  const [sortedAppointments, setSortedAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('time');
  const [timeRange, setTimeRange] = useState([getCurrentTimePercentage(), getCurrentTimePercentage() + 5]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    distance: 5,
    rating: 0,
    priceRange: [0, 1000],
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await FirebaseApi.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log('Sort type changed to:', sortBy);
    if (allAppointments.length > 0) {
      const sorted = sortAppointments(allAppointments, sortBy);
      setSortedAppointments(sorted);
    }
  }, [sortBy, allAppointments]);

  const fetchBusinessesByCategory = async () => {
    try {
      setLoading(true);
      console.log('Fetching businesses for category:', selectedCategory);
      const businessesData = await FirebaseApi.getBusinessesByCategory(selectedCategory.id);
      console.log('Found businesses:', businessesData.length, businessesData);
      setBusinesses(businessesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchBusinessesByCategory();
    }
  }, [selectedCategory]);

  const findAvailableAppointments = async (businessId, date, appointments) => {
    try {
      console.log(`Finding available appointments for business ${businessId} on date ${date}`);
      
      if (!appointments) {
        console.log('No appointments provided');
        return { available: [] };
      }
      
      // Get all services for this business
      const business = businesses.find(b => b.id === businessId);
      if (!business) {
        console.log('Business not found:', businessId);
        return { available: [] };
      }

      if (!business.services || !Array.isArray(business.services) || business.services.length === 0) {
        console.log('No services found for business:', businessId);
        return { available: [] };
      }

      const selectedDateObj = new Date(date);
      
      // Get business hours for the selected day
      const dayOfWeek = selectedDateObj.getDay();
      const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const workingHours = business.workingHours?.[daysMap[dayOfWeek]];

      if (!workingHours?.isOpen) {
        console.log('Business is closed on this day');
        return { available: [] };
      }

      // Parse business hours
      const [openHour, openMinute] = (workingHours.open || '07:00').split(':').map(Number);
      const [closeHour, closeMinute] = (workingHours.close || '21:00').split(':').map(Number);

      // Set business opening time
      const businessOpen = new Date(selectedDateObj);
      businessOpen.setHours(openHour, openMinute, 0, 0);

      // Set business closing time
      const businessClose = new Date(selectedDateObj);
      businessClose.setHours(closeHour, closeMinute, 0, 0);

      // Get current time if it's today
      const now = new Date();
      const isToday = selectedDateObj.toDateString() === now.toDateString();
      
      // Set start time to the later of business opening or current time (if today)
      const startTime = new Date(
        isToday ? 
          Math.max(businessOpen.getTime(), now.getTime()) : 
          businessOpen.getTime()
      );

      // Set end time to business closing time
      const endTime = businessClose;

      console.log('Business hours:', `${businessOpen.toLocaleTimeString()} - ${businessClose.toLocaleTimeString()}`);
      console.log('Actual search range:', `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);

      // Convert booked appointments to time ranges
      const bookedRanges = appointments.map(booking => {
        const bookingTime = booking.startTime.toDate();
        const bookingEndTime = new Date(bookingTime.getTime() + (booking.serviceDuration || 30) * 60000);
        return {
          start: bookingTime,
          end: bookingEndTime,
          service: booking.serviceName
        };
      });

      console.log('Booked ranges:', bookedRanges.map(range => 
        `${range.start.toLocaleTimeString()}-${range.end.toLocaleTimeString()} (${range.service})`
      ));

      // Generate all possible slots
      const slots = [];
      const slotDuration = 30; // Default slot duration in minutes
      let currentTime = new Date(startTime);

      while (currentTime < endTime) {
        business.services.forEach(service => {
          const serviceDuration = service.duration || 30;
          const serviceEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);
          
          // Skip if service would end after business hours
          if (serviceEndTime > endTime) {
            return;
          }

          // Check if this slot conflicts with any booked appointments
          const hasConflict = bookedRanges.some(range => {
            const slotOverlaps = (
              (currentTime >= range.start && currentTime < range.end) || // Start overlaps
              (serviceEndTime > range.start && serviceEndTime <= range.end) || // End overlaps
              (currentTime <= range.start && serviceEndTime >= range.end) // Encompasses
            );
            
            if (slotOverlaps) {
              console.log(`Slot ${currentTime.toLocaleTimeString()} conflicts with booking at ${range.start.toLocaleTimeString()} for ${range.service}`);
            }
            
            return slotOverlaps;
          });

          if (!hasConflict) {
            // Convert time to minutes since midnight
            const minutesSinceMidnight = currentTime.getHours() * 60 + currentTime.getMinutes();
            console.log(`Adding slot at ${currentTime.toLocaleTimeString()} for ${service.name}`);
            slots.push({
              startTimeMinutes: minutesSinceMidnight,
              serviceName: service.name,
              servicePrice: service.price,
              serviceDuration: serviceDuration,
              businessId: businessId
            });
          }
        });

        // Move to next slot
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
      }

      console.log(`Found ${slots.length} available slots for business ${businessId}`);
      return { available: slots };
    } catch (error) {
      console.error('Error in findAvailableAppointments:', error);
      return { available: [] };
    }
  };

  const fetchAppointmentsForSelectedDate = async () => {
    try {
      setLoading(true);
      
      // Get device location
      let userLocation = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          userLocation = location.coords;
          console.log('Got user location:', userLocation);
        } else {
          console.log('Location permission not granted');
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }

      if (!businesses || businesses.length === 0) {
        console.log('No businesses available');
        setAllAppointments([]);
        setSortedAppointments([]);
        setLoading(false);
        return;
      }

      console.log('Fetching appointments for businesses:', businesses.length);
      
      const appointmentsPromises = businesses.map(business => 
        FirebaseApi.getAppointmentsForDate(business.id, selectedDate)
      );
      const allAppointments = await Promise.all(appointmentsPromises);
      console.log('Raw appointments for all businesses:', allAppointments);

      // Create a Set to track unique appointment IDs
      const seenAppointments = new Set();
      const availableAppointments = [];

      for (let index = 0; index < businesses.length; index++) {
        const business = businesses[index];
        const appointments = allAppointments[index];
        
        console.log(`Processing appointments for business: ${business.name}`);
        
        const result = await findAvailableAppointments(business.id, selectedDate, appointments);
        const available = result?.available || [];
        console.log(`Found ${available.length} available appointments for ${business.name}`);

        // Calculate distance if we have both user location and business location
        let distance = null;
        if (userLocation && business.location?.latitude && business.location?.longitude) {
          distance = FirebaseApi.calculateDistance(
            business.location.latitude,
            business.location.longitude,
            userLocation.latitude,
            userLocation.longitude
          );
          console.log(`Distance to ${business.name}: ${distance.toFixed(1)} ק"מ`);
        } else {
          console.log(`Could not calculate distance for ${business.name}:`, 
            !userLocation ? 'No user location' : 'No business location');
        }

        // Process each available slot
        available.forEach(slot => {
          const appointmentKey = `${business.id}-${slot.startTimeMinutes}-${slot.serviceName}`;
          if (!seenAppointments.has(appointmentKey)) {
            seenAppointments.add(appointmentKey);
            availableAppointments.push({
              ...slot,
              businessName: business.name,
              businessId: business.id,
              rating: business.rating,
              distance: distance,
              businessImage: business.images?.[0]
            });
          } else {
            console.log('Duplicate appointment found:', appointmentKey);
          }
        });
      }

      console.log('Final available appointments:', availableAppointments.length , availableAppointments);
      setAllAppointments(availableAppointments);
      handleSortChange(sortBy);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments for selected date:', error);
      setAllAppointments([]);
      setSortedAppointments([]);
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category) => {
    console.log('Category selected:', category);
    setSelectedCategory(category);
    setStep(1); // Move to time selection after category is selected
  };

  const handleTimeRangeSelect = () => {
    const selectedDateObj = new Date(selectedDate);
    
    const startMinutes = timeRange[0] * 24 * 60 / 100;
    const endMinutes = timeRange[1] * 24 * 60 / 100;
    
    const startTime = new Date(selectedDateObj);
    startTime.setHours(Math.floor(startMinutes / 60), Math.floor(startMinutes % 60));
    
    const endTime = new Date(selectedDateObj);
    endTime.setHours(Math.floor(endMinutes / 60), Math.floor(endMinutes % 60));

    // Now fetch appointments with the selected time range
    setLoading(true);
    fetchAppointmentsForSelectedDate()
      .then(() => {
        setLoading(false);
        setStep(2); // Move to results after fetching
      })
      .catch((error) => {
        console.error('Error fetching appointments:', error);
        setLoading(false);
        setStep(2);
      });
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const formatDayName = (day) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[day];
  };

  useEffect(() => {
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    if (!isToday) {
      setTimeRange([29.17, 87.5]);
    } else {
      const currentPercentage = getCurrentTimePercentage();
      setTimeRange([currentPercentage, currentPercentage + 5]);
    }
  }, [selectedDate]);

  const sortAppointments = (appointments, sortType) => {
    if (!appointments || appointments.length === 0) return [];
    
    console.log('Sorting appointments by:', sortType);
    console.log('Before sort:', appointments.map(a => ({
      time: a.startTimeMinutes,
      distance: a.distance
    })));

    const sorted = appointments.sort((a, b) => {
      if (sortType === 'time') {
        const timeA = a.startTimeMinutes || 0;
        const timeB = b.startTimeMinutes || 0;
        return timeA - timeB;
      } else if (sortType === 'distance') {
        const distanceA = a.distance || Number.MAX_VALUE;
        const distanceB = b.distance || Number.MAX_VALUE;
        return distanceA - distanceB || ((a.startTimeMinutes || 0) - (b.startTimeMinutes || 0));
      }
      return 0;
    }).slice(0, 15);  // Limit to top 15 appointments

    console.log('After sort:', sorted.map(a => ({
      time: a.startTimeMinutes,
      distance: a.distance
    })));

    return sorted;
  };

  const handleSortChange = (sortType) => {
    console.log('Sorting appointments by:', sortType);
    const sorted = sortAppointments(allAppointments, sortType);
    setSortedAppointments(sorted);
  };

  const formatTime = (percentage) => {
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    
    if (isToday && percentage === timeRange[0]) {
      const now = new Date();
      return now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    }

    const selectedDateObj = new Date(selectedDate);
    const minutes = percentage * 24 * 60 / 100;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    selectedDateObj.setHours(hours, mins);
    return selectedDateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const handleTimeRangeChange = (values) => {
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    if (isToday) {
      const currentPercentage = getCurrentTimePercentage();
      const newStart = Math.max(values[0], currentPercentage);
      const newEnd = Math.max(values[1], newStart + 5);
      setTimeRange([newStart, newEnd]);
    } else {
      setTimeRange(values);
    }
  };

  const renderAppointmentCard = ({ item }) => {
    console.log('Rendering appointment:', item);
    if (!item || !item.startTimeMinutes) {
      console.log('Invalid appointment data:', item);
      return null;
    }

    const appointmentTime = new Date();
    if (!item.startTimeMinutes) {
      console.log('Invalid appointment time minutes:', item.startTimeMinutes);
      return null;
    }

    // Convert minutes to hours and minutes
    const hours = Math.floor(item.startTimeMinutes / 60);
    const minutes = item.startTimeMinutes % 60;
    appointmentTime.setHours(hours, minutes, 0, 0);

    const formattedDate = appointmentTime.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    
    const formattedTime = `${appointmentTime.getHours().toString().padStart(2, '0')}:${appointmentTime.getMinutes().toString().padStart(2, '0')}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.businessInfo}>
            <Image
              source={{ uri: item.businessImage }}
              style={styles.businessImage}
            />
            <View style={styles.businessDetails}>
              <Text style={styles.businessName}>{item.businessName}</Text>
              <View style={styles.ratingContainer}>
                <Icon name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{item.rating || 4.5}</Text>
                <View style={styles.separator} />
                <Icon name="map" size={16} color={Color.primaryColorAmaranthPurple} />
                <Text style={styles.distance}>{item.distance ? `${item.distance.toFixed(1)} ק"מ` : 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.serviceName || 'תספורת'}</Text>
            <Text style={styles.servicePrice}>₪{item.servicePrice || '50'}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleQuickBook(item)}
          >
            <Text style={styles.bookButtonText}>הזמן תור</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderResultsScreen = () => {
    const hasSelectedAppointment = selectedService !== null;

    return (
      <View style={styles.container}>
        {renderProgressHeader()}
        <View style={styles.resultsContainer}>
          {renderSortButtons()}
          {loading ? (
            <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
          ) : sortedAppointments.length > 0 ? (
            <FlatList
              data={sortedAppointments}
              renderItem={renderAppointmentCard}
              keyExtractor={(item, index) => `appointment-${item.businessId}-${index}`}
              contentContainerStyle={styles.appointmentsList}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>אין תורים זמינים לטווח זמן שנבחר</Text>
              <TouchableOpacity 
                style={styles.tryAgainButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.tryAgainButtonText}>בחר טווח זמן אחר</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity 
            style={[
              styles.quickBookButton,
              !hasSelectedAppointment && styles.quickBookButtonDisabled
            ]}
            onPress={handleQuickBook}
            disabled={!hasSelectedAppointment}
          >
            <Text style={[
              styles.quickBookText,
              !hasSelectedAppointment && styles.quickBookTextDisabled
            ]}>
              קבע תור מהיר
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSortButtons = () => (
    <View style={styles.sortButtonsContainer}>
      <TouchableOpacity 
        style={[styles.sortButton, sortBy === 'time' && styles.sortButtonSelected]}
        onPress={() => setSortBy('time')}
      >
        <Text style={[styles.sortButtonText, sortBy === 'time' && styles.sortButtonTextSelected]}>
          לפי זמן
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonSelected]}
        onPress={() => setSortBy('distance')}
      >
        <Text style={[styles.sortButtonText, sortBy === 'distance' && styles.sortButtonTextSelected]}>
          לפי מרחק
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgressHeader = () => {
    return (
      <View style={styles.progressHeaderContainer}>
        <Text style={styles.findingAppointmentText}>כבר מוצאים לך תור :)</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${(step + 1) * 33.33}%` }]} />
            </View>
            <Text style={styles.stepCounter}>שלב {step + 1}/3</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategorySelection = () => (
    <View style={styles.container}>
      {renderProgressHeader()}
      <Text style={styles.title}>בחר קטגוריה</Text>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.categoryList}>
        {categories.map((category) => (
          <TouchableOpacity 
            key={category.id} 
            onPress={() => handleCategorySelect(category)} 
            style={styles.categoryButton}
          >
            <Text style={styles.category}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          onPress={() => handleCategorySelect(selectedCategory)} 
          style={styles.continueButtonContainer}
        >
          <Text style={styles.continueButton}>המשך</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTimeRangeSelection = () => (
    <View style={styles.container}>
      {renderProgressHeader()}
      <Text style={styles.title}>בחר טווח זמן</Text>
      
      <View style={styles.dateSection}>
        <Text style={styles.sectionTitle}>בחר תאריך:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesContainer}
        >
          {generateDates().map((date) => {
            const isSelected = selectedDate === date;
            const dayName = formatDayName(new Date(date).getDay());
            const dayNumber = new Date(date).getDate();
            
            return (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateButton,
                  isSelected && styles.selectedDateButton
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayName,
                  isSelected && styles.selectedDateText
                ]}>
                  {dayName}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.selectedDateText
                ]}>
                  {dayNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.timeRangeContainer}>
        <Text style={styles.sectionTitle}>בחר טווח שעות:</Text>
        <View style={styles.sliderContent}>
          <MultiSlider
            values={timeRange}
            onValuesChange={handleTimeRangeChange}
            min={selectedDate === new Date().toISOString().split('T')[0] ? getCurrentTimePercentage() : 0}
            max={100}
            step={1}
            sliderLength={300}
            selectedStyle={{
              backgroundColor: Color.primaryColorAmaranthPurple,
              height: 3,
            }}
            unselectedStyle={{
              backgroundColor: Color.grayscaleColorLightGray,
              height: 3,
            }}
            containerStyle={{
              height: 40,
            }}
            trackStyle={{
              height: 3,
            }}
            markerStyle={{
              height: 20,
              width: 20,
              borderRadius: 10,
              backgroundColor: Color.primaryColorAmaranthPurple,
              borderWidth: 2,
              borderColor: '#fff',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            enabledOne={true}
            enabledTwo={true}
          />
          <View style={styles.timeLabelsContainer}>
            <Text style={styles.timeText}>{formatTime(timeRange[0])}</Text>
            <Text style={styles.timeText}>{formatTime(timeRange[1])}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          onPress={handleTimeRangeSelect} 
          style={styles.continueButtonContainer}
        >
          <Text style={styles.continueButton}>המשך</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBusinessCard = (business) => (
    <View key={business.id} style={styles.businessCard}>
      <View style={styles.businessHeader}>
        <View>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.businessAddress}>{business.address}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>{business.rating}</Text>
          <Icon name="star" size={16} color={Color.primaryColorAmaranthPurple} />
        </View>
      </View>
      
      <View style={styles.servicesContainer}>
        <Text style={styles.servicesTitle}>שירותים זמינים:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {business.services?.map(service => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceChip,
                selectedService?.id === service.id && styles.selectedServiceChip
              ]}
              onPress={() => setSelectedService(service)}
            >
              <Text style={[
                styles.serviceText,
                selectedService?.id === service.id && styles.selectedServiceText
              ]}>
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={[
          styles.quickBookButton,
          !selectedService && styles.quickBookButtonDisabled
        ]}
        disabled={!selectedService}
        onPress={() => handleQuickBook(business, selectedService)}
      >
        <Text style={styles.quickBookButtonText}>קבע תור מהיר</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      {renderSortButtons()}
      <FlatList
        data={sortedAppointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item, index) => `appointment-${item.businessId}-${index}`}
        ListEmptyComponent={
          <Text style={styles.noAppointmentsText}>
            לא נמצאו תורים זמינים
          </Text>
        }
        contentContainerStyle={styles.appointmentsList}
      />
    </View>
  );

  const handleQuickBook = (business, service) => {
    // Implement quick book logic here
  };

  return (
    <View style={styles.container}>
      {step === 0 && renderCategorySelection()}
      {step === 1 && renderTimeRangeSelection()}
      {step === 2 && renderResultsScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
    paddingTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.grayscaleColorBlack,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
    marginLeft: 4,
  },
  separator: {
    width: 1,
    height: 14,
    backgroundColor: Color.grayscaleColorLightGray,
    marginHorizontal: 8,
  },
  distance: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
    marginLeft: 4,
  },
  distanceContainer: {
    backgroundColor: Color.grayscaleColorLightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distance: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
  },
  appointmentInfo: {
    borderTopWidth: 1,
    borderTopColor: Color.grayscaleColorLightGray,
    paddingTop: 12,
  },
  date: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    fontWeight: '500',
    color: Color.primaryColorAmaranthPurple,
  },
  resultsContainer: {
    flex: 1,
    width: '100%',
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Color.grayscaleColorWhite,
    borderBottomWidth: 1,
    borderBottomColor: Color.grayscaleColorLightGray,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: Color.grayscaleColorLightGray,
  },
  sortButtonSelected: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  sortButtonText: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
  },
  sortButtonTextSelected: {
    color: Color.grayscaleColorWhite,
  },
  appointmentsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  quickBookButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Color.primaryColorAmaranthPurple,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickBookButtonDisabled: {
    backgroundColor: Color.grayscaleColorLightGray,
  },
  quickBookText: {
    color: Color.grayscaleColorWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  quickBookTextDisabled: {
    color: Color.grayscaleColorGray,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: Color.grayscaleColorGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  tryAgainButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tryAgainButtonText: {
    color: Color.grayscaleColorWhite,
    fontSize: 14,
    fontWeight: '500',
  },
  dateSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Color.grayscaleColorBlack,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  datesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateButton: {
    backgroundColor: Color.grayscaleColorLightGray,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  selectedDateButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  dayName: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: Color.grayscaleColorBlack,
  },
  selectedDateText: {
    color: Color.grayscaleColorWhite,
  },
  businessCard: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.grayscaleColorBlack,
  },
  businessAddress: {
    fontSize: 14,
    color: Color.grayscaleColorGray,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: Color.primaryColorAmaranthPurple,
    marginRight: 4,
  },
  servicesContainer: {
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Color.grayscaleColorLightGray,
    paddingTop: 12,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Color.grayscaleColorGray,
    marginBottom: 8,
    textAlign: 'right',
  },
  serviceChip: {
    backgroundColor: Color.grayscaleColorLightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedServiceChip: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  serviceText: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
  },
  selectedServiceText: {
    color: Color.grayscaleColorWhite,
  },
  quickBookButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  quickBookButtonDisabled: {
    backgroundColor: Color.grayscaleColorLightGray,
  },
  quickBookButtonText: {
    color: Color.grayscaleColorWhite,
    fontSize: 16,
    fontWeight: '500',
  },
  progressHeaderContainer: {
    backgroundColor: Color.grayscaleColorWhite,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: Color.grayscaleColorLightGray,
  },
  findingAppointmentText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: Color.primaryColorAmaranthPurple,
  },
  progressBarContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    width: '100%',
  },
  progressBarWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Color.grayscaleColorLightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: 4,
  },
  stepCounter: {
    fontSize: 14,
    color: Color.primaryColorAmaranthPurple,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  category: {
    fontSize: 16,
    color: Color.grayscaleColorWhite,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Color.grayscaleColorWhite,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: Color.grayscaleColorLightGray,
    alignItems: 'center',
  },
  continueButtonContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  continueButton: {
    fontSize: 18,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'center',
  },
  timeRangeContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sliderContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timeLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  timeText: {
    fontSize: 14,
    color: Color.primaryColorAmaranthPurple,
    fontWeight: '500',
  },
  servicesContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Color.grayscaleColorLightGray,
    paddingTop: 12,
  },
  servicesTitle: {
    fontSize: 14,
    color: Color.grayscaleColorGray,
    marginBottom: 8,
    textAlign: 'right',
  },
  servicesScrollContent: {
    paddingRight: 16,
  },
  serviceChip: {
    backgroundColor: Color.grayscaleColorLightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedServiceChip: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  serviceText: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
  },
  selectedServiceText: {
    color: Color.grayscaleColorWhite,
  },
  card: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: Color.grayscaleColorBlack,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: Color.grayscaleColorBlack,
    marginRight: 4,
  },
  appointmentTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Color.primaryColorAmaranthPurple,
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: Color.grayscaleColorLightGray,
    paddingTop: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: Color.grayscaleColorBlack,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '500',
    color: Color.grayscaleColorBlack,
  },
  bookButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Color.grayscaleColorWhite,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 16,
    color: Color.grayscaleColorBlack,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 16,
    color: Color.primaryColorAmaranthPurple,
    fontWeight: '600',
  },
});

export default QuickAppointments;
