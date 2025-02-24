import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useBusinesses } from '../hooks/useBusinesses';
import { Color } from '../styles/GlobalStyles';
import { Header } from '../components/common/Header';

const Map = ({ navigation }) => {
  const { businesses, loading, error } = useBusinesses();
  
  const initialRegion = {
    latitude: 32.0853,  // Tel Aviv coordinates
    longitude: 34.7818,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <Header 
        title="עסקים על המפה"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
        >
          {businesses?.map((business) => (
            business.location && (
              <Marker
                key={business.id}
                coordinate={{
                  latitude: business.location.latitude,
                  longitude: business.location.longitude
                }}
                title={business.name}
                description={business.address}
                onPress={() => navigation.navigate('SalonDetails', { business })}
              />
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
  }
});

export default Map;
