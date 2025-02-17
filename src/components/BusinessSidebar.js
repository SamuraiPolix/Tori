import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { FontFamily, Color } from '../styles/GlobalStyles';

const SIDEBAR_WIDTH = 280;
const SCREEN_WIDTH = Dimensions.get('window').width;

const BusinessSidebar = ({ 
  isVisible, 
  onClose, 
  navigation, 
  businessData,
  currentScreen
}) => {
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (isVisible) {
      // פתיחת התפריט
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.2, 1, 0.2, 1),
        useNativeDriver: true,
      }).start();
    } else {
      // סגירת התפריט
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        easing: Easing.bezier(0.2, 1, 0.2, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleNavigation = (screen) => {
    onClose(); // סוגר את התפריט לפני הניווט
    navigation.navigate(screen, { 
      businessId: businessData.id,
      businessData 
    });
  };

  const handleLogout = () => {
    onClose();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const handleClose = () => {
    onClose();
  };

  const menuItems = [
    {
      id: 'dashboard',
      name: 'דף הבית שלי',
      emoji: '🏠',
      screen: 'BusinessDashboard'
    },
    {
      id: 'calendar',
      name: 'ניהול תורים',
      emoji: '📅',
      screen: 'BusinessCalendar'
    },
    {
      id: 'customers',
      name: 'הלקוחות שלי',
      emoji: '👥',
      screen: 'BusinessCustomers'
    },
    {
      id: 'stats',
      name: 'נתונים ומידע',
      emoji: '📊',
      screen: 'BusinessStats'
    },
    {
      id: 'settings',
      name: 'הגדרות העסק',
      emoji: '⚙️',
      screen: 'BusinessSettings'
    }
  ];

  return (
    <>
      {isVisible && (
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
      )}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            opacity: isVisible ? 1 : 0,
            pointerEvents: isVisible ? 'auto' : 'none',
          }
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>❮</Text>
          </TouchableOpacity>
          <View style={styles.businessInfo}>
            <Text style={styles.welcomeText}>ברוכים הבאים! 👋</Text>
            <Text style={styles.businessName}>{businessData?.name || 'העסק שלי'}</Text>
            <Text style={styles.ownerName}>{businessData?.ownerName || ''}</Text>
          </View>
        </View>
        
        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity 
                style={[
                  styles.menuItem,
                  currentScreen === item.screen && styles.activeMenuItem
                ]}
                onPress={() => handleNavigation(item.screen)}
              >
                <Text style={[
                  styles.menuText,
                  currentScreen === item.screen && styles.activeMenuText
                ]}>
                  {item.name}
                </Text>
                <Text style={styles.emojiIcon}>
                  {item.emoji}
                </Text>
              </TouchableOpacity>
              {index < menuItems.length - 1 && (
                <View style={styles.divider} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.logoutContainer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>התנתקות</Text>
              <Text style={styles.logoutIcon}>👋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <Text style={styles.footerText}>גרסה 1.0.0 ✨</Text>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    zIndex: 999,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  closeButtonText: {
    fontSize: 24,
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.assistantRegular,
  },
  businessInfo: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    fontFamily: FontFamily.assistantRegular,
  },
  businessName: {
    fontSize: 20,
    color: Color.primaryColorAmaranthPurple,
    marginBottom: 4,
    fontFamily: FontFamily.assistantBold,
  },
  ownerName: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: FontFamily.assistantRegular,
  },
  menuItems: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  activeMenuItem: {
    backgroundColor: Color.primaryColorAmaranthPurple + '10',
  },
  menuText: {
    fontSize: 16,
    color: '#1e293b',
    marginRight: 12,
    fontFamily: FontFamily.assistantRegular,
  },
  activeMenuText: {
    color: Color.primaryColorAmaranthPurple,
    fontFamily: FontFamily.assistantBold,
  },
  emojiIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutContainer: {
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    marginRight: 12,
    fontFamily: FontFamily.assistantRegular,
  },
  logoutIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontFamily: FontFamily.assistantRegular,
  }
});

export default BusinessSidebar;
