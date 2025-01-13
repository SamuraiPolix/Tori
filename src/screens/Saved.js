import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, I18nManager, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/common/BottomNavigation';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const Saved = ({ navigation }) => {
  const [savedBusinesses, setSavedBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSavedBusinesses();
  }, []);

  const fetchSavedBusinesses = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      // Get user's favorites
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const favorites = userDoc.data()?.favorites || [];

      if (favorites.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch business details for each favorite
      const businessesPromises = favorites.map(businessId =>
        firestore()
          .collection('businesses')
          .doc(businessId)
          .get()
      );

      const businessesSnapshots = await Promise.all(businessesPromises);
      const businessesData = businessesSnapshots
        .filter(doc => doc.exists)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          image: { uri: doc.data().images?.[0] || '' }
        }));

      setSavedBusinesses(businessesData);
    } catch (error) {
      console.error('Error fetching saved businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (businessId) => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          favorites: firestore.FieldValue.arrayRemove(businessId)
        });

      // Update local state
      setSavedBusinesses(prev => prev.filter(business => business.id !== businessId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleBookAppointment = (business) => {
    navigation.navigate('SalonDetails', { 
      business,
      initialTab: 'services'  
    });
  };

  const renderBusinessCard = ({ item }) => (
    <TouchableOpacity style={styles.businessCard}>
      <Image
        source={item.image}
        style={styles.businessImage}
        contentFit="cover"
      />
      <View style={styles.businessContent}>
        <View style={styles.businessHeader}>
          <View>
            <Text style={styles.businessName}>{item.name}</Text>
            <Text style={styles.categoryText}>{item.businessType || 'עסק'}</Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton} onPress={() => handleRemoveFavorite(item.id)}>
            <Ionicons name="heart" size={20} color={Color.primaryColorAmaranthPurple} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.rating || '0'} ({item.reviewsCount || '0'})
            </Text>
          </View>
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={16} color={Color.grayscaleColorSpanishGray} />
            <Text style={styles.distanceText}>{item.address || 'כתובת לא זמינה'}</Text>
          </View>
        </View>

        <View style={styles.servicesContainer}>
          {(item.services || []).slice(0, 3).map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceText}>{service.name}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={() => handleBookAppointment(item)}>
          <Text style={styles.bookButtonText}>קביעת תור</Text>
          <Ionicons name="calendar-outline" size={18} color={Color.grayscaleColorWhite} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={Color.primaryColorAmaranthPurple} />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>המועדפים שלי</Text>
            <Text style={styles.headerSubtitle}>✨ העסקים שאת.ה הכי אוהב.ת ✨</Text>
          </View>

          <FlatList
            data={savedBusinesses}
            renderItem={renderBusinessCard}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          />

          <BottomNavigation 
            activeTab="saved"
            onTabPress={(tabId) => {
              if (tabId !== 'saved') {
                const screens = {
                  home: 'Home',
                  appointments: 'MyAppointments',
                  profile: 'Profile',
                };
                if (screens[tabId]) {
                  navigation.navigate(screens[tabId]);
                }
              }
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: Color.primaryColorAmaranthPurple,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorWhite,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorWhite,
    marginTop: 4,
    opacity: 0.9,
  },
  content: {
    padding: 16,
    paddingBottom: 70,
  },
  businessCard: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    width: '100%',
  },
  businessImage: {
    width: 100,
    height: 140,
  },
  businessContent: {
    flex: 1,
    padding: 12,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 13,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    flex: 1,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  serviceTag: {
    backgroundColor: Color.colorGainsboro,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 12,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  bookButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 'auto',
  },
  bookButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorWhite,
    marginRight: 6,
  },
});

export default Saved;
