import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Color, FontFamily } from '../../styles/GlobalStyles';
import { Ionicons } from "@expo/vector-icons";
import { CATEGORIES } from '../categories/categoriesData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BusinessMapModal = ({ visible, onClose, businesses }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const initialRegion = {
    latitude: 32.0745963,  // Tel Aviv center
    longitude: 34.7918675,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  const customMapStyle = [
    {
      "elementType": "labels",
      "stylers": [
        {
          "language": "he"
        }
      ]
    }
  ];

  const filteredBusinesses = selectedCategory 
    ? businesses?.filter(business => business.categories?.includes(selectedCategory))
    : businesses;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>כל העסקים על המפה</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Color.primaryColorAmaranthPurple} />
            </TouchableOpacity>
          </View>

          {/* Categories Container */}
          <View style={styles.categoriesMainContainer}>
            {/* First Row */}
            <View style={styles.categoryRow}>
              <TouchableOpacity 
                style={[styles.categoryButton, !selectedCategory && styles.selectedCategory]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryText, !selectedCategory && styles.selectedCategoryText]}>הכל</Text>
              </TouchableOpacity>
              {CATEGORIES.slice(0, 5).map((category) => (
                <TouchableOpacity 
                  key={category.id}
                  style={[styles.categoryButton, selectedCategory === category.id && styles.selectedCategory]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Image source={category.icon} style={styles.categoryIcon} />
                  <Text style={[styles.categoryText, selectedCategory === category.id && styles.selectedCategoryText]}>
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Second Row */}
            <View style={styles.categoryRow}>
              {CATEGORIES.slice(5).map((category) => (
                <TouchableOpacity 
                  key={category.id}
                  style={[styles.categoryButton, selectedCategory === category.id && styles.selectedCategory]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Image source={category.icon} style={styles.categoryIcon} />
                  <Text style={[styles.categoryText, selectedCategory === category.id && styles.selectedCategoryText]}>
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Map */}
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            customMapStyle={customMapStyle}
            zoomEnabled={true}
            scrollEnabled={true}
            showsScale={true}
            minZoomLevel={6}
            maxZoomLevel={20}
          >
            {filteredBusinesses?.map((business, index) => (
              business.location && (
                <Marker
                  key={business.id || index}
                  coordinate={{
                    latitude: business.location.latitude,
                    longitude: business.location.longitude
                  }}
                  title={business.name}
                  description={business.categories?.map(catId => 
                    CATEGORIES.find(c => c.id === catId)?.title
                  ).filter(Boolean).join(', ')}
                  pinColor={Color.primaryColorAmaranthPurple}
                />
              )
            ))}
          </MapView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 15,
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Color.grayscaleColorGray200,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.rubikBold,
    color: Color.grayscaleColorBlack,
  },
  closeButton: {
    position: 'absolute',
    left: 15,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  categoriesMainContainer: {
    backgroundColor: Color.grayscaleColorWhite,
    paddingVertical: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Color.grayscaleColorGray200,
    marginVertical: 4,
    marginHorizontal: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 20,
    backgroundColor: Color.grayscaleColorWhite,
    borderWidth: 1,
    borderColor: Color.grayscaleColorGray300,
  },
  selectedCategory: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  categoryIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: FontFamily.rubikRegular,
    color: Color.grayscaleColorBlack,
  },
  selectedCategoryText: {
    color: Color.grayscaleColorWhite,
  },
});

export default BusinessMapModal;
