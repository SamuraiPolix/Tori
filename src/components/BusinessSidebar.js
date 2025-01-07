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
    // סגירת התפריט עם אנימציה לפני הניווט
    Animated.timing(slideAnim, {
      toValue: SIDEBAR_WIDTH,
      duration: 250,
      easing: Easing.bezier(0.2, 1, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      onClose();
      if (screen !== currentScreen) {
        navigation.navigate(screen, { businessData });
      }
    });
  };

  const handleLogout = () => {
    // Close sidebar with animation
    Animated.timing(slideAnim, {
      toValue: SIDEBAR_WIDTH,
      duration: 250,
      easing: Easing.bezier(0.2, 1, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      onClose();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    });
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
          <View />
        </TouchableOpacity>
      )}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>❮</Text>
          </TouchableOpacity>
          <View style={styles.businessInfo}>
            <Text style={styles.welcomeText}>ברוכים הבאים! 👋</Text>
            <Text style={styles.businessName}>{businessData.businessName}</Text>
            <Text style={styles.ownerName}>{businessData.ownerName}</Text>
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
                <Text style={[
                  styles.menuIcon,
                  currentScreen === item.screen && styles.activeMenuIcon
                ]}>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#F8FAFC',
    paddingTop: 50,
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#EFF6FF',
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'right',
  },
  businessInfo: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  businessName: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1E293B',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  menuItems: {
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  activeMenuItem: {
    backgroundColor: '#EFF6FF',
  },
  menuIcon: {
    fontSize: 24,
    marginLeft: 15,
    color: '#64748B',
  },
  activeMenuIcon: {
    color: '#2563EB',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#64748B',
    textAlign: 'right',
  },
  activeMenuText: {
    color: '#2563EB',
    fontFamily: FontFamily["Assistant-Bold"],
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    opacity: 0.6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  logoutContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    width: 'auto',
    minWidth: 120,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#EF4444',
    textAlign: 'right',
    marginLeft: 8,
  },
  logoutIcon: {
    fontSize: 18,
    color: '#EF4444',
  },
  footerText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default BusinessSidebar;
