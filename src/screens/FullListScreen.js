import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import FullListView from '../components/common/FullListView';

const FullListScreen = ({ route }) => {
  const { title, data, type } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <FullListView
        title={title}
        data={data}
        type={type}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

export default FullListScreen;
