import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import SalonCard from './SalonCard';
import firestore from '@react-native-firebase/firestore';
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
      const categorySnapshot = await firestore()
        .collection('categories')
        .where('name', '==', 'תספורת')
        .get();

      if (categorySnapshot.empty) {
        console.log('❌ No haircut category found');
        setLoading(false);
        return;
      }

      const categoryData = categorySnapshot.docs[0].data();
      console.log('✅ Found category:', {
        id: categorySnapshot.docs[0].id,
        data: categoryData
      });

      const categoryId = categoryData.categoryId;
      console.log('🏷️ Using categoryId:', categoryId);

      // 3. Get businesses with this category
      console.log('4. Fetching businesses...');
      const businessesSnapshot = await firestore()
        .collection('businesses')
        .where('categories', 'array-contains', categoryId)
        .get();

      console.log(`📋 Found ${businessesSnapshot.docs.length} businesses`);
      console.log('Business details:');
      businessesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Business ${index + 1}:`, {
          id: doc.id,
          name: data.name,
          hasLocation: !!data.location,
          coordinates: data.location ? {
            lat: data.location.latitude,
            lng: data.location.longitude
          } : 'No location data'
        });
      });

      // 4. Calculate distances and map business data
      console.log('5. Calculating distances...');
      const businessesWithDistance = businessesSnapshot.docs.map(doc => {
        const data = doc.data();
        let distance = null;

        if (data.location?.latitude && data.location?.longitude) {
          distance = getDistance(
            { 
              latitude: currentLocation.coords.latitude, 
              longitude: currentLocation.coords.longitude 
            },
            { 
              latitude: data.location.latitude, 
              longitude: data.location.longitude 
            }
          ) / 1000;
        }

        return {
          id: doc.id,
          about: data.about || '',
          address: data.address || '',
          businessId: doc.id,
          businessPhone: data.businessPhone || '',
          categories: data.categories || [],
          createdAt: data.createdAt || null,
          email: data.email || '',
          images: data.images || [],
          name: data.name || '',
          ownerName: data.ownerName || '',
          ownerPhone: data.ownerPhone || '',
          rating: typeof data.rating === 'number' ? data.rating : 0,
          reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 0,
          scheduleSettings: {
            allowCancellation: data.scheduleSettings?.allowCancellation || false,
            allowSameDayBooking: data.scheduleSettings?.allowSameDayBooking || false,
            autoApprove: data.scheduleSettings?.autoApprove || false,
            cancellationTimeLimit: data.scheduleSettings?.cancellationTimeLimit || 0,
            maxFutureBookingDays: data.scheduleSettings?.maxFutureBookingDays || 30,
            minTimeBeforeBooking: data.scheduleSettings?.minTimeBeforeBooking || 0,
            slotDuration: data.scheduleSettings?.slotDuration || 30
          },
          services: (data.services || []).map(service => ({
            duration: service.duration || 30,
            id: service.id || '',
            name: service.name || '',
            price: service.price || 0
          })),
          settings: {
            allowOnlineBooking: data.settings?.allowOnlineBooking || false,
            autoConfirm: data.settings?.autoConfirm || false,
            notificationsEnabled: data.settings?.notificationsEnabled || false,
            reminderTime: data.settings?.reminderTime || 60
          },
          updatedAt: data.updatedAt || null,
          workingHours: data.workingHours || {
            sunday: { close: '', isOpen: false, open: '' },
            monday: { close: '', isOpen: false, open: '' },
            tuesday: { close: '', isOpen: false, open: '' },
            wednesday: { close: '', isOpen: false, open: '' },
            thursday: { close: '', isOpen: false, open: '' },
            friday: { close: '', isOpen: false, open: '' },
            saturday: { close: '', isOpen: false, open: '' }
          },
          distance: distance
        };
      });

      console.log('Mapped business data:', businessesWithDistance[0]);

      // 5. Sort by distance and filter out businesses without location
      const sortedBusinesses = businessesWithDistance
        .filter(b => b.distance !== null)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10); // Show only closest 10 businesses

      console.log('6. Final sorted businesses:');
      sortedBusinesses.forEach((business, index) => {
        console.log(`${index + 1}. ${business.name} - ${business.distance.toFixed(2)}km`);
      });

      setSalons(sortedBusinesses);
      console.log('=== Finished fetching nearby salons ===');
    } catch (error) {
      console.error('❌ Error fetching nearby salons:', error);
      setErrorMsg('Error fetching nearby salons');
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