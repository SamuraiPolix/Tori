import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import SalonCard from './SalonCard';
import FirebaseApi from '../../utils/FirebaseApi';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

const SCREEN_WIDTH = Dimensions.get('window').width;

const NearbySalonsList = forwardRef(({ onSalonPress, onSeeAllPress }, ref) => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Expose fetchNearbySalons to parent through ref
  useImperativeHandle(ref, () => ({
    fetchNearbySalons
  }));

  useEffect(() => {
    fetchNearbySalons();
  }, []);

  const fetchNearbySalons = async () => {
    try {
      console.log('=== Starting to fetch nearby salons ===');
      
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
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10); // Show only closest 10

      console.log('✅ Processed businesses:', {
        total: businesses.length,
        withLocation: businessesWithDistance.filter(b => b.distance !== null).length,
        displayed: sortedBusinesses.length
      });

      setSalons(sortedBusinesses);
    } catch (error) {
      console.error('Error fetching nearby salons:', error);
      setErrorMsg('Error fetching salons');
    } finally {
      setLoading(false);
    }
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

  if (errorMsg || salons.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>מספרות בסביבתך</Text>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAll}>הכל</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal
        inverted={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {salons.map((salon) => (
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
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default NearbySalonsList;