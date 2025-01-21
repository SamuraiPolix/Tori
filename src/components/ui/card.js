import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';

export const Card = ({ children, style, ...props }) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

export const CardHeader = ({ children, style, ...props }) => (
  <View style={[styles.cardHeader, style]} {...props}>
    {children}
  </View>
);

export const CardTitle = ({ children, style, ...props }) => (
  <Text style={[styles.cardTitle, style]} {...props}>
    {children}
  </Text>
);

export const CardDescription = ({ children, style, ...props }) => (
  <Text style={[styles.cardDescription, style]} {...props}>
    {children}
  </Text>
);

export const CardContent = ({ children, style, ...props }) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
  },
  cardContent: {
    marginTop: 8,
  },
});
