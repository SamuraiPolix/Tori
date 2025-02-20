import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import SalonCard from './SalonCard';
import SalonDetails from './SalonDetails';
import FirebaseApi from '../../utils/FirebaseApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SalonsList = forwardRef(({ onSalonPress, onSeeAllPress }, ref) => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expose fetchSalons to parent through ref
  // We use it to expose the fetchSalons function to the parent component, so that the parent
  // can call fetchSalons whenever it wants.
  useImperativeHandle(ref, () => ({
    fetchSalons,
    updateBusiness: (updatedBusiness) => {
      setSalons(prevSalons => 
        prevSalons.map(salon => 
          salon.id === updatedBusiness.id ? updatedBusiness : salon
        )
      );
    }
  }));

  const fetchSalons = async () => {
    try {
      const category = await FirebaseApi.getHaircutCategory();
      if (!category) {
        console.error('No haircut category found');
        return;
      }

      const topSalons = await FirebaseApi.getTopBusinesses(category.categoryId, 10);
      setSalons(topSalons);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>מספרות מובילות</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Color.primary} />
        </View>
      </View>
    );
  }

  if (salons.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>מספרות מובילות</Text>
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
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SalonsList;