import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from "expo-image";
import { FontFamily, Color } from "../../styles/GlobalStyles";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CategoryItem = ({ icon, title, onPress, isSelected }) => (
  <TouchableOpacity 
    style={[styles.categoryItem, isSelected && styles.categoryItemSelected]} 
    onPress={onPress}
  >
    <View style={styles.imageWrapper}>
      <Image
        style={styles.categoryIcon}
        contentFit="fill"
        source={icon}
      />
      {isSelected && <View style={styles.selectedOverlay} />}
    </View>
    <Text style={[styles.categoryTitle, isSelected && styles.categoryTitleSelected]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  categoryItem: {
    width: SCREEN_WIDTH * 0.15,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  categoryItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  imageWrapper: {
    width: SCREEN_WIDTH * 0.15,
    height: SCREEN_WIDTH * 0.15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  categoryIcon: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Color.primaryColorAmaranthPurple,
    opacity: 0.3,
  },
  categoryTitle: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: FontFamily.assistantSemiBold,
    color: Color.grayscaleColorGray,
    textAlign: 'center',
  },
  categoryTitleSelected: {
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.assistantBold,
  },
});

export default CategoryItem;