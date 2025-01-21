import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BusinessSidebar from '../../components/BusinessSidebar';

const getDayName = (dateString) => {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const date = new Date(dateString);
  return days[date.getDay()];
};

const formatDate = (date) => {
  if (!date) return 'אין ביקורים';
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

const BusinessCustomers = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [businessData, setBusinessData] = useState({});

  useEffect(() => {
    fetchCustomers();
    fetchBusinessData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        (customer.name + ' ' + customer.phone).toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const businessId = auth().currentUser.uid;
      console.log('Fetching customers for business:', businessId);

      // מביא את כל התורים של העסק
      const appointmentsSnapshot = await firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .get();

      // אוסף את כל מזהי הלקוחות הייחודיים
      const customerIds = new Set();
      const customerAppointmentsMap = new Map(); // מפה לשמירת התורים לפי לקוח
      const appointmentsToProcess = []; // Array to store appointments that need service details

      // מעבר על כל התורים וארגון לפי לקוח
      appointmentsSnapshot.forEach(doc => {
        const appointment = {
          id: doc.id,
          ...doc.data()
        };
        const customerId = appointment.customerId;
        
        if (customerId) {
          customerIds.add(customerId);
          
          // מוסיף את התור למערך התורים של הלקוח
          if (!customerAppointmentsMap.has(customerId)) {
            customerAppointmentsMap.set(customerId, []);
          }
          customerAppointmentsMap.get(customerId).push(appointment);
          
          // Add to processing queue if it has service info
          if (appointment.serviceId && appointment.businessId) {
            appointmentsToProcess.push(appointment);
          }
        }
      });

      // Process all services in parallel
      await Promise.all(
        appointmentsToProcess.map(async (appointment) => {
          try {
            const businessDoc = await firestore()
              .collection('businesses')
              .doc(appointment.businessId)
              .get();
            
            if (businessDoc.exists) {
              const businessData = businessDoc.data();
              const businessServices = businessData.services || {};
              const service = businessServices[appointment.serviceId];
              
              if (service) {
                appointment.service = {
                  id: appointment.serviceId,
                  name: service.name || 'שם שירות לא זמין',
                  duration: parseInt(service.duration) || 0,
                  price: parseInt(service.price) || 0
                };
              }
            }
          } catch (error) {
            console.error('Error fetching service details:', error);
          }
        })
      );

      console.log('Found unique customers:', customerIds.size);

      // מביא את המידע על כל הלקוחות
      const customersData = await Promise.all(
        Array.from(customerIds).map(async (customerId) => {
          // מביא את פרטי הלקוח
          const customerDoc = await firestore()
            .collection('users')
            .doc(customerId)
            .get();

          if (!customerDoc.exists) {
            console.log('Customer document does not exist:', customerId);
            return null;
          }

          const customerData = customerDoc.data();
          console.log('Customer data from Firestore:', customerData);

          // בדיקת השדות הנדרשים
          if (!customerData) {
            console.log('No customer data found for:', customerId);
            return null;
          }

          const fullName = customerData.name || `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
          console.log('Constructed full name:', fullName);

          // מקבל את התורים של הלקוח מהמפה
          const appointments = customerAppointmentsMap.get(customerId) || [];
          
          // מיין תורים לפי תאריך (החדש ביותר קודם)
          appointments.sort((a, b) => {
            const dateA = a.startTime ? new Date(a.startTime.seconds * 1000) : new Date(0);
            const dateB = b.startTime ? new Date(b.startTime.seconds * 1000) : new Date(0);
            return dateB - dateA;
          });

          // חישוב סטטיסטיקות
          let totalSpent = 0;
          let lastVisit = null;
          let totalVisits = 0;
          let canceledAppointments = 0;

          appointments.forEach(appointment => {
            if (appointment.status === 'completed') {
              // חישוב סכום כולל
              if (appointment.service?.price) {
                totalSpent += Number(appointment.service.price);
              }
              
              // ספירת ביקורים
              totalVisits++;
              
              // עדכון ביקור אחרון
              const visitDate = appointment.startTime ? new Date(appointment.startTime.seconds * 1000) : null;
              if (visitDate && (!lastVisit || visitDate > lastVisit)) {
                lastVisit = visitDate;
              }
            } else if (appointment.status === 'canceled') {
              canceledAppointments++;
            }
          });

          return {
            id: customerId,
            name: fullName || 'לקוח לא ידוע',
            phone: customerData.phoneNumber || customerData.phone || 'מספר לא זמין',
            email: customerData.email || '',
            totalVisits,
            totalSpent,
            lastVisit,
            canceledAppointments,
            recentAppointments: appointments.slice(0, 10) // 10 התורים האחרונים
          };
        })
      );

      // מסנן לקוחות לא קיימים ומיין לפי סכום ההוצאות
      const validCustomers = customersData
        .filter(customer => customer !== null)
        .sort((a, b) => b.totalSpent - a.totalSpent);

      setCustomers(validCustomers);
      setFilteredCustomers(validCustomers);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert(
        'שגיאה',
        'אירעה שגיאה בטעינת רשימת הלקוחות. אנא נסה שוב.',
        [{ text: 'אישור', style: 'default' }]
      );
      setIsLoading(false);
    }
  };

  const fetchBusinessData = async () => {
    try {
      const businessId = auth().currentUser?.uid;
      if (!businessId) {
        console.error('No business ID provided - user not logged in');
        return;
      }

      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .get();

      if (businessDoc.exists) {
        setBusinessData(businessDoc.data());
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone) => {
    Linking.openURL(`whatsapp://send?phone=972${phone.substring(1)}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderCustomerCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => navigation.navigate('CustomerDetails', { customer: item })}
    >
      <View style={styles.customerHeader}>
        <View style={styles.contactButtons}>
          <TouchableOpacity 
            style={[styles.contactButton, styles.whatsappButton]}
            onPress={() => handleWhatsApp(item.phone)}
          >
            <FontAwesome5 name="whatsapp" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.contactButton, styles.phoneButton]}
            onPress={() => handleCall(item.phone)}
          >
            <FontAwesome5 name="phone" size={18} color="#fff" />
          </TouchableOpacity>
          {item.email && (
            <TouchableOpacity 
              style={[styles.contactButton, styles.emailButton]}
              onPress={() => handleEmail(item.email)}
            >
              <FontAwesome5 name="envelope" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View>
          <Text style={styles.customerName}>👤 {item.name}</Text>
          <Text style={styles.customerContact}>📱 {item.phone}</Text>
        </View>
      </View>

      <View style={styles.customerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₪{item.totalSpent}</Text>
          <Text style={styles.statLabel}>💰 סה"כ</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.dateContainer}>
            {item.lastVisit ? (
              <>
                <Text style={styles.statValue}>{formatDate(item.lastVisit)}</Text>
                <Text style={styles.dayName}>יום {getDayName(item.lastVisit)}</Text>
              </>
            ) : (
              <Text style={styles.statValue}>אין ביקורים</Text>
            )}
          </View>
          <Text style={styles.statLabel}>🕒 ביקור אחרון</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            item.canceledAppointments > 0 && styles.canceledValue
          ]}>
            {item.canceledAppointments}
          </Text>
          <Text style={styles.statLabel}>❌ ביטולים</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalVisits}</Text>
          <Text style={styles.statLabel}>✨ ביקורים</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="חיפוש לקוחות..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#666"
      />
      <Ionicons name="search" size={24} color={Color.primary} style={styles.searchIcon} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Color.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BusinessSidebar
        isVisible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        businessData={businessData}
        currentScreen="BusinessCustomers"
      />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Color.primaryColorAmaranthPurple} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>לקוחות</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSidebar(true)}
          >
            <Ionicons name="menu-outline" size={24} color={Color.primaryColorAmaranthPurple} />
          </TouchableOpacity>
        </View>
      </View>

      {renderSearchBar()}

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>סה"כ {filteredCustomers.length} לקוחות פעילים 🌟</Text>
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  header: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamily.rubikMedium,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryText: {
    fontSize: 14,
    color: Color.primary,
    fontFamily: FontFamily.primary,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontFamily: FontFamily.primary,
    textAlign: 'right',
    fontSize: 14,
  },
  searchIcon: {
    marginHorizontal: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    fontFamily: FontFamily.primary,
    textAlign: 'right',
  },
  customerContact: {
    fontSize: 14,
    color: '#4a5568',
    fontFamily: FontFamily.primary,
    textAlign: 'right',
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  phoneButton: {
    backgroundColor: '#007AFF',
  },
  emailButton: {
    backgroundColor: '#FF5722',
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    fontFamily: FontFamily.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#4a5568',
    fontFamily: FontFamily.primary,
    marginTop: 2,
  },
  canceledValue: {
    color: '#ef4444',
  },
  dayName: {
    fontSize: 12,
    color: '#4a5568',
    fontFamily: FontFamily.primary,
  },
});

export default BusinessCustomers;
