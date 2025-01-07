import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily } from '../../styles/GlobalStyles';

const WelcomeScreen = ({ navigation }) => {
  return (
    <>
      <StatusBar translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#E3F2FD', '#FFFFFF']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.welcomeEmoji}>✨</Text>
              <Text style={styles.appName}>Tori</Text>
              <Text style={styles.title}>ברוכים הבאים!</Text>
              <Text style={styles.subtitle}>המקום המושלם לניהול התורים שלך 🌟</Text>
              
            </View>

            <View style={styles.buttonsContainer}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>בעל עסק? 💼</Text>
                <TouchableOpacity
                  style={[styles.button, styles.businessButton]}
                  onPress={() => navigation.navigate('BusinessSignup')}
                >
                  <Text style={styles.businessButtonText}>כניסה לבעלי עסקים 🎯</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>או</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>לקוח פרטי? 👤</Text>
                <TouchableOpacity
                  style={[styles.button, styles.customerButton]}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.customerButtonText}>כניסה ללקוחות 📱</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                אנחנו כאן בשבילך! 💪
              </Text>
              <Text style={styles.versionText}>גרסה 1.0.0</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight + 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 42,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2563EB',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#94A3B8',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessButton: {
    backgroundColor: '#2563EB',
  },
  customerButton: {
    backgroundColor: '#10B981',
  },
  businessButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
  customerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  footerText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#64748B',
    textAlign: 'center',
  },
  versionText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
