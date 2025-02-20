import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const category = await FirebaseApi.getHaircutCategory();
      
      if (!category) {
        setLoading(false);
        return;
      }

      const fetchedSalons = await FirebaseApi.getTopBusinesses(category.categoryId, 100);
      setAllSalons(fetchedSalons);
      setDisplaySalons(fetchedSalons.slice(0, 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salons:', error);
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchSalons
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
          <ActivityIndicator size="small" color={Color.primary} />
        </View>
      </View>
    );
  }

  if (!displaySalons.length) {
    return null;
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
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SalonsList;