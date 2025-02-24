import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useBusinesses } from '../hooks/useBusinesses';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Header } from '../components/common/Header';
import FirebaseApi from '../utils/FirebaseApi';
import { CATEGORIES } from '../components/categories/categoriesData';

const Map = ({ navigation }) => {
  const { businesses, loading, error } = useBusinesses();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const initialRegion = {
    latitude: 32.0853,  // Tel Aviv coordinates
    longitude: 34.7818,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await FirebaseApi.getCategories();
      const processedCategories = categoriesData.map(category => {
        const localCategory = CATEGORIES.find(cat => cat.id === category.categoryId);
        return {
          id: category.id,
          categoryId: category.categoryId,
          title: category.name,
          type: category.id,
        };
      });
      
      setCategories(processedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const filteredBusinesses = selectedCategory 
    ? businesses.filter(business => {
        console.log('Business categories:', business.categories);
        console.log('Selected category:', selectedCategory);
        return business.categories && 
               business.categories.includes(selectedCategory);
      })
    : businesses;

  const handleCategoryPress = (category) => {
    console.log('Category pressed:', category);
    setSelectedCategory(category.id === selectedCategory ? null : Number(category.id));
  };

  return (
    <View style={styles.container}>
      <Header 
        title="עסקים על המפה"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      {/* Categories Filter */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              !selectedCategory && styles.categoryButtonSelected
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryText,
              !selectedCategory && styles.categoryTextSelected
            ]}>הכל</Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonSelected
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextSelected
              ]}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading || loadingCategories ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
        >
          {filteredBusinesses?.map((business) => (
            business.location && (
              <Marker
                key={business.id}
                coordinate={{
                  latitude: business.location.latitude,
                  longitude: business.location.longitude
                }}
                pinColor={Color.primaryColorAmaranthPurple}
              >
                <Callout
                  onPress={() => navigation.navigate('SalonDetails', { business })}
                >
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{business.name}</Text>
                    <Text style={styles.calloutAddress}>{business.address}</Text>
                  </View>
                </Callout>
              </Marker>
            )
          ))}
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    backgroundColor: Color.grayscaleColorWhite,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonSelected: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: FontFamily.assistantSemiBold,
    color: '#64748B',
  },
  categoryTextSelected: {
    color: Color.grayscaleColorWhite,
  },
  callout: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 16,
    fontFamily: FontFamily.assistantSemiBold,
    color: Color.primaryColorAmaranthPurple,
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: '#64748B',
  },
});

export default Map;
