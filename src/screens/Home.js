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

// Import Components
import CategoriesList from '../components/categories/CategoriesList';
import SearchBar from '../components/common/SearchBar';
import SalonsList from '../components/salons/SalonsList';
import NearbySalonsList from '../components/salons/NearbySalonsList';
import BottomNavigation from '../components/common/BottomNavigation';
import SalonDetails from '../components/salons/SalonDetails';
import FilterModal from '../components/filters/FilterModal';

// Import Data
import { NEARBY_SALONS, SALONS } from '../components/salons/salonsData';

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
  const [filters, setFilters] = React.useState({
    distance: 5,
    rating: 4,
    price: 2,
    availability: false,
  });

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
  const handleCategoryPress = async (category) => {
    const businesses = await FirebaseApi.getBusinessesByCategory(category.id);
    navigation.navigate('FullList', {
      title: category.title,
      data: businesses,
      type: 'salon'
    });
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
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      const screens = {
        appointments: 'MyAppointments',
        saved: 'Saved',
        profile: 'Profile'
      };
      if (screens[tabId]) {
        navigation.navigate(screens[tabId]);
      }
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
});

export default HomeScreen;