import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager
} from 'react-native';
import { Image } from 'expo-image';
import { Color, FontFamily } from '../styles/GlobalStyles';
import FirebaseApi from '../utils/FirebaseApi';
import FilterModal from '../components/filters/FilterModal';
import * as Location from 'expo-location';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const QuickAppointments = ({ navigation }) => {
  const [allAppointments, setAllAppointments] = useState([]);
  const [sortedAppointments, setSortedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'distance'
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    distance: 5, // Default distance in kilometers
    category: null,
    maxPrice: 1000,
    rating: 0
  });

  const sortAppointments = (appointments, sortType) => {
    return [...appointments].sort((a, b) => {
      if (sortType === 'time') {
        // Convert Firebase timestamps to milliseconds for accurate comparison
        const timeA = a.nextAvailable.startTime.toDate().getTime();
        const timeB = b.nextAvailable.startTime.toDate().getTime();
        const timeComparison = timeA - timeB;
        
        // If times are equal (within same minute), sort by distance
        if (Math.abs(timeComparison) < 60000) { // 60000ms = 1 minute
          return parseFloat(a.distance) - parseFloat(b.distance);
        }
        return timeComparison;
      }
      // Sort by distance, but if distances are equal (within 0.1km), sort by time
      const distanceA = parseFloat(a.distance);
      const distanceB = parseFloat(b.distance);
      const distanceComparison = distanceA - distanceB;
      
      if (Math.abs(distanceComparison) < 0.1) { // If distances are within 0.1km
        const timeA = a.nextAvailable.startTime.toDate().getTime();
        const timeB = b.nextAvailable.startTime.toDate().getTime();
        return timeA - timeB;
      }
      return distanceComparison;
    });
  };

  const fetchQuickAppointments = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        alert('נדרשת הרשאת מיקום כדי למצוא תורים קרובים');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      console.log('Retrieved location:', location.coords);
      
      const appointments = await FirebaseApi.getQuickAppointments({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }, filters.distance);

      setAllAppointments(appointments);
      setSortedAppointments(sortAppointments(appointments, sortBy));
    } catch (error) {
      console.error('Error fetching quick appointments:', error);
      alert('אירעה שגיאה בטעינת התורים המהירים');
    } finally {
      setLoading(false);
    }
  };

  // Sort appointments when sortBy changes
  useEffect(() => {
    setSortedAppointments(sortAppointments(allAppointments, sortBy));
  }, [sortBy]);

  // Fetch appointments only when filters change
  useEffect(() => {
    fetchQuickAppointments();
  }, [filters]);

  const renderAppointmentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={async () => {
        const businessData = await FirebaseApi.getBusinessData(item.businessId);
        navigation.navigate('SalonDetails', { business: businessData });
      }}
    >
      <Image
        source={{ uri: item.businessImage }}
        style={styles.businessImage}
        contentFit="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.businessName}>{item.businessName}</Text>
        <Text style={styles.appointmentTime}>
          {item.nextAvailable.formattedDate} {item.nextAvailable.formattedTime}
        </Text>
        <Text style={styles.distance}>{item.distance} ק"מ</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSortButtons = () => (
    <View style={styles.sortContainer}>
      <TouchableOpacity 
        style={[styles.sortButton, sortBy === 'time' && styles.activeSortButton]}
        onPress={() => setSortBy('time')}
      >
        <Text style={[styles.sortButtonText, sortBy === 'time' && styles.activeSortButtonText]}>
          לפי זמן
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.sortButton, sortBy === 'distance' && styles.activeSortButton]}
        onPress={() => setSortBy('distance')}
      >
        <Text style={[styles.sortButtonText, sortBy === 'distance' && styles.activeSortButtonText]}>
          לפי מרחק
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSortButtons()}
      
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>סינון</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
      ) : (
        <FlatList
          data={sortedAppointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.businessId}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setFilterModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
    marginTop: 16, // Add margin to prevent overlap with status bar
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  businessImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  businessName: {
    fontSize: 16,
    fontFamily: FontFamily.assistantSemiBold,
    color: Color.grayscaleColorBlack,
  },
  appointmentTime: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    marginTop: 4,
  },
  distance: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.primaryColorAmaranthPurple,
    marginTop: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8, // Add some spacing from the top margin
    borderBottomWidth: 1,
    borderBottomColor: Color.colorGainsboro,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  activeSortButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  sortButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  activeSortButtonText: {
    color: Color.grayscaleColorWhite,
  },
  filterButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
    backgroundColor: Color.grayscaleColorWhite,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.primaryColorAmaranthPurple,
  },
});

export default QuickAppointments;
