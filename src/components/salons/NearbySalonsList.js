import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import SalonCard from './SalonCard';
import FirebaseApi from '../../utils/FirebaseApi';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

const SCREEN_WIDTH = Dimensions.get('window').width;

const NearbySalonsList = forwardRef(({ onSalonPress, navigation }, ref) => {
  const [allSalons, setAllSalons] = useState([]);
  const [displaySalons, setDisplaySalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentFilters, setCurrentFilters] = useState(null);

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

      console.log('2. Getting current location...');
      const currentLocation = await Location.getCurrentPositionAsync({});
      console.log('📍 Current location:', {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        timestamp: new Date(currentLocation.timestamp).toLocaleString()
      });

      // 2. Get haircut category ID
      console.log('3. Fetching haircut category...');
      const category = await FirebaseApi.getHaircutCategory();
      if (!category) {
        console.log('❌ No haircut category found');
        setLoading(false);
        return;
      }

      console.log('✅ Found category:', category);
      const categoryId = category.categoryId;
      console.log('🏷️ Using categoryId:', categoryId);

      // 3. Get businesses with this category
      console.log('4. Fetching businesses...');
      const businesses = await FirebaseApi.getBusinessesByCategory(categoryId);
      console.log(`📋 Found ${businesses.length} businesses`);
      console.log('Business details:');
      businesses.forEach((business, index) => {
        console.log(`Business ${index + 1}:`, {
          id: business.id,
          name: business.name,
          hasLocation: !!business.location,
          coordinates: business.location ? {
            lat: business.location.latitude,
            lng: business.location.longitude
          } : 'No location data'
        });
      });

      // 4. Calculate distances and map business data
      console.log('5. Calculating distances...');
      const businessesWithDistance = businesses.map(business => {
        let distance = null;

        if (business.location?.latitude && business.location?.longitude) {
          distance = getDistance(
            { 
              latitude: currentLocation.coords.latitude, 
              longitude: currentLocation.coords.longitude 
            },
            {
              latitude: business.location.latitude,
              longitude: business.location.longitude
            }
          ) / 1000; // Convert to kilometers
        }

        return {
          ...business,
          distance
        };
      });

      // 5. Sort by distance and filter out businesses without location
      const sortedBusinesses = businessesWithDistance
        .filter(business => business.distance !== null)
        .sort((a, b) => a.distance - b.distance);

      setAllSalons(sortedBusinesses);
      setDisplaySalons(sortedBusinesses.slice(0, 10));
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