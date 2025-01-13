import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontFamily, Color } from "../../styles/GlobalStyles";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LocationPicker = ({ onLocationSelected }) => {
  const [address, setAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // Get initial location (Tel Aviv as default)
      setMapRegion({
        latitude: 32.0853,
        longitude: 34.7818,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  const searchAddress = async (text) => {
    setAddress(text);
    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      // Add "Israel" to the search query to improve results
      const results = await Location.geocodeAsync(text + ", Israel");
      if (results.length > 0) {
        // Get full address for each result
        const detailedResults = await Promise.all(
          results.slice(0, 5).map(async (result) => {
            const [addressInfo] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });
            
            const formattedAddress = [
              addressInfo.street,
              addressInfo.streetNumber,
              addressInfo.city,
              addressInfo.region,
              "Israel"
            ].filter(Boolean).join(', ');

            return {
              ...result,
              formattedAddress
            };
          })
        );
        setSearchResults(detailedResults);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = async (location) => {
    try {
      setSelectedLocation(location);
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSearchResults([]); // Clear search results

      // Get address for selected coordinates if not provided
      const addressToUse = location.formattedAddress || (await getFormattedAddress(location));
      setAddress(addressToUse);

      // Pass back both address and coordinates
      onLocationSelected({
        address: addressToUse,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });
    } catch (error) {
      console.error('Error selecting location:', error);
    }
  };

  const getFormattedAddress = async (location) => {
    const [addressInfo] = await Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    return [
      addressInfo.street,
      addressInfo.streetNumber,
      addressInfo.city,
      addressInfo.region,
      "Israel"
    ].filter(Boolean).join(', ');
  };

  const onMapPress = (e) => {
    selectLocation(e.nativeEvent.coordinate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="הזן כתובת"
          value={address}
          onChangeText={searchAddress}
          textAlign="right"
        />
        {loading && (
          <ActivityIndicator 
            style={styles.loadingIndicator} 
            size="small" 
            color={Color.primaryColorAmaranthPurple} 
          />
        )}
      </View>

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultItem}
              onPress={() => selectLocation(result)}
            >
              <Text style={styles.resultText}>
                {result.formattedAddress}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {mapRegion && (
        <MapView
          style={styles.map}
          region={mapRegion}
          onPress={onMapPress}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
              }}
            />
          )}
        </MapView>
      )}

      <Text style={styles.helpText}>
        חפש כתובת או לחץ על המפה לבחירת מיקום מדויק
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Color.grayscaleColorLightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: Color.grayscaleColorWhite,
    fontFamily: FontFamily.assistant,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
  },
  resultsContainer: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Color.grayscaleColorLightGray,
  },
  resultText: {
    fontFamily: FontFamily.assistant,
    textAlign: 'right',
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 10,
  },
  helpText: {
    fontFamily: FontFamily.assistant,
    color: Color.grayscaleColorGray,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LocationPicker;
