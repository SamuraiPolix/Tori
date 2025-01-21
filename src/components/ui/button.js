import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';

export const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  onPress,
  disabled,
  style,
  textStyle,
  ...props 
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      default:
        return styles.default;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      default:
        return styles.defaultText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.default;
    }
  };

  return (
    <Pressable
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Text style={[styles.text, getTextStyle(), textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontFamily: FontFamily["Assistant-SemiBold"],
    fontSize: 16,
  },
  // Variants
  default: {
    backgroundColor: '#f1f5f9',
  },
  defaultText: {
    color: '#1e293b',
  },
  primary: {
    backgroundColor: '#2563eb',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondary: {
    backgroundColor: '#e2e8f0',
  },
  secondaryText: {
    color: '#1e293b',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outlineText: {
    color: '#1e293b',
  },
  // Sizes
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  default: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
});
