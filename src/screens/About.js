import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  I18nManager,
} from 'react-native';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const About = ({ navigation }) => {
  const appVersion = '1.0.0';

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const renderSection = (title, content) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-forward" size={24} color={Color.grayscaleColorWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>אודות</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="calendar" size={60} color={Color.primaryColorAmaranthPurple} />
          </View>
          <Text style={styles.appName}>Tori</Text>
          <Text style={styles.version}>גרסה {appVersion}</Text>
        </View>

        {renderSection(
          'מי אנחנו',
          'פלטפורמה חדשנית לניהול תורים ומציאת בתי עסק בתחום היופי והטיפוח. אנו מחברים בין לקוחות לבין בעלי עסקים באופן חכם ויעיל.'
        )}

        {renderSection(
          'המשימה שלנו',
          'המטרה שלנו היא להפוך את תהליך קביעת התורים לפשוט, נוח ונגיש יותר עבור כולם. אנו מאמינים שטכנולוגיה יכולה לשפר את חווית השירות ולחסוך זמן יקר.'
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>צור קשר</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openLink('mailto:support@tori.co.il')}
          >
            <Ionicons name="mail-outline" size={20} color={Color.primaryColorAmaranthPurple} />
            <Text style={styles.linkText}>support@tori.co.il</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openLink('https://tori.co.il')}
          >
            <Ionicons name="globe-outline" size={20} color={Color.primaryColorAmaranthPurple} />
            <Text style={styles.linkText}>www.tori.co.il</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>עקבו אחרינו</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://instagram.com/tori')}
            >
              <Ionicons name="logo-instagram" size={24} color={Color.primaryColorAmaranthPurple} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://facebook.com/tori')}
            >
              <Ionicons name="logo-facebook" size={24} color={Color.primaryColorAmaranthPurple} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}> 2025 Tori. כל הזכויות שמורות.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Color.primaryColorAmaranthPurple,
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorWhite,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Color.grayscaleColorWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appName: {
    fontSize: 28,
    fontFamily: FontFamily.assistantBold,
    color: Color.primaryColorAmaranthPurple,
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorBlack,
    lineHeight: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  linkText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.primaryColorAmaranthPurple,
    marginLeft: 8,
  },
  socialLinks: {
    flexDirection: 'row',
    marginTop: 8,
  },
  socialButton: {
    marginRight: 16,
    padding: 8,
  },
  footer: {
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
});

export default About;
