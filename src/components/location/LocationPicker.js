import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import CustomMarker from '../map/CustomMarker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LocationPicker = ({ onLocationSelected }) => {
  const [address, setAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add default Azrieli mall location
  const DEFAULT_LOCATION = {
    latitude: 32.0745963,
    longitude: 34.7918675,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Add Israel boundaries
  const ISRAEL_BOUNDS = {
    north: 33.33,    // Northern boundary
    south: 29.49,    // Southern boundary
    west: 34.23,     // Western boundary
    east: 35.90      // Eastern boundary
  };

  const isLocationInIsrael = (coords) => {
    return coords.latitude >= ISRAEL_BOUNDS.south &&
           coords.latitude <= ISRAEL_BOUNDS.north &&
           coords.longitude >= ISRAEL_BOUNDS.west &&
           coords.longitude <= ISRAEL_BOUNDS.east;
  };

  // Hebrew map style
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied, using default Azrieli mall location');
          setMapRegion(DEFAULT_LOCATION);
          setSelectedLocation(DEFAULT_LOCATION);
          return;
        }

        // Get current location if permission granted
        const location = await Location.getCurrentPositionAsync({});
        console.log('Retrieved location:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp).toLocaleString()
        });

        // Check if location is in Israel
        if (!isLocationInIsrael(location.coords)) {
          console.log('Location outside Israel, using default Azrieli mall location');
          setMapRegion(DEFAULT_LOCATION);
          setSelectedLocation(DEFAULT_LOCATION);
          return;
        }

        const currentRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };

        setMapRegion(currentRegion);
        setSelectedLocation(currentRegion);

        // Get address for the location
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: currentRegion.latitude,
            longitude: currentRegion.longitude
          });
          
          if (address) {
            const formattedAddress = [
              address.street,
              address.city,
              address.region,
              address.country
            ].filter(Boolean).join(', ');
            
            setAddress(formattedAddress);
            console.log('Current address:', formattedAddress);
          }
        } catch (error) {
          console.error('Error getting address:', error);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setMapRegion(DEFAULT_LOCATION);
        setSelectedLocation(DEFAULT_LOCATION);
      } finally {
        setLoading(false);
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

  const handleSelectLocation = async (location) => {
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

  // Update map region and marker when location is selected
  const onMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    
    if (!isLocationInIsrael(coords)) {
      alert('אנא בחר מיקום בתוך גבולות ישראל');
      return;
    }

    const newRegion = {
      ...coords,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    setMapRegion(newRegion);
    setSelectedLocation(coords);
    onLocationSelected(coords);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="הזן כתובת (לדוגמה: דיזנגוף 50, תל אביב)"
          value={address}
          onChangeText={searchAddress}
          placeholderTextColor={Color.grayscaleColorGray}
        />
        {loading && (
          <ActivityIndicator 
            style={styles.loadingIndicator} 
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
              onPress={() => handleSelectLocation(result)}
            >
              <Text style={styles.resultText}>{result.formattedAddress}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {mapRegion && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          customMapStyle={customMapStyle}
          zoomEnabled={true}
          scrollEnabled={true}
          showsScale={true}
          minZoomLevel={6}  // Minimum zoom level to show all of Israel
          maxZoomLevel={20} // Maximum zoom level for street detail
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
              }}
            >
              <CustomMarker title={address || "המיקום שלך"} />
            </Marker>
          )}
        </MapView>
      )}
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
    height: 45,
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontFamily: FontFamily.primaryFontRegular,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: Color.grayscaleColorLightGray,
    color: Color.grayscaleColorDarkGray,
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
  mapContainer: {
    width: '100%',
    height: 300,
    marginVertical: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  addressOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 5,
  },
  addressText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'center',
  },
});

export default LocationPicker;
