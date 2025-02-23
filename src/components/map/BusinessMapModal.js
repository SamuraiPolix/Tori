import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Color, FontFamily } from '../../styles/GlobalStyles';
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BusinessMapModal = ({ visible, onClose, businesses }) => {
  const initialRegion = {
    latitude: 31.7767,  // Center of Israel
    longitude: 35.2345,
    latitudeDelta: 4,
    longitudeDelta: 4,
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
            {businesses?.map((business, index) => (
              business.location && (
                <Marker
                  key={business.id || index}
                  coordinate={{
                    latitude: business.location.latitude,
                    longitude: business.location.longitude
                  }}
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
    height: SCREEN_HEIGHT * 0.75, // 3/4 of screen height
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Color.grayscaleColorLightGray,
    position: 'relative', // For absolute positioning of close button
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.primaryFontBold,
    fontSize: 18,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }], // Half of icon size
  },
  map: {
    flex: 1,
    width: '100%',
  },
});

export default BusinessMapModal;
