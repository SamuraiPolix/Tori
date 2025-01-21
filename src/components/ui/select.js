import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const Select = ({ children, value, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const handleOpen = () => {
    setIsOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  return (
    <View>
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            onPress: handleOpen,
            value,
          });
        }
        if (child.type === SelectContent) {
          return isOpen && (
            <Modal
              transparent
              visible={isOpen}
              animationType="fade"
              onRequestClose={handleClose}
            >
              <Pressable style={styles.overlay} onPress={handleClose}>
                <Animated.View
                  style={[
                    styles.content,
                    {
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  {React.cloneElement(child, {
                    onClose: handleClose,
                    onValueChange,
                    value,
                  })}
                </Animated.View>
              </Pressable>
            </Modal>
          );
        }
        return child;
      })}
    </View>
  );
};

export const SelectTrigger = ({ value, onPress }) => (
  <Pressable style={styles.trigger} onPress={onPress}>
    <Text style={styles.triggerText}>{value || 'בחר...'}</Text>
    <Icon name="chevron-down" size={20} color="#64748b" />
  </Pressable>
);

export const SelectContent = ({ children, onClose, onValueChange, value }) => (
  <View style={styles.contentInner}>
    <View style={styles.header}>
      <Text style={styles.headerText}>בחר אפשרות</Text>
      <Pressable onPress={onClose}>
        <Icon name="close" size={24} color="#64748b" />
      </Pressable>
    </View>
    <ScrollView style={styles.items}>
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          onSelect: (val) => {
            onValueChange(val);
            onClose();
          },
          isSelected: value === child.props.value,
        })
      )}
    </ScrollView>
  </View>
);

export const SelectItem = ({ children, value, onSelect, isSelected }) => (
  <Pressable
    style={[styles.item, isSelected && styles.selectedItem]}
    onPress={() => onSelect(value)}
  >
    <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
      {children}
    </Text>
    {isSelected && <Icon name="check" size={20} color="#2563eb" />}
  </Pressable>
);

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
  },
  triggerText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#1e293b',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  contentInner: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e293b',
  },
  items: {
    maxHeight: 300,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: '#eff6ff',
  },
  itemText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#1e293b',
  },
  selectedItemText: {
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#2563eb',
  },
});
