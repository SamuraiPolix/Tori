import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Color, FontFamily } from '../../styles/GlobalStyles';

const CustomMarker = ({ title }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{title}</Text>
      </View>
      <View style={styles.arrowBorder} />
      <View style={styles.arrow} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignSelf: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Color.primaryColorAmaranthPurple,
  },
  text: {
    color: Color.grayscaleColorWhite,
    fontSize: 14,
    fontFamily: FontFamily.primaryFontBold,
  },
  arrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 4,
    borderTopColor: Color.primaryColorAmaranthPurple,
    alignSelf: 'center',
    marginTop: -9,
  },
  arrowBorder: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 4,
    borderTopColor: Color.primaryColorAmaranthPurple,
    alignSelf: 'center',
    marginTop: -0.5,
  },
});

export default CustomMarker;
