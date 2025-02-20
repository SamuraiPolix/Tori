import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TextInput,
  FlatList,
  Modal,
  Image as RNImage,
  Platform
} from 'react-native';
import { Image } from "expo-image";
import { FontFamily, Color } from "../../styles/GlobalStyles";
import { CATEGORIES } from '../categories/categoriesData';
import FirebaseApi from '../../utils/FirebaseApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SearchBar = ({ onPress, onFilterPress, onBusinessSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    // Load businesses only once when component mounts
    const loadBusinesses = async () => {
      const businessesData = await FirebaseApi.getAllBusinesses();
      setBusinesses(businessesData);
    };
    loadBusinesses();
  }, []);

  const handleFocus = () => {
    setIsDropdownVisible(true);
    setSearchResults([]); // Clear previous search results
    setSelectedCategory(null);
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (!text) {
      setSearchResults([]);
      return;
    }

    // Search businesses that match the text
    const results = businesses
      .filter(business => 
        business.name.toLowerCase().startsWith(text.toLowerCase()))
      .slice(0, 5); // Show only first 5 results
    
    setSearchResults(results);
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setIsDropdownVisible(false);
    setSearchText('');
    
    // Get businesses for this category using Firebase
    const businessesForCategory = await FirebaseApi.getBusinessesByCategory(category.id);
    
    if (onBusinessSelect) {
      onBusinessSelect(businessesForCategory, category.title);
    }
  };

  const handleBusinessSelect = (business) => {
    setIsDropdownVisible(false);
    setSearchText('');
    if (onBusinessSelect) {
      onBusinessSelect([business], 'תוצאות חיפוש');
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(item)}
    >
      <RNImage source={item.icon} style={styles.categoryIcon} />
      <Text style={styles.categoryText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.businessItem}
      onPress={() => handleBusinessSelect(item)}
    >
      <Text style={styles.businessText}>{item.name}</Text>
      <Text style={styles.businessAddress}>{item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.searchContainer}>
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={onFilterPress}
      >
        <Image
          style={styles.filterIcon}
          contentFit="cover"
          source={require("../../assets/ic--setting.png")}
        />
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="מה תרצו לחפש?"
          value={searchText}
          onChangeText={handleSearch}
          onFocus={handleFocus}
          placeholderTextColor="#999"
        />
      </View>

      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            {searchText ? (
              <FlatList
                data={searchResults}
                renderItem={renderBusinessItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.dropdownList}
              />
            ) : (
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategoryItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.dropdownList}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 15,
    padding: 12,
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    textAlign: 'right',
    padding: 0,
    color: '#000',
  },
  filterButton: {
    padding: 8,
  },
  filterIcon: {
    width: 24,
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    backgroundColor: Color.grayscaleColorWhite,
    marginTop: Platform.OS === 'ios' ? 120 : 100,
    marginHorizontal: 16,
    borderRadius: 15,
    maxHeight: SCREEN_WIDTH * 0.8,
    overflow: 'hidden',
  },
  dropdownList: {
    padding: 8,
  },
  categoryItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    marginLeft: 12,
  },
  categoryText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
  },
  businessItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  businessText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
  },
  businessAddress: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default SearchBar;