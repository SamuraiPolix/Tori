import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import CategoryItem from './CategoryItem';
import { CATEGORIES } from './categoriesData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CategoriesList = ({ onSelectCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryPress = (category) => {
    setSelectedCategory(category.type);
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>קטגוריות</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllButton}>הכל</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal
        inverted={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {CATEGORIES.map((category) => (
          <CategoryItem
            key={category.id}
            icon={category.icon}
            title={category.title}
            isSelected={selectedCategory === category.type}
            onPress={() => handleCategoryPress(category)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontFamily: FontFamily.assistantBold,
    color: Color.black,
    textAlign: 'right',
  },
  seeAllButton: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: FontFamily.assistantBold,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'left',
  },
  categoriesScroll: {
    paddingRight: 0,
    paddingLeft: 16,
  },
});

export default CategoriesList;