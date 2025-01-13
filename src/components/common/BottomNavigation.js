import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, I18nManager } from 'react-native';
import { Image } from "expo-image";
import { FontFamily, Color } from "../../styles/GlobalStyles";

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const navigationItems = [
  {
    id: 'home',
    icon: require('../../assets/ic--home-bold.png'),
    activeIcon: require('../../assets/ic--home-bold.png'),
    label: 'בית'
  },
  {
    id: 'appointments',
    icon: require('../../assets/ic--calendar.png'),
    activeIcon: require('../../assets/ic--calendar.png'),
    label: 'התורים שלי'
  },
  {
    id: 'saved',
    icon: require('../../assets/ic--save.png'),
    activeIcon: require('../../assets/ic--save.png'),
    label: 'מועדפים'
  },
  {
    id: 'profile',
    icon: require('../../assets/ic--profile.png'),
    activeIcon: require('../../assets/ic--profile.png'),
    label: 'פרופיל'
  }
];

const BottomNavigation = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.bottomNav}>
      {navigationItems.map((item) => (
        <TouchableOpacity 
          key={item.id}
          style={[
            styles.navItem,
            activeTab === item.id && styles.activeNavItem
          ]}
          onPress={() => onTabPress(item.id)}
        >
          <Image
            style={styles.navIcon}
            contentFit="cover"
            source={activeTab === item.id ? item.activeIcon : item.icon}
          />
          <Text style={[
            styles.navText,
            activeTab === item.id && styles.activeNavText
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Color.grayscaleColorWhite,
    borderTopWidth: 1,
    borderTopColor: Color.colorGainsboro,
    paddingTop: 8,
    paddingBottom: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  activeNavItem: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: 12,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navText: {
    marginTop: 4,
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  activeNavText: {
    color: Color.grayscaleColorWhite,
    fontFamily: FontFamily.assistantBold,
  },
});

export default BottomNavigation;