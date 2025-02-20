import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import { useNavigation } from '@react-navigation/native';
import FirebaseApi from '../../utils/FirebaseApi';

const FullListView = ({ title, data, type }) => {
  const navigation = useNavigation();

  const renderItem = ({ item }) => {
    const handlePress = async () => {
      if (type === 'category') {
        navigation.navigate('CategoryDetails', { category: item });
      } else if (type === 'salon') {
        navigation.navigate('SalonDetails', { business: item });
      }
    };

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={handlePress}
      >
        <View style={styles.imageContainer}>
          <Image
            source={
              item.image?.uri || item.images?.[0]
                ? { uri: item.image?.uri || item.images[0] }
                : require('../../assets/rectangle-67.png')
            }
            style={styles.image}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          {type === 'salon' && (
            <>
              <Text style={styles.itemAddress}>{item.address}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {item.rating || '0'}</Text>
                <Text style={styles.reviews}>
                  ({item.reviewsCount || '0'} ביקורות)
                </Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.businessId}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1E293B',
    padding: 16,
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'right',
  },
  itemAddress: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'right',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  rating: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#F59E0B',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
  },
});

export default FullListView;
