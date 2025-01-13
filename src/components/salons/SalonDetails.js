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
  ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontFamily, Color, FontSize, Border, Padding } from "../../styles/GlobalStyles";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { 
  findAvailableSlots, 
  bookAppointment, 
  initializeBusinessSlots 
} from '../../utils/appointmentUtils';

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

  const businessData = route.params.business;
  const businessId = businessData.id;
  console.log(`Loading business: ${businessId}`);

  // Initialize default values for optional fields
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
      slotDuration: 30
    },
    settings: businessData.settings || {
      allowOnlineBooking: false,
      autoConfirm: false,
      notificationsEnabled: false,
      reminderTime: 60
    }
  };

  const formatWorkingHours = (workingHours) => {
    if (!workingHours) return {};
    
    const daysMap = {
      sunday: 'ראשון',
      monday: 'שני',
      tuesday: 'שלישי',
      wednesday: 'רביעי',
      thursday: 'חמישי',
      friday: 'שישי',
      saturday: 'שבת'
    };

    return Object.entries(workingHours).map(([day, hours]) => ({
      day: daysMap[day],
      hours: !hours.isOpen ? 'סגור' : 
             (hours.open === '00:00' && hours.close === '00:00') ? '24 שעות' :
             `${hours.open} - ${hours.close}`
    }));
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

  const fetchAvailableSlots = async (date) => {
    if (!businessId || !date) return [];
    
    try {
      setIsLoading(true);
      const dateStr = formatDate(date);
      
      // Get the available slot IDs for the selected date
      const availableSlotsDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .collection('availableSlots')
        .doc(dateStr)
        .get();

      if (!availableSlotsDoc.exists || !availableSlotsDoc.data()?.slots) {
        return [];
      }

      const slotIds = availableSlotsDoc.data().slots;
      
      // Get the actual appointment details from the appointments collection
      const appointmentsPromises = slotIds.map(id => 
        firestore()
          .collection('appointments')
          .doc(id)
          .get()
      );

      const appointmentDocs = await Promise.all(appointmentsPromises);
      
      // Filter out any invalid appointments and map to time slots
      const slots = appointmentDocs
        .filter(doc => doc.exists && doc.data().status === 'available')
        .map(doc => {
          const data = doc.data();
          const startTime = data.startTime.toDate();
          return {
            id: doc.id,
            time: startTime,
            formattedTime: startTime.toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          };
        })
        .sort((a, b) => a.time - b.time);

      return slots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את התורים הזמינים');
      return [];
    } finally {
      setIsLoading(false);
    }
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

      const appointmentsSnapshot = await firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .where('startTime', '>=', firestore.Timestamp.fromDate(queryStartTime))
        .where('startTime', '<=', firestore.Timestamp.fromDate(endOfDay))
        .get();

      // Get all booked time slots with their durations from the business services
      const bookedSlots = await Promise.all(appointmentsSnapshot.docs.map(async doc => {
        const data = doc.data();
        
        // Get the service duration from the business services
        const businessDoc = await firestore()
          .collection('businesses')
          .doc(businessId)
          .get();
        
        const businessServices = businessDoc.data()?.services || [];
        const appointmentService = businessServices.find(s => s.id === data.serviceId);
        const appointmentDuration = appointmentService?.duration || 30; // Default to 30 minutes if service not found
        
        return {
          id: doc.id,
          startTime: data.startTime,
          duration: appointmentDuration
        };
      }));

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
        const slotTime = firestore.Timestamp.fromDate(currentSlot);
        
        // Check if this slot conflicts with any booked appointment
        const isSlotAvailable = !bookedSlots.some(booking => {
          // Convert booking time to minutes since start of day
          const bookingDate = booking.startTime.toDate();
          const bookingMinutes = bookingDate.getHours() * 60 + bookingDate.getMinutes();
          
          // Convert current slot to minutes since start of day
          const slotMinutes = currentSlot.getHours() * 60 + currentSlot.getMinutes();
          
          // Check if there's any overlap between the service duration and the booked slot
          const serviceEndMinutes = slotMinutes + serviceDuration;
          const bookingEndMinutes = bookingMinutes + booking.duration;
          
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
            duration: serviceDuration
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
      
      const result = await findAvailableAppointments(businessId, date);
      if (result.error) {
        Alert.alert('שגיאה', result.error);
        return;
      }
      
      setAvailableSlots(result.available);
    } catch (error) {
      console.error('Error in handleDateSelect:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת המועדים הזמינים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = async (service) => {
    setSelectedService(service);
    setSelectedTime(null);
    
    // If a date was already selected, refresh the available slots for the new service
    if (selectedDate) {
      setIsLoading(true);
      try {
        const result = await findAvailableAppointments(businessId, selectedDate, service);
        if (result.error) {
          Alert.alert('שגיאה', result.error);
          return;
        }
        setAvailableSlots(result.available);
      } catch (error) {
        console.error('Error refreshing available slots:', error);
        Alert.alert('שגיאה', 'אירעה שגיאה בטעינת המועדים הזמינים');
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
      const user = auth().currentUser;
      
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
      
      // Check for overlapping appointments outside the transaction
      const endTime = new Date(slotTime.toDate().getTime() + serviceDuration * 60000);
      const overlappingAppointments = await firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .where('startTime', '>=', slotTime)
        .where('startTime', '<', firestore.Timestamp.fromDate(endTime))
        .where('status', 'in', ['pending', 'confirmed'])
        .get();

      if (!overlappingAppointments.empty) {
        Alert.alert('שגיאה', 'התור כבר נתפס על ידי לקוח אחר, נא לבחור מועד אחר');
        // Refresh available slots
        const result = await findAvailableAppointments(businessId, selectedDate, selectedService);
        setAvailableSlots(result.available);
        return;
      }

      // If no overlapping appointments, proceed with creating the appointment using a transaction
      await firestore().runTransaction(async (transaction) => {
        const appointmentRef = firestore().collection('appointments').doc();
        const appointmentId = appointmentRef.id;

        // Create the appointment within the transaction
        transaction.set(appointmentRef, {
          id: appointmentId,
          businessId: businessId,
          customerId: user.uid,
          serviceId: businessService.id,
          serviceName: businessService.name,
          startTime: selectedTime.time,
          duration: serviceDuration,
          price: businessService.price || 0,
          status: 'pending',
          notes: null,
          createdAt: firestore.Timestamp.now(),
          updatedAt: firestore.Timestamp.now()
        });

        // Add to user's appointments within the same transaction
        const userAppointmentRef = firestore()
          .collection('users')
          .doc(user.uid)
          .collection('appointments')
          .doc(appointmentId);

        transaction.set(userAppointmentRef, {
          appointmentId: appointmentId,
          businessId: businessId,
          serviceName: businessService.name,
          serviceId: businessService.id,
          startTime: selectedTime.time,
          duration: serviceDuration,
          price: businessService.price || 0,
          status: 'pending',
          createdAt: firestore.Timestamp.now()
        });
      });

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
    const searchQuery = encodeURIComponent(`${address}, ${businessName}`);
    
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
    
    // Generate next 30 days
    for (let i = 0; i < 30; i++) {
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
    const currentHours = businessData.workingHours[currentDay];
    
    if (currentHours.open === 'closed') return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMinute] = currentHours.open.split(':');
    const [closeHour, closeMinute] = currentHours.close.split(':');
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
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
            {businessData.services.map((service) => (
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
            ))}
            
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
          </View>
        );
      case 'gallery':
        return renderGallery();
      case 'reviews':
        return (
          <View style={styles.reviewsContainer}>
            {[1,2,3].map((item) => (
              <View key={item} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>לקוח מרוצה</Text>
                  <Text style={styles.reviewRating}>⭐ 5.0</Text>
                </View>
                <Text style={styles.reviewText}>שירות מעולה! תספורת מדהימה ויחס אישי</Text>
              </View>
            ))}
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
          <Ionicons name="arrow-back" size={24} color={Color.textColorPrimary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef}>
        {renderHeader()}
        <View style={styles.headerSection}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.backgroundColorPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Color.backgroundColorPrimary,
  },
  backButton: {
    padding: 8,
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
    gap: 16,
  },
  reviewItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewRating: {
    fontSize: 16,
  },
  reviewText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
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
});

export default SalonDetails;
