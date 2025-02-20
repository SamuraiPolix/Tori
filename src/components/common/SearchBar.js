import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Image } from "expo-image";
import { FontFamily } from "../../styles/GlobalStyles";
import FirebaseApi from '../../utils/FirebaseApi';

const SearchBar = ({ onFilterPress, onBusinessSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleTextChange = async (text) => {
    setSearchText(text);
    
    if (text.length > 0) {
      // Get businesses that match the search text
      const results = await FirebaseApi.searchBusinesses(text);
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
      setIsDropdownVisible(true);
    } else {
      setSearchResults([]);
      setIsDropdownVisible(false);
    }
  };

  const handleBusinessSelect = (business) => {
    setSearchText(business.name);
    setIsDropdownVisible(false);
    if (onBusinessSelect) {
      onBusinessSelect([business], 'חיפוש');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
          <Image source={require("../../assets/ic--setting.png")} style={styles.filterIcon} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="מה תרצו לחפש?"
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => searchText.length > 0 && setIsDropdownVisible(true)}
        />
      </View>

      {isDropdownVisible && searchResults.length > 0 && (
        <View style={styles.dropdownContainer}>
          <ScrollView style={styles.resultsScroll} keyboardShouldPersistTaps="handled">
            {searchResults.map((business) => (
              <TouchableOpacity
                key={business.id}
                style={styles.resultItem}
                onPress={() => handleBusinessSelect(business)}
              >
                <Text style={styles.resultText}>{business.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: '100%',
    textAlign: 'right',
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  resultsScroll: {
    maxHeight: 200,
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    textAlign: 'right',
  },
  filterButton: {
    padding: 5,
  },
  filterIcon: {
    width: 24,
    height: 24,
  },
});

export default SearchBar;