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
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          // Set default location (Tel Aviv) if permission denied
          setMapRegion({
            latitude: 32.0853,
            longitude: 34.7818,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          return;
        }

        // Get current location if permission granted
        const location = await Location.getCurrentPositionAsync({});
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        
      } catch (error) {
        console.error('Error getting location:', error);
        // Set default location (Tel Aviv) on error
        setMapRegion({
          latitude: 32.0853,
          longitude: 34.7818,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
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
      
      // Check permissions before geocoding
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          console.log('Location permission denied');
          return;
        }
      }

      // Try different search variations to get more results
      const searchQueries = [
        `${text}, ישראל`,
        `${text}`,
        `${text} רחוב, ישראל`,
      ];

      let allResults = [];
      for (const query of searchQueries) {
        const results = await Location.geocodeAsync(query);
        allResults = [...allResults, ...results];
      }

      // Remove duplicates based on coordinates
      allResults = allResults.filter((result, index, self) =>
        index === self.findIndex((r) => 
          r.latitude === result.latitude && r.longitude === result.longitude
        )
      );

      console.log('Number of results found:', allResults.length);

      if (allResults.length > 0) {
        // Get full address for each result
        const detailedResults = await Promise.all(
          allResults.slice(0, 10).map(async (result) => {
            try {
              const [addressInfo] = await Location.reverseGeocodeAsync(
                {
                  latitude: result.latitude,
                  longitude: result.longitude,
                },
                {
                  language: "he"
                }
              );
              
              const formattedAddress = [
                addressInfo.street,
                addressInfo.streetNumber,
                addressInfo.city,
                addressInfo.region,
                "ישראל"
              ].filter(Boolean).join(', ');

              console.log('Found address:', formattedAddress);

              return {
                ...result,
                formattedAddress
              };
            } catch (error) {
              console.error('Error getting address details:', error);
              return null;
            }
          })
        );

        // Filter out any null results from errors
        const validResults = detailedResults.filter(result => result !== null);
        console.log('Number of valid results:', validResults.length);
        
        // Remove duplicates based on formatted address
        const uniqueResults = validResults.filter((result, index, self) =>
          index === self.findIndex((r) => 
            r.formattedAddress === result.formattedAddress
          )
        );

        setSearchResults(uniqueResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchResults([]);
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
    const [addressInfo] = await Location.reverseGeocodeAsync(
      {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      {
        language: "he"
      }
    );

    return [
      addressInfo.street,
      addressInfo.streetNumber,
      addressInfo.city,
      addressInfo.region,
      "ישראל"
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
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 300, // Increased height to show more results
    overflow: 'scroll',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#1e293b',
    textAlign: 'right',
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
});

export default LocationPicker;
