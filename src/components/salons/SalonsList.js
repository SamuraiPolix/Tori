import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import SalonCard from './SalonCard';
import SalonDetails from './SalonDetails';
import FirebaseApi from '../../utils/FirebaseApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SalonsList = forwardRef(({ onSalonPress, navigation }, ref) => {
  const [allSalons, setAllSalons] = useState([]);
  const [displaySalons, setDisplaySalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState(null);

  const applyFiltersToSalons = useCallback((salons, filters) => {
    if (!filters || !salons) return salons;

    return salons.filter(salon => {
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

  const fetchSalons = async () => {
    try {
      setLoading(true);
      console.log('Fetching salons...');
      
      const fetchedSalons = await FirebaseApi.getTopBusinesses(1, 100); // Using categoryId 1 for תספורת
      console.log('Fetched salons:', fetchedSalons);
      
      setAllSalons(fetchedSalons);
      
      // Apply current filters if they exist
      const filteredSalons = currentFilters 
        ? applyFiltersToSalons(fetchedSalons, currentFilters)
        : fetchedSalons;
      
      setDisplaySalons(filteredSalons.slice(0, 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salons:', error);
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchSalons,
    updateBusiness: (updatedBusiness) => {
      setAllSalons(prevSalons => 
        prevSalons.map(salon => {
          if (salon.id === updatedBusiness.id) {
            return updatedBusiness;
          }
          return salon;
        })
      );
      setDisplaySalons(prevSalons => 
        prevSalons.map(salon => {
          if (salon.id === updatedBusiness.id) {
            return updatedBusiness;
          }
          return salon;
        })
      );
    },
    applyFilters: (filters) => {
      console.log('Applying filters to top salons:', filters);
      setCurrentFilters(filters);
      const filteredSalons = applyFiltersToSalons(allSalons, filters);
      console.log('Filtered top salons:', filteredSalons.length);
      setDisplaySalons(filteredSalons.slice(0, 10));
    }
  }));

  useEffect(() => {
    fetchSalons();
  }, []);

  const handleViewAll = () => {
    navigation.navigate('FullList', {
      title: 'כל העסקים',
      data: allSalons.map(salon => ({ ...salon, fullData: true })),
      type: 'salon'
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>מספרות מובילות</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Color.primaryColorAmaranthPurple} />
        </View>
      </View>
    );
  }

  if (!displaySalons.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>מספרות מובילות</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>לא נמצאו תוצאות מתאימות לפילטרים שנבחרו</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>מספרות מובילות</Text>
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

SalonsList.displayName = 'SalonsList';

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

export default SalonsList;