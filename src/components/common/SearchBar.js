import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Image } from "expo-image";
import { FontFamily } from "../../styles/GlobalStyles";
import FirebaseApi from '../../utils/FirebaseApi';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const SearchBar = ({ onFilterPress, onBusinessSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Reset search when screen loses focus
  useEffect(() => {
    if (!isFocused) {
      setSearchText('');
      setSearchResults([]);
      setIsDropdownVisible(false);
    }
  }, [isFocused]);

  // Add keyboard hide listener
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsDropdownVisible(false);
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

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
    if (onBusinessSelect) {
      onBusinessSelect([business], 'חיפוש');
    }
    // Clear search after selection
    setSearchText('');
    setSearchResults([]);
    setIsDropdownVisible(false);
    Keyboard.dismiss();
  };

  const getHighlightedText = (text, highlight) => {
    if (!text || !highlight) return text;
    const parts = text.toLowerCase().split(highlight.toLowerCase());
    const result = [];
    let lastIndex = 0;
    
    parts.forEach((part, i) => {
      const startIndex = lastIndex;
      const endIndex = startIndex + part.length;
      result.push(text.slice(startIndex, endIndex));
      
      if (i !== parts.length - 1) {
        const matchStart = endIndex;
        const matchEnd = matchStart + highlight.length;
        result.push(
          <Text key={i} style={styles.highlightText}>
            {text.slice(matchStart, matchEnd)}
          </Text>
        );
      }
      lastIndex = endIndex + highlight.length;
    });
    
    return result;
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      setIsDropdownVisible(false);
      Keyboard.dismiss();
    }}>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View>
            <View style={styles.searchContainer}>
              <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
                <Image source={require("../../assets/ic--setting.png")} style={styles.filterIcon} />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="חפש לפי שם עסק או כתובת..."
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
                      <Text style={styles.resultName}>
                        {getHighlightedText(business.name, searchText)}
                      </Text>
                      {(business.address || business.city) && (
                        <Text style={styles.resultAddress}>
                          {getHighlightedText(
                            `${business.address || ''} ${business.city || ''}`.trim(),
                            searchText
                          )}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
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
  resultName: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    textAlign: 'right',
  },
  resultAddress: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  highlightText: {
    backgroundColor: '#FFE4B5',
    color: '#000',
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