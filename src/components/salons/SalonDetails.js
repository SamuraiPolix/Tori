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
  Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontFamily, Color, FontSize, Border, Padding } from "../../styles/GlobalStyles";
import { useNavigation } from '@react-navigation/native';
import { SALONS } from './salonsData';
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
  const { salon } = route?.params || {};
  const salonData = salon || SALONS.find(s => s.id === 1); // ברירת מחדל לסלון הראשון אם לא נשלח סלון
  const scrollViewRef = React.useRef(null);
  const [datePosition, setDatePosition] = React.useState(0);
  const [timePosition, setTimePosition] = React.useState(0);
  const [selectedImage, setSelectedImage] = React.useState(null);

  const [activeTab, setActiveTab] = React.useState('about');
  const [selectedService, setSelectedService] = React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [selectedTime, setSelectedTime] = React.useState(null);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const handleServiceSelect = (service) => {
    // אם השירות כבר נבחר, נבטל את הבחירה
    if (selectedService?.id === service.id) {
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);
    } else {
      setSelectedService(service);
    }
  };

  const formatDate = (dateStr) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const date = new Date(dateStr);
    const dayName = days[date.getDay()];
    return `יום ${dayName}, ${dateStr}`;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
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

  const handleConfirmBooking = () => {
    // Here you would send the booking to your backend
    setShowConfirmModal(false);
    alert('התור נקבע בהצלחה!');
    // Reset selections after successful booking
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setActiveTab('about');
  };

  const handleNavigate = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${salonData.latitude},${salonData.longitude}`;
    const label = salonData.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${salonData.phone}`);
  };

  const renderConfirmModal = () => {
    if (!selectedService || !selectedDate || !selectedTime) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>אישור הזמנה</Text>
            <Text style={styles.salonName}>{salonData.name}</Text>
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{selectedService.name}</Text>
                <Text style={styles.summaryLabel}>שירות:</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
                <Text style={styles.summaryLabel}>תאריך:</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
                <Text style={styles.summaryLabel}>שעה:</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>₪{selectedService.price}</Text>
                <Text style={styles.summaryLabel}>מחיר:</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>ביטול</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmBooking}
              >
                <Text style={styles.modalButtonText}>אישור</Text>
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
    if (!selectedService) return null;

    return (
      <View>
        <Text style={styles.dateTitle}>בחר תאריך:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
          {Object.keys(salonData.availableSlots).map((date) => {
            const dateObj = new Date(date);
            const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][dateObj.getDay()];
            const dayNumber = dateObj.getDate();
            
            return (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateCard,
                  selectedDate === date && styles.selectedDateCard
                ]}
                onPress={() => handleDateSelect(date)}
              >
                <Text style={[
                  styles.dayName,
                  selectedDate === date && styles.selectedDateText
                ]}>
                  {dayName}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  selectedDate === date && styles.selectedDateText
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

  const renderTimeSlots = () => {
    if (!selectedDate || !salonData.availableSlots[selectedDate]) return null;

    return (
      <View>
        <Text style={styles.timeTitle}>בחר שעה:</Text>
        <View style={styles.timeGrid}>
          {salonData.availableSlots[selectedDate].map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                selectedTime === time && styles.selectedTimeSlot
              ]}
              onPress={() => handleTimeSelect(time)}
            >
              <Text style={[
                styles.timeSlotText,
                selectedTime === time && styles.selectedTimeSlotText
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderGallery = () => {
    if (!salonData.gallery || salonData.gallery.length === 0) {
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
          {salonData.gallery.map((item, index) => (
            <TouchableOpacity 
              key={index}
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
    const currentHours = salonData.openingHours[currentDay];
    
    if (currentHours.open === 'closed') return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMinute] = currentHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = currentHours.close.split(':').map(Number);
    
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
          {Object.entries(salonData.openingHours).map(([day, hours]) => {
            const hebrewDays = {
              sunday: 'ראשון',
              monday: 'שני',
              tuesday: 'שלישי',
              wednesday: 'רביעי',
              thursday: 'חמישי',
              friday: 'שישי',
              saturday: 'שבת'
            };
            
            return (
              <View key={day} style={styles.businessHoursRow}>
                <Text style={styles.hoursText}>
                  {hours.open === 'closed' ? 'סגור' : `${hours.open} - ${hours.close}`}
                </Text>
                <Text style={styles.dayText}>{hebrewDays[day]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderAbout = () => {
    return (
      <View style={styles.aboutContainer}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>תיאור</Text>
          <Text style={styles.description}>{salonData.description}</Text>
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
            {salonData.services.map((service) => (
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
              {renderTimeSlots()}
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

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.scrollView}
      >
        <View style={styles.headerSection}>
          <Image
            style={styles.coverImage}
            contentFit="cover"
            source={salonData.image}
          />
          <LinearGradient
            style={styles.gradient}
            locations={[0, 0.7, 1]}
            colors={[
              "rgba(0, 0, 0, 0)",
              "rgba(0, 0, 0, 0.8)",
              "rgba(0, 0, 0, 0.95)",
            ]}
          />
          
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-forward" size={24} color="#000000" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.title}>{salonData.name}</Text>
            <Text style={styles.subtitle}>{salonData.description}</Text>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>⭐ {salonData.rating}</Text>
                <Text style={styles.reviewCount}>({salonData.reviewsCount} ביקורות)</Text>
              </View>
              <Text style={styles.infoText}>{salonData.address}</Text>
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
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
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
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  timeSlotsContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  timeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
    color: Color.black,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
    marginLeft: 8,
  },
  selectedTimeSlot: {
    backgroundColor: '#e6f3ff',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#000000',
  },
  selectedTimeSlotText: {
    color: '#007AFF',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
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
});

export default SalonDetails;
