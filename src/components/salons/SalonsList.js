import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import SalonCard from './SalonCard';
import SalonDetails from './SalonDetails';
import firestore from '@react-native-firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SalonsList = forwardRef(({ onSalonPress, onSeeAllPress }, ref) => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expose fetchSalons to parent through ref
  useImperativeHandle(ref, () => ({
    fetchSalons
  }));

  const fetchSalons = async () => {
    try {
      const salonsSnapshot = await firestore()
        .collection('businesses')
        .where('categories', 'array-contains', 1)
        .get();

      const salonsData = salonsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      // Sort by rating in memory
      const sortedSalons = salonsData
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10); // Show only top 10

      setSalons(sortedSalons);
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