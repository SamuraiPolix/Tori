import * as React from "react";
import { Image } from "expo-image";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  I18nManager, 
  TouchableOpacity, 
  Modal,
  Pressable,
  Dimensions,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontFamily, Color, FontSize, Border, Padding } from "../../styles/GlobalStyles";
import { useNavigation } from '@react-navigation/native';
import FirebaseApi from '../../utils/FirebaseApi';
import { Ionicons } from '@expo/vector-icons';

// Enable RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const TABS = [
  { id: 'about', title: 'אודות' },
  { id: 'services', title: 'שירותים' },
  { id: 'gallery', title: 'גלריה' },
  { id: 'reviews', title: 'חוות דעת' }
];

const SalonDetails = ({ route }) => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [selectedTime, setSelectedTime] = React.useState(null);
  const [availableSlots, setAvailableSlots] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState(route.params?.initialTab || 'about');
  const [selectedService, setSelectedService] = React.useState(null);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [notes, setNotes] = React.useState(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [businessData, setBusinessData] = React.useState(route.params.business);
  const [reviews, setReviews] = React.useState([]);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [reviewText, setReviewText] = React.useState('');
  const [rating, setRating] = React.useState(5);

  // Function to refresh business data
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      // Fetch updated business data
      const updatedBusiness = await FirebaseApi.getBusinessData(businessData.id);
      if (updatedBusiness) {
        setBusinessData(updatedBusiness);
        // If there's a selected date and service, refresh available slots
        if (selectedDate && selectedService) {
          const result = await findAvailableAppointments(businessData.id, selectedDate, selectedService);
          if (result.available) {
            setAvailableSlots(result.available);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing business data:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת נתוני העסק');
    } finally {
      setRefreshing(false);
    }
  }, [businessData.id, selectedDate, selectedService]);

  // Ensure we have valid business data
  if (!route?.params?.business) {
    console.error('No business data provided');
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>מידע על העסק אינו זמין</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>חזור</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const defaultBusinessData = {
    name: businessData.name || 'שם העסק לא זמין',
    about: businessData.about || 'אין תיאור זמין',
    rating: businessData.rating || 0,
    reviewsCount: businessData.reviewsCount || 0,
    address: businessData.address || 'כתובת לא זמינה',
    businessPhone: businessData.businessPhone || '',
    email: businessData.email || '',
    images: businessData.images || [],
    services: businessData.services || [],
    workingHours: businessData.workingHours || {
      sunday: { close: '', isOpen: false, open: '' },
      monday: { close: '', isOpen: false, open: '' },
      tuesday: { close: '', isOpen: false, open: '' },
      wednesday: { close: '', isOpen: false, open: '' },
      thursday: { close: '', isOpen: false, open: '' },
      friday: { close: '', isOpen: false, open: '' },
      saturday: { close: '', isOpen: false, open: '' }
    },
    scheduleSettings: businessData.scheduleSettings || {
      allowCancellation: false,
      allowSameDayBooking: false,
      autoApprove: false,
      cancellationTimeLimit: 0,
      maxFutureBookingDays: 30,
      minTimeBeforeBooking: 0,
      slotDuration: 30,
      notificationsEnabled: false,
    }
  };

  const formatWorkingHours = (workingHours) => {
    // if (!workingHours) return [];
    
    const daysMap = {
      sunday: 'ראשון',
      monday: 'שני',
      tuesday: 'שלישי',
      wednesday: 'רביעי',
      thursday: 'חמישי',
      friday: 'שישי',
      saturday: 'שבת'
    };

    // Get array of day keys in order from Sunday to Saturday
    const orderedDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Get current day index (0 = Sunday, 6 = Saturday)
    const today = new Date().getDay();
    
    // Reorder days to start from today
    const reorderedDays = [
      ...orderedDays.slice(today), // Days from today to end
      ...orderedDays.slice(0, today) // Days from start to today
    ];

    return reorderedDays.map(day => {
      if (!workingHours || !workingHours[day]) {
        return { day: daysMap[day], hours: 'סגור' };
      }
      return {
        day: daysMap[day],
        hours: !workingHours[day].isOpen ? 'סגור' : 
               (workingHours[day].open === '00:00' && workingHours[day].close === '00:00') ? '24 שעות' :
               `${workingHours[day].open} - ${workingHours[day].close}`
      };
    });
  };

  const scrollViewRef = React.useRef(null);
  const [datePosition, setDatePosition] = React.useState(0);
  const [timePosition, setTimePosition] = React.useState(0);

  // Helper function to format dates
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

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

      console.log('startOfDay:', startOfDay);
      console.log('Working hours:', workingHours);

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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleServiceSelect = async (service) => {
    setSelectedService(service);
    setSelectedTime(null);
    setAvailableSlots([]); // Reset slots when service changes
    
    // If a date was already selected, refresh the available slots for the new service
    if (selectedDate) {
      setIsLoading(true);
      try {
        const result = await findAvailableAppointments(businessData.id, selectedDate, service);
        if (result.error) {
          Alert.alert('שגיאה', result.error);
          return;
        }
        setAvailableSlots(result.available || []); // Ensure we always set an array
      } catch (error) {
        console.error('Error refreshing available slots:', error);
        Alert.alert('שגיאה', 'אירעה שגיאה בטעינת המועדים הזמינים');
        setAvailableSlots([]); // Reset on error
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTimeSelect = (slot) => {
    setSelectedTime(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedTime || !selectedDate) {
      Alert.alert('שגיאה', 'נא לבחור שירות, תאריך ושעה');
      return;
    }

    try {
      setIsLoading(true);
      const user = FirebaseApi.getCurrentUser();
      
      if (!user) {
        Alert.alert('שגיאה', 'יש להתחבר כדי לקבוע תור');
        return;
      }

      // Find the matching service from the business data
      const businessService = businessData.services.find(
        service => service.name === selectedService.name
      );

      if (!businessService) {
        Alert.alert('שגיאה', 'השירות שנבחר אינו קיים יותר');
        return;
      }

      // First check if the slot is still available
      const slotTime = selectedTime.time;
      const serviceDuration = selectedService.duration || 30;
      const endTime = new Date(slotTime.toDate().getTime() + serviceDuration * 60000);
      
      const hasOverlap = await FirebaseApi.checkOverlappingAppointments(
        businessData.id,
        slotTime,
        endTime
      );

      if (hasOverlap) {
        Alert.alert('שגיאה', 'התור כבר נתפס על ידי לקוח אחר, נא לבחור מועד אחר');
        // Refresh available slots
        const result = await findAvailableAppointments(businessData.id, selectedDate, selectedService);
        setAvailableSlots(result.available);
        return;
      }

      // Create the appointment with denormalized data
      await FirebaseApi.createAppointment(
        businessData.id,
        user.uid,
        selectedService.id,
        slotTime,
        notes || null
      );

      setShowConfirmModal(false);
      Alert.alert('הצלחה', 'התור נקבע בהצלחה');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בקביעת התור');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookPress = () => {
    if (!selectedService) {
      setActiveTab('services');
      return;
    }

    if (selectedService && selectedDate && selectedTime) {
      setShowConfirmModal(true);
      return;
    }

    setActiveTab('services');
    
    setTimeout(() => {
      if (!selectedDate && datePosition > 0) {
        scrollViewRef.current?.scrollTo({
          y: datePosition,
          animated: true
        });
      } else if (!selectedTime && timePosition > 0) {
        scrollViewRef.current?.scrollTo({
          y: timePosition,
          animated: true
        });
      }
    }, 100);
  };

  const handleNavigate = () => {
    const address = businessData.address;
    const businessName = businessData.name;
    var searchQuery = encodeURIComponent(`${businessName}`);
    if (address) {
      searchQuery = encodeURIComponent(`${address}`);
    }
    else {
      const location = businessData.location;
      if (location) {
        searchQuery = encodeURIComponent(`${location.latitude},${location.longitude}`);
      }
    }
    // const searchQuery = encodeURIComponent(`${address}, ${businessName}`);

    
    const url = Platform.select({
      ios: `maps://?q=${searchQuery}`,
      android: `geo:0,0?q=${searchQuery}`
    });

    Linking.openURL(url);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${businessData.businessPhone}`);
  };

  const renderConfirmModal = () => {
    if (!selectedService || !selectedTime || !selectedDate) return null;

    const formattedDate = new Date(selectedDate).toLocaleDateString('he-IL');
    const formattedTime = selectedTime.formattedTime;

    return (
      <Modal
        visible={showConfirmModal}
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>אישור תור</Text>
            <View style={styles.modalDetails}>
              <Text style={styles.modalText}>שירות: {selectedService.name}</Text>
              <Text style={styles.modalText}>תאריך: {formattedDate}</Text>
              <Text style={styles.modalText}>שעה: {formattedTime}</Text>
              <Text style={styles.modalText}>מחיר: ₪{selectedService.price}</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmBooking}
              >
                <Text style={styles.confirmButtonText}>אישור</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderBookButton = () => {
    let buttonText = 'קביעת תור';
    
    if (selectedService) {
      if (!selectedDate) {
        buttonText = 'בחירת תאריך';
      } else if (!selectedTime) {
        buttonText = 'בחירת שעה';
      } else {
        buttonText = 'אישור הזמנה';
      }
    }

    return (
      <View style={styles.stickyButton}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookPress}
        >
          <Text style={styles.bookButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDateSelector = () => {
    const dates = [];
    const today = new Date();
    
    // Determine start index based on allowSameDayBooking setting
    const startIndex = (!businessData.scheduleSettings?.allowSameDayBooking) ? 1 : 0;
    
    // Generate next 30 days
    for (let i = startIndex; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return (
      <View style={styles.dateSection}>
        <Text style={styles.sectionTitle}>בחר תאריך:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesContainer}
          ref={scrollViewRef}
        >
          {dates.map((date) => {
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
                onPress={() => handleDateSelect(date)}
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
    );
  };

  const renderTimeSelector = () => {
    if (!selectedDate) return null;

    return (
      <View style={styles.timeSelectorContainer}>
        <Text style={styles.sectionTitle}>בחר שעה:</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
        ) : availableSlots.length > 0 ? (
          <View style={styles.timeSlotsGrid}>
            {availableSlots.map((slot) => {
              const isSelected = selectedTime?.time?.seconds === slot.time.seconds;
              return (
                <TouchableOpacity
                  key={`${slot.time.seconds}-${slot.time.nanoseconds}`}
                  style={[
                    styles.timeButton,
                    isSelected && styles.selectedTimeButton
                  ]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      isSelected && styles.selectedTimeButtonText
                    ]}
                  >
                    {slot.formattedTime}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noSlotsText}>אין תורים זמינים בתאריך זה</Text>
        )}
      </View>
    );
  };

  const formatDayName = (dayIndex) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayIndex];
  };

  const renderGallery = () => {
    console.log('Rendering gallery: ', businessData.images);
    if (!businessData.images || businessData.images.length === 0) {
      return (
        <View style={styles.emptyGallery}>
          <Text style={styles.emptyText}>אין תמונות בגלריה</Text>
        </View>
      );
    }

    const numColumns = 2;
    const imageSize = (Dimensions.get('window').width - 30) / numColumns; // 30 is total margin

    return (
      <View style={styles.galleryContainer}>
        <View style={styles.galleryGrid}>
          {businessData.images.map((item, index) => (
            <TouchableOpacity 
              key={`gallery-image-${index}-${typeof item === 'string' ? item : item.uri}`}
              style={[styles.galleryImageContainer, { width: imageSize, height: imageSize }]}
              onPress={() => setSelectedImage(item)}
            >
              <Image
                source={item}
                style={styles.galleryImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderImageModal = () => {
    return (
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.closeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={selectedImage}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    );
  };

  const checkIfOpen = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const currentDay = days[now.getDay()];
    if (!businessData.workingHours || !businessData.workingHours[currentDay]) return false;
    const currentHours = businessData.workingHours[currentDay];
    
    // console.log('Current day:', currentDay);
    // console.log('Current hours:', currentHours);
    // console.log('now:', now.toISOString());
    
    if (!currentHours.isOpen) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMinute] = currentHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = currentHours.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    // console.log('Current time:', currentTime);
    // console.log('Open time:', openTime);
    // console.log('Close time:', closeTime);
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const renderBusinessHours = () => {
    const isOpen = checkIfOpen();
    
    return (
      <View style={styles.businessHoursContainer}>
        <View style={styles.businessHoursHeader}>
          <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.statusText, isOpen ? styles.openText : styles.closedText]}>
              {isOpen ? 'פתוח' : 'סגור'}
            </Text>
          </View>
          <Text style={styles.sectionTitle}>שעות פעילות</Text>
        </View>
        <View style={styles.businessHoursList}>
          {formatWorkingHours(businessData.workingHours).map((item) => (
            <View 
              key={`business-hours-${item.day}`} 
              style={styles.businessHoursRow}
            >
              <Text style={styles.hoursText}>
                {item.hours}
              </Text>
              <Text style={styles.dayText}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAbout = () => {
    return (
      <View style={styles.aboutContainer}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>תיאור</Text>
          <Text style={styles.description}>{businessData.about}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleNavigate}>
            <Ionicons name="navigate" size={20} color={Color.primaryColorAmaranthPurple} />
            <Text style={styles.actionButtonText}>ניווט</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color={Color.primaryColorAmaranthPurple} />
            <Text style={styles.actionButtonText}>התקשר</Text>
          </TouchableOpacity>
        </View>

        {renderBusinessHours()}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return renderAbout();
      case 'services':
        return (
          <View style={styles.servicesContainer}>
            <Text style={styles.sectionTitle}>בחר שירות:</Text>
            {businessData.services && businessData.services.length > 0 ? (
              businessData.services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceItem,
                    selectedService?.id === service.id && styles.selectedService
                  ]}
                  onPress={() => handleServiceSelect(service)}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={[
                      styles.serviceText,
                      selectedService?.id === service.id && styles.selectedServiceText
                    ]}>
                      {service.name}
                    </Text>
                    <Text style={styles.serviceDuration}>
                      {service.duration} דקות
                    </Text>
                  </View>
                  <Text style={[
                    styles.servicePrice,
                    selectedService?.id === service.id && styles.selectedServiceText
                  ]}>
                    ₪{service.price}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyServices}>
                <Text style={styles.emptyText}>לעסק זה אין שירותים זמינים</Text>
              </View>
            )}
            
            {businessData.services && businessData.services.length > 0 && (
              <>
                <View 
                  onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    setDatePosition(y);
                  }}
                >
                  {renderDateSelector()}
                </View>
                
                <View 
                  onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    setTimePosition(y);
                  }}
                >
                  {renderTimeSelector()}
                </View>
              </>
            )}
          </View>
        );
      case 'gallery':
        return renderGallery();
      case 'reviews':
        return (
          <View style={styles.reviewsContainer}>
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={() => handleAddReview()}
            >
              <Text style={styles.addReviewButtonText}>מה דעתך על בית העסק?</Text>
            </TouchableOpacity>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.userName}</Text>
                    <Text style={styles.reviewRating}>{'⭐'.repeat(review.stars)}</Text>
                  </View>
                  <Text style={styles.reviewText}>{review.review}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>אין חוות דעת עדיין</Text>
            )}
          </View>
        );
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  React.useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews();
    }
  }, [activeTab]);

  const loadReviews = async () => {
    try {
      const reviews = await FirebaseApi.getBusinessReviews(businessData.id);
      setReviews(reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת חוות הדעת');
    }
  };

  const handleAddReview = async () => {
    try {
      const user = FirebaseApi.getCurrentUser();
      if (!user) {
        Alert.alert('שגיאה', 'יש להתחבר כדי להוסיף חוות דעת');
        return;
      }

      // Check if user has an approved appointment
      const hasApprovedAppointment = await FirebaseApi.hasUserApprovedAppointment(user.uid, businessData.id);
      if (!hasApprovedAppointment) {
        Alert.alert('שגיאה', 'ניתן להוסיף חוות דעת רק לאחר ביקור בעסק');
        return;
      }

      // Check if user already reviewed
      const hasReviewed = await FirebaseApi.hasUserReviewedBusiness(user.uid, businessData.id);
      if (hasReviewed) {
        Alert.alert('שגיאה', 'כבר כתבת חוות דעת לעסק זה');
        return;
      }

      setShowReviewModal(true);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בבדיקת זכאות לכתיבת חוות דעת');
    }
  };

  const handleSubmitReview = async () => {
    try {
      const user = FirebaseApi.getCurrentUser();
      if (!user) return;

      await FirebaseApi.createReview(
        businessData.id,
        user.uid,
        user.displayName,
        rating,
        reviewText
      );

      // Fetch updated business data
      const updatedBusinessData = await FirebaseApi.getBusinessData(businessData.id);
      setBusinessData(updatedBusinessData);

      // If navigation params has an onUpdate callback, call it with updated data
      if (route.params?.onUpdate) {
        route.params.onUpdate(updatedBusinessData);
      }

      setShowReviewModal(false);
      setReviewText('');
      setRating(5);
      loadReviews();
      Alert.alert('תודה', 'חוות הדעת נשמרה בהצלחה');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת חוות הדעת');
    }
  };

  const renderReviewModal = () => {
    return (
      <Modal
        visible={showReviewModal}
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>כתיבת חוות דעת</Text>
            
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Text style={[
                    styles.starText,
                    star <= rating && styles.selectedStar
                  ]}>
                    ⭐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="כתוב את חוות דעתך כאן..."
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSubmitReview}
              >
                <Text style={styles.confirmButtonText}>שלח</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Color.primaryColorAmaranthPurple]}
            tintColor={Color.primaryColorAmaranthPurple}
          />
        }
      >
        <View style={styles.headerSection}>
          {renderHeader()}
          {businessData.images[0] ? (
            <Image
              style={styles.coverImage}
              contentFit="cover"
              source={businessData.images[0]}
            />
          ) : (
            <View style={[styles.coverImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>אין תמונה זמינה</Text>
            </View>
          )}
          <LinearGradient
            style={styles.gradient}
            locations={[0, 0.7, 1]}
            colors={[
              "rgba(0, 0, 0, 0)",
              "rgba(0, 0, 0, 0.8)",
              "rgba(0, 0, 0, 0.95)",
            ]}
          />
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>{businessData.name}</Text>
            <Text style={styles.subtitle}>{businessData.about}</Text>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>⭐ {businessData.rating}</Text>
                <Text style={styles.reviewCount}>({businessData.reviewsCount} ביקורות)</Text>
              </View>
              <Text style={styles.infoText}>{businessData.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mainContent}>
          {renderTabContent()}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
      {renderBookButton()}
      {renderConfirmModal()}
      {renderImageModal()}
      {renderReviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.backgroundColorPrimary,
  },
  header: {
    position: 'absolute',
    top: 25,
    left: 1,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButton: {
    margin: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerSection: {
    height: 300,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 16,
  },
  infoContainer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'right',
  },
  reviewCount: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  mainContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'right',
    lineHeight: 24,
  },
  servicesContainer: {
    padding: 15,
  },
  serviceItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  selectedService: {
    backgroundColor: '#e6f3ff',
    borderColor: '#007AFF',
  },
  serviceInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  serviceText: {
    fontSize: 16,
    color: '#000000',
  },
  selectedServiceText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  hoursContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  hourRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'right',
  },
  timeText: {
    fontSize: 16,
    color: '#666666',
  },
  galleryContainer: {
    padding: 10,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryImageContainer: {
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  emptyGallery: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: FontFamily.assistantRegular,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '90%',
  },
  closeImageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  reviewsContainer: {
    padding: 16,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: FontSize.size_base,
    fontWeight: '600',
    color: Color.textColorPrimary,
  },
  reviewRating: {
    fontSize: FontSize.size_sm,
    color: Color.textColorSecondary,
  },
  reviewText: {
    fontSize: FontSize.size_sm,
    color: Color.textColorPrimary,
    textAlign: 'right',
  },
  addReviewButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  addReviewButtonText: {
    color: '#fff',
    fontSize: FontSize.size_base,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 24,
    opacity: 0.3,
  },
  selectedStar: {
    opacity: 1,
  },
  reviewInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  dateContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
    color: Color.black,
  },
  datesScroll: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  dateCard: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDateCard: {
    backgroundColor: '#e6f3ff',
    borderColor: '#007AFF',
  },
  dayName: {
    fontSize: 14,
    color: '#666666',
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  selectedDateText: {
    color: '#007AFF',
  },
  timeSelectorContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  timeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
    color: Color.black,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  timeButtonText: {
    fontSize: 16,
    color: Color.textColorPrimary,
    fontFamily: FontFamily.assistant,
  },
  selectedTimeButtonText: {
    color: Color.grayscaleColorWhite,
  },
  noSlotsText: {
    fontFamily: FontFamily.assistant,
    fontSize: 16,
    color: Color.textColorSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  stickyButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bookButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 80, // Space for sticky button
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
    textAlign: 'center',
  },
  salonName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryContainer: {
    width: '100%',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  businessHoursContainer: {
    marginTop: 20,
  },
  businessHoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  openBadge: {
    backgroundColor: '#E8F5E9',
  },
  closedBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantSemiBold,
  },
  openText: {
    color: '#2E7D32',
  },
  closedText: {
    color: '#C62828',
  },
  businessHoursList: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
  },
  businessHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorBlack,
  },
  hoursText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorGray,
  },
  aboutContainer: {
    padding: 20,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: Color.grayscaleColorGray,
    textAlign: 'right',
    lineHeight: 24,
  },
  locationContainer: {
    marginBottom: 20,
  },
  address: {
    fontSize: 16,
    color: Color.grayscaleColorGray,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    marginLeft: 8,
    color: Color.primaryColorAmaranthPurple,
    fontSize: 16,
    fontFamily: FontFamily.assistantSemiBold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: FontFamily.assistant,
    fontSize: 18,
    color: Color.grayscaleColorGray,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    padding: 10,
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: FontFamily.assistant,
    color: Color.grayscaleColorWhite,
    fontSize: 16,
  },
  placeholderImage: {
    backgroundColor: Color.grayscaleColorLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: FontFamily.assistant,
    color: Color.grayscaleColorGray,
    fontSize: 16,
  },
  dateSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: FontFamily.assistant,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Color.textColorPrimary,
  },
  datesContainer: {
    paddingVertical: 8,
  },
  dateButton: {
    width: 65,
    height: 75,
    borderRadius: 12,
    backgroundColor: Color.grayscaleColorGray50,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  selectedDateButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  dayName: {
    fontFamily: FontFamily.assistant,
    fontSize: 14,
    color: Color.textColorSecondary,
    marginBottom: 4,
  },
  dayNumber: {
    fontFamily: FontFamily.assistant,
    fontSize: 18,
    fontWeight: 'bold',
    color: Color.textColorPrimary,
  },
  selectedDateText: {
    color: Color.grayscaleColorWhite,
  },
  emptyServices: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SalonDetails;
