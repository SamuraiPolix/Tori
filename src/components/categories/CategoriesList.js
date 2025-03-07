import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { FontFamily, Color } from "../../styles/GlobalStyles";
import CategoryItem from './CategoryItem';
import FirebaseApi from '../../utils/FirebaseApi';
import { CATEGORIES } from './categoriesData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const defaultCategoryIcon = require('../../assets/rectangle-406.png');

const CategoriesList = ({ onSelectCategory, navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await FirebaseApi.getCategories();
      const processedCategories = categoriesData.map(category => {
        const localCategory = CATEGORIES.find(cat => cat.id === category.categoryId);
        return {
          id: category.id,
          categoryId: category.categoryId,
          title: category.name,
          type: category.id,
          icon: localCategory ? localCategory.icon : defaultCategoryIcon
        };
      });
      
      setCategories(processedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category.type);
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  const handleViewAll = () => {
    navigation.navigate('FullList', {
      title: 'כל הקטגוריות',
      data: categories,
      type: 'category'
    });
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>קטגוריות</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Color.primaryColorAmaranthPurple} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>קטגוריות</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.seeAllButton}>הכל</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal
        inverted={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categories.map((category) => (
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
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CategoriesList;