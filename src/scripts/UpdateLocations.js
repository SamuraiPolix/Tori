import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FirebaseApi from '../utils/FirebaseApi';

const UpdateLocations = () => {
  useEffect(() => {
    const updateLocations = async () => {
      try {
        console.log('Starting location update...');
        const result = await FirebaseApi.updateBusinessesWithoutLocation();
        console.log('Update completed:', result);
      } catch (error) {
        console.error('Update failed:', error);
      }
    };

    updateLocations();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Updating business locations...</Text>
      <Text style={styles.text}>Check console for progress.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
});

export default UpdateLocations;
