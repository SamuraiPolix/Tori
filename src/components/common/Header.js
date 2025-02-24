import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Color, FontFamily } from '../../styles/GlobalStyles';

export const Header = ({ title, onBackPress, showBackButton = true }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBackPress}
          >
            <Ionicons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Text style={[
          styles.title,
          { marginRight: showBackButton ? 32 : 0 }
        ]}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    paddingTop: 44,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginLeft: 8,
  },
  title: {
    flex: 1,
    color: 'white',
    fontSize: 20,
    fontFamily: FontFamily.assistantSemiBold,
    textAlign: 'center',
  },
});
