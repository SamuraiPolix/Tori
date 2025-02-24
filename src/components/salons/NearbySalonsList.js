import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import SalonCard from './SalonCard';
import FirebaseApi from '../../utils/FirebaseApi';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { DEFAULT_LOCATION, isLocationInIsrael } from '../../constants/locations';

const SCREEN_WIDTH = Dimensions.get('window').width;

const NearbySalonsList = forwardRef(({ onSalonPress, navigation }, ref) => {
  const [allSalons, setAllSalons] = useState([]);
  const [displaySalons, setDisplaySalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({
    distance: 50, // Default 50km radius
    rating: 1,
    maxPrice: 1000,
    availability: false
  });

  // Expose methods to parent through ref
  useImperativeHandle(ref, () => ({
    fetchNearbySalons,
    updateBusiness: (updatedBusiness) => {
      setAllSalons(prevSalons => 
        prevSalons.map(salon => {
          if (salon.id === updatedBusiness.id) {
            return { ...updatedBusiness, distance: salon.distance };
          }
          return salon;
        })
      );
      setDisplaySalons(prevSalons => 
        prevSalons.map(salon => {
          if (salon.id === updatedBusiness.id) {
            return { ...updatedBusiness, distance: salon.distance };
          }
          return salon;
        })
      );
    },
    applyFilters: (filters) => {
      console.log('Applying filters to nearby salons:', filters);
      setCurrentFilters(filters);
      const filteredSalons = applyFiltersToSalons(allSalons, filters);
      console.log('Filtered nearby salons:', filteredSalons.length);
      setDisplaySalons(filteredSalons);
    }
  }));

  const applyFiltersToSalons = useCallback((salons, filters) => {
    if (!filters || !salons) return salons;

    return salons.filter(salon => {
      // Distance filter
      if (salon.distance > filters.distance) {
        console.log(`Salon ${salon.name} filtered out by distance: ${salon.distance} > ${filters.distance}`);
        return false;
      }

      // Rating filter
      if (salon.rating < filters.rating) {
        console.log(`Salon ${salon.name} filtered out by rating: ${salon.rating} < ${filters.rating}`);
        return false;
      }

      // Price filter (using average price of services)
      const avgPrice = salon.services?.reduce((sum, service) => sum + (service.price || 0), 0) / (salon.services?.length || 1);
      if (avgPrice > filters.maxPrice) {
        console.log(`Salon ${salon.name} filtered out by price: ${avgPrice} > ${filters.maxPrice}`);
        return false;
      }

      // Availability filter
      if (filters.availability && !salon.isAvailableToday) {
        console.log(`Salon ${salon.name} filtered out by availability`);
        return false;
      }

      // Selected day filter
      if (filters.selectedDay !== undefined) {
        const hasAvailabilityForDay = salon.availability?.[filters.selectedDay]?.some(slot => !slot.isBooked);
        if (!hasAvailabilityForDay) {
          console.log(`Salon ${salon.name} filtered out by selected day: ${filters.selectedDay}`);
          return false;
        }
      }

      return true;
    });
  }, []);

  const fetchNearbySalons = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Get location permission and current location
      console.log('1. Requesting location permission...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }
      console.log('✅ Location permission granted');

      // 2. Get current location
      console.log('2. Getting current location...');
      const locationResult = await Location.getCurrentPositionAsync({});
      
      // 3. Check if location is in Israel
      let currentLocation;
      if (isLocationInIsrael(locationResult.coords.latitude, locationResult.coords.longitude)) {
        currentLocation = {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude
        };
        console.log('📍 Using device location:', currentLocation);
      } else {
        currentLocation = DEFAULT_LOCATION;
        console.log('📍 Location outside Israel, using default location (Azrieli Mall Tel Aviv):', currentLocation);
      }

      // 4. Fetch all businesses
      console.log('3. Fetching all businesses...');
      const businesses = await FirebaseApi.getAllBusinesses();
      console.log(`✅ Fetched ${businesses.length} businesses`);
      
      // Log business details
      businesses.forEach((business, index) => {
        console.log(`Business ${index + 1}:`, {
          id: business.id,
          name: business.name,
          categoryId: business.categoryId,
          hasLocation: business.location ? 'yes' : 'no',
          location: business.location
        });
      });

      // 5. Calculate distances and sort by distance
      console.log('4. Calculating distances from reference point:', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      });
      
      const salonsWithDistance = businesses
        .filter(business => business.location !== null) // Only include businesses with location
        .map(business => {
          const distance = getDistance(
            { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            { latitude: business.location.latitude, longitude: business.location.longitude }
          ) / 1000; // Convert to kilometers

          console.log(`Business ${business.name}: Distance = ${distance}km from reference point`);
          return { ...business, distance };
        })
        .sort((a, b) => a.distance - b.distance);

      console.log('✅ Distance calculation complete');
      console.log(`Found ${salonsWithDistance.length} businesses with valid locations`);

      // 6. Get haircut category ID
      console.log('5. Fetching haircut category...');
      const category = await FirebaseApi.getHaircutCategory();
      if (!category) {
        console.log('❌ No haircut category found');
        setErrorMsg('Category not found');
        setLoading(false);
        return;
      }
      const categoryId = category.categoryId;
      console.log('🏷️ Using categoryId:', categoryId);

      // 7. Filter businesses by category and distance
      const businessesInCategory = salonsWithDistance.filter(business => {
        const hasCategory = business.categories && business.categories.includes(categoryId);
        console.log(`Business ${business.name}: categories=${JSON.stringify(business.categories)}, hasCategory=${hasCategory}`);
        return hasCategory;
      });
      console.log(`Found ${businessesInCategory.length} businesses in category ${categoryId}`);

      const filteredBusinesses = businessesInCategory.filter(business => {
        const withinDistance = business.distance <= currentFilters.distance;
        console.log(`Business ${business.name}: distance=${business.distance}km, withinRange=${withinDistance}`);
        return withinDistance;
      });

      console.log(`Final results: ${filteredBusinesses.length} businesses within ${currentFilters.distance}km in category ${categoryId}`);
      
      setAllSalons(filteredBusinesses);
      setDisplaySalons(filteredBusinesses.slice(0, 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching nearby salons:', error);
      setErrorMsg('Error fetching salons');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbySalons();
  }, []);

  useEffect(() => {
    if (currentFilters && allSalons.length > 0) {
      applyFiltersToSalons(allSalons, currentFilters);
    }
  }, [currentFilters, allSalons, applyFiltersToSalons]);

  const handleViewAll = () => {
    navigation.navigate('FullList', {
      title: 'עסקים בקרבתך',
      data: allSalons.map(salon => ({ ...salon, fullData: true })),
      type: 'salon'
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>מספרות בסביבתך</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Color.primaryColorAmaranthPurple} />
        </View>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>מספרות בסביבתך</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{errorMsg}</Text>
        </View>
      </View>
    );
  }

  if (!displaySalons.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>מספרות בסביבתך</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {currentFilters 
              ? 'לא נמצאו עסקים בקרבתך המתאימים לפילטרים שנבחרו'
              : 'לא נמצאו עסקים בקרבתך'
            }
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>מספרות בסביבתך</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.seeAll}>הכל</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal
        inverted={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {displaySalons.map((salon) => (
          <View key={salon.id} style={styles.cardContainer}>
            <SalonCard
              salon={salon}
              onPress={() => onSalonPress(salon)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

NearbySalonsList.displayName = 'NearbySalonsList';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontFamily: FontFamily.assistantBold,
    color: Color.black,
    textAlign: 'right',
  },
  seeAll: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: FontFamily.assistantBold,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'left',
  },
  listContainer: {
    paddingRight: 0,
    paddingLeft: 16,
  },
  cardContainer: {
    marginLeft: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default NearbySalonsList;