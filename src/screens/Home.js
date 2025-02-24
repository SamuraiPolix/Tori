import * as React from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  I18nManager,
  StatusBar,
  RefreshControl
} from "react-native";
import { Image } from "expo-image";
import { FontFamily, Color } from "../styles/GlobalStyles";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';

// Import Components
import CategoriesList from '../components/categories/CategoriesList';
import SearchBar from '../components/common/SearchBar';
import SalonsList from '../components/salons/SalonsList';
import NearbySalonsList from '../components/salons/NearbySalonsList';
import BottomNavigation from '../components/common/BottomNavigation';
import SalonDetails from '../components/salons/SalonDetails';
import FilterModal from '../components/filters/FilterModal';
import BusinessMapModal from '../components/map/BusinessMapModal';
import { Alert } from 'react-native';

// Import Data
import { NEARBY_SALONS, SALONS } from '../components/salons/salonsData';
import { CATEGORIES } from '../components/categories/categoriesData';

// Import Firebase API and user storage
import { getUserData, storeUserData } from "../utils/userStorage";
import FirebaseApi from '../utils/FirebaseApi';

// קונפיגורציה של RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FilterOption = ({ title, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.filterOption, selected && styles.filterOptionSelected]}
    onPress={onPress}
  >
    <Text style={[styles.filterOptionText, selected && styles.filterOptionTextSelected]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = React.useState('home');
  const [searchText, setSearchText] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [userName, setUserName] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [showMap, setShowMap] = React.useState(false);
  const [businesses, setBusinesses] = React.useState([]);
  const [filters, setFilters] = React.useState({
    distance: 30,
    rating: 3,
    maxPrice: 200,
    availability: false,
    selectedDay: undefined,
    categoryId: undefined,
    userLocation: null
  });
  const [filteredSalons, setFilteredSalons] = React.useState([]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      nearbySalonsRef.current?.fetchNearbySalons(),
      salonsListRef.current?.fetchSalons(),
    ]).finally(() => {
      setRefreshing(false);
    });
  }, []);

  // Create refs for components that need refreshing
  const nearbySalonsRef = React.useRef();
  const salonsListRef = React.useRef();

  React.useEffect(() => {
    const loadUserName = async () => {
      try {
        // First try to get from local storage
        const localData = await getUserData();
        if (localData?.name) {
          setUserName(localData.name);
          return;
        }

        // If no local data, get from Firebase
        const currentUser = FirebaseApi.getCurrentUser();
        if (currentUser) {
          const userData = await FirebaseApi.getUserData(currentUser.uid);
          if (userData) {
            const name = userData.name || userData.displayName || 'אורח';
            setUserName(name);
            // Store in local storage for future use
            await storeUserData({ name });
          }
        }
      } catch (error) {
        console.error('Error loading user name:', error);
        setUserName('אורח');
      }
    };

    loadUserName();
  }, []);

  // Set default location (Azrieli mall) if permission denied or error occurs
  const DEFAULT_LOCATION = {
    latitude: 32.0745963,
    longitude: 34.7918675
  };

  // Add Israel boundaries
  const ISRAEL_BOUNDS = {
    north: 33.33,    // Northern boundary
    south: 29.49,    // Southern boundary
    west: 34.23,     // Western boundary
    east: 35.90      // Eastern boundary
  };

  const isLocationInIsrael = (location) => {
    return location.latitude >= ISRAEL_BOUNDS.south &&
           location.latitude <= ISRAEL_BOUNDS.north &&
           location.longitude >= ISRAEL_BOUNDS.west &&
           location.longitude <= ISRAEL_BOUNDS.east;
  };

  React.useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied, using default Azrieli mall location');
          setFilters(prev => ({
            ...prev,
            userLocation: DEFAULT_LOCATION
          }));
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        console.log('Retrieved location:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp).toLocaleString()
        });

        // Check if location is in Israel
        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };

        if (!isLocationInIsrael(userLocation)) {
          console.log('Location outside Israel, using default Azrieli mall location');
          setFilters(prev => ({
            ...prev,
            userLocation: DEFAULT_LOCATION
          }));
          return;
        }

        setFilters(prev => ({
          ...prev,
          userLocation: userLocation
        }));
      } catch (error) {
        console.error('Error getting location:', error);
        console.log('Using default Azrieli mall location');
        setFilters(prev => ({
          ...prev,
          userLocation: DEFAULT_LOCATION
        }));
      }
    };

    getUserLocation();
  }, []);

  React.useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const allBusinesses = await FirebaseApi.getAllBusinesses();
        setBusinesses(allBusinesses);
      } catch (error) {
        console.error('Error loading businesses:', error);
      }
    };
    loadBusinesses();
  }, []);

  React.useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(Color.primaryColorAmaranthPurple);
    }
  }, []);

  const formatDistance = (min, max) => {
    return `${min}-${max} ק"מ`;
  };

  const formatRating = (min, max) => {
    return `${min.toFixed(1)}-${max.toFixed(1)}+`;
  };

  const formatPrice = (min, max) => {
    return '₪'.repeat(Math.round(min)) + ' - ' + '₪'.repeat(Math.round(max));
  };

  // Navigation Handlers
  const handleCategoryPress = async (categoryId) => {
    try {
      console.log('Selected category ID:', categoryId);
      const businesses = await FirebaseApi.getBusinessesByCategory(categoryId);
      console.log(`Found ${businesses?.length || 0} businesses for category ${categoryId}`);
      
      // Get category title from CATEGORIES
      const category = CATEGORIES.find(c => c.id === categoryId);
      const title = category ? category.title : 'קטגוריה';
      
      navigation.navigate('FullList', {
        title: title,
        data: businesses,
        type: 'salon'
      });
    } catch (error) {
      console.error('Error getting businesses by category:', error);
      Alert.alert(
        'שגיאה',
        'אירעה שגיאה בטעינת העסקים. אנא נסה שוב.',
        [{ text: 'אישור' }]
      );
    }
  };

  const handleBusinessPress = (business) => {
    console.log('Navigating to business details with data:', business);
    navigation.navigate('SalonDetails', { 
      business,
      onUpdate: (updatedBusiness) => {
        // Update the business in both lists
        if (salonsListRef.current) {
          salonsListRef.current.updateBusiness(updatedBusiness);
        }
        if (nearbySalonsRef.current) {
          nearbySalonsRef.current.updateBusiness(updatedBusiness);
        }
      }
    });
  };

  const handleSearch = () => {
    console.log('Searching for:', searchText);
  };

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleSearchResults = (businesses, title) => {
    navigation.navigate('FullList', {
      title: title,
      data: businesses,
      type: 'salon'
    });
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    const screens = {
      appointments: 'MyAppointments',
      saved: 'Saved',
      profile: 'Profile',
      quick: 'QuickAppointments'
    };
    if (screens[tabId]) {
      navigation.navigate(screens[tabId]);
    }
  };

  const getDistance = (loc1, loc2) => {
    const lat1 = loc1.latitude;
    const lon1 = loc1.longitude;
    const lat2 = loc2.latitude;
    const lon2 = loc2.longitude;

    const R = 6371; // Radius of the earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d * 1000; // Convert to meters
  };

  const handleApplyFilters = async (newFilters) => {
    console.log('Applying new filters:', newFilters);
    
    try {
      // Get businesses from Firebase with all filters
      const businesses = await FirebaseApi.getBusinessesWithFilters({
        ...newFilters,
        userLocation: filters.userLocation // Add user location to filters
      });
      
      console.log(`Found ${businesses?.length || 0} businesses after filtering`);

      // Close the filter modal
      setShowFilters(false);

      // Navigate to the filtered results screen
      navigation.navigate('FullList', {
        title: 'תוצאות חיפוש',
        data: businesses,
        type: 'salon',
        filters: newFilters
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      Alert.alert(
        'שגיאה',
        'אירעה שגיאה בעת החיפוש. אנא נסה שוב.',
        [{ text: 'אישור', onPress: () => setShowFilters(false) }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Color.primaryColorAmaranthPurple]}
            tintColor={Color.primaryColorAmaranthPurple}
          />
        }
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.container}>
          {/* Header Background */}
          <View style={styles.headerBg}>
            <View style={styles.welcomeContainer}>
              <View style={styles.headerTopRow}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.navigate('Welcome')}
                >
                  <Ionicons name="arrow-forward" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.greetingContainer}>
                  <Text style={styles.welcomeText}>
                    <Text style={styles.boldText}>היי {userName || 'אורח/ת'}</Text> 😊{'\n'}
                    <Text style={styles.regularText}>איזה תור נקבע לך היום?</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <SearchBar 
                onFilterPress={handleFilterPress}
                onBusinessSelect={handleSearchResults}
              />
            </View>
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <CategoriesList 
              onSelectCategory={handleCategoryPress}
              navigation={navigation}
              onSeeAllPress={() => navigation.navigate('Categories')}
            />
          </View>

          {/* Map Button */}
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => setShowMap(true)}
          >
            <View style={styles.mapButtonContent}>
              <Ionicons name="map" size={24} color={Color.primaryColorAmaranthPurple} />
              <Text style={styles.mapButtonText}>כל העסקים על המפה</Text>
            </View>
          </TouchableOpacity>

          {/* Business Map Modal */}
          <BusinessMapModal
            visible={showMap}
            onClose={() => setShowMap(false)}
            businesses={businesses}
          />

          {/* Top Rated Salons */}
          <SalonsList 
            ref={salonsListRef}
            salons={SALONS}
            onSalonPress={handleBusinessPress} 
            navigation={navigation}
            onSeeAllPress={() => navigation.navigate('Salons')}
          />

          {/* Nearby Salons */}
          <NearbySalonsList 
            ref={nearbySalonsRef}
            salons={NEARBY_SALONS}
            onSalonPress={handleBusinessPress}
            navigation={navigation}
            onSeeAllPress={() => navigation.navigate('NearbySalons')}
          />

        </View>
      </ScrollView>

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  topSafeArea: {
    flex: 0,
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 90 : 70,
  },
  headerBg: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    paddingTop: Platform.OS === 'android' ? 45 : 12,
    paddingBottom: 45,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: 'relative',
  },
  welcomeContainer: {
    paddingHorizontal: 12,
  },
  headerTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  welcomeText: {
    textAlign: 'left',
    direction: 'rtl',
  },
  boldText: {
    fontSize: 24,
    fontFamily: FontFamily.rubikBold,
    color: Color.grayscaleColorWhite,
  },
  regularText: {
    fontSize: 16,
    fontFamily: FontFamily.rubikRegular,
    color: Color.grayscaleColorWhite,
  },
  searchBarContainer: {
    position: 'absolute',
    bottom: -22,
    left: 16,
    right: 16,
    zIndex: 1,
    flexDirection: 'row-reverse',
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Color.grayscaleColorWhite,
    borderColor: Color.grayscaleColorGray,
    borderWidth: 1,
  },
  filterOptionSelected: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  filterOptionText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorBlack,
  },
  filterOptionTextSelected: {
    color: Color.grayscaleColorWhite,
  },
  categoriesSection: {
    marginTop: 30,
    paddingHorizontal: 0,
    direction: 'rtl',
  },
  categoryTitle: {
    fontSize: 20,
    fontFamily: FontFamily.rubikBold,
    color: Color.grayscaleColor900,
    marginBottom: 12,
    paddingHorizontal: 16,
    textAlign: 'right',
  },
  mapButton: {
    width: '85%',
    alignSelf: 'center',
    marginVertical: 15,
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: Color.secondaryColorLightBlue,
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  mapButtonText: {
    marginRight: 10,
    fontFamily: FontFamily.primaryFontBold,
    fontSize: 16,
    color: Color.primaryColorAmaranthPurple,
  },
});

export default HomeScreen;