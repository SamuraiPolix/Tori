import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from "expo-image";
import { FontFamily, Color } from "../../styles/GlobalStyles";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

const SalonCard = ({ salon, onPress }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);

  const formatDistance = (distance) => {
    if (distance < 1) {
      // אם המרחק קטן מקילומטר, נציג במטרים
      return `${(distance * 1000).toFixed(0)}מ'`;
    }
    // אחרת נציג בקילומטרים עם ספרה אחת אחרי הנקודה
    return `${distance.toFixed(1)}ק"מ`;
  };

  const handleFavoritePress = (event) => {
    event.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={handleFavoritePress}
      >
        <Ionicons 
          name={isFavorite ? "heart" : "heart-outline"} 
          size={24} 
          color={isFavorite ? "#FF4B6E" : "#666666"} 
        />
      </TouchableOpacity>
      <View style={styles.imageContainer}>
        <Image source={salon.image} style={styles.image} contentFit="cover" />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{salon.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{salon.rating}</Text>
            <Text style={styles.reviewsText}>({salon.reviewsCount} ביקורות)</Text>

          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666666" />
            <Text style={styles.location}>{formatDistance(salon.distance)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: CARD_WIDTH,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontFamily: FontFamily.assistantSemiBold,
    color: Color.grayscaleColorBlack,
  },
  location: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: "#666666",
  },
  reviewsText: {
    fontSize: 12,
    fontFamily: FontFamily.assistantRegular,
    color: "#666666",
    textAlign: 'right',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default SalonCard;