import React from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';

export const Switch = ({ value, onValueChange, disabled }) => {
  const translateX = React.useRef(new Animated.Value(value ? 20 : 0)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 20 : 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [value]);

  return (
    <Pressable
      style={[
        styles.switch,
        {
          backgroundColor: value ? '#7C3AED' : '#e2e8f0',
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
