import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  I18nManager
} from 'react-native';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const NotificationSettings = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    appointmentReminders: true,
    statusUpdates: true,
    promotions: false,
    pushEnabled: false
  });

  useEffect(() => {
    fetchNotificationSettings();
    checkPushPermission();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        navigation.navigate('Login');
        return;
      }

      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      if (userDoc.exists) {
        const data = userDoc.data();
        if (data.notificationSettings) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...data.notificationSettings
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת ההגדרות');
    } finally {
      setLoading(false);
    }
  };

  const checkPushPermission = async () => {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      setSettings(prev => ({ ...prev, pushEnabled: enabled }));
    } catch (error) {
      console.error('Error checking push permission:', error);
    }
  };

  const requestPushPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      setSettings(prev => ({ ...prev, pushEnabled: enabled }));

      if (!enabled) {
        Alert.alert(
          'התראות מושבתות',
          'כדי לקבל התראות, יש לאפשר התראות בהגדרות המכשיר'
        );
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      Alert.alert('שגיאה', 'לא ניתן לבקש הרשאות התראה');
    }
  };

  const handleToggle = (key) => {
    if (!settings.pushEnabled && key !== 'pushEnabled') {
      Alert.alert(
        'התראות מושבתות',
        'כדי לקבל התראות, יש להפעיל תחילה את ההתראות הכלליות',
        [
          { text: 'ביטול', style: 'cancel' },
          { text: 'הפעל התראות', onPress: requestPushPermission }
        ]
      );
      return;
    }

    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          notificationSettings: settings
        });

      Alert.alert('הצלחה', 'הגדרות ההתראות נשמרו בהצלחה');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.primaryColorAmaranthPurple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-forward" size={24} color={Color.grayscaleColorWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הגדרות התראות</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>התראות כלליות</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>התראות מופעלות</Text>
              <Text style={styles.settingDescription}>
                הפעל/כבה את כל ההתראות מהאפליקציה
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={() => handleToggle('pushEnabled')}
              trackColor={{ false: Color.colorGainsboro, true: Color.primaryColorAmaranthPurple }}
              thumbColor={Color.grayscaleColorWhite}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>סוגי התראות</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>תזכורות תורים</Text>
              <Text style={styles.settingDescription}>
                קבל תזכורת לפני התור שקבעת
              </Text>
            </View>
            <Switch
              value={settings.appointmentReminders}
              onValueChange={() => handleToggle('appointmentReminders')}
              trackColor={{ false: Color.colorGainsboro, true: Color.primaryColorAmaranthPurple }}
              thumbColor={Color.grayscaleColorWhite}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>עדכוני סטטוס</Text>
              <Text style={styles.settingDescription}>
                קבל עדכונים על שינויים בתורים שלך
              </Text>
            </View>
            <Switch
              value={settings.statusUpdates}
              onValueChange={() => handleToggle('statusUpdates')}
              trackColor={{ false: Color.colorGainsboro, true: Color.primaryColorAmaranthPurple }}
              thumbColor={Color.grayscaleColorWhite}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>מבצעים והטבות</Text>
              <Text style={styles.settingDescription}>
                קבל עדכונים על מבצעים מיוחדים מהעסקים המועדפים
              </Text>
            </View>
            <Switch
              value={settings.promotions}
              onValueChange={() => handleToggle('promotions')}
              trackColor={{ false: Color.colorGainsboro, true: Color.primaryColorAmaranthPurple }}
              thumbColor={Color.grayscaleColorWhite}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.savingButton]}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Color.grayscaleColorWhite} />
          ) : (
            <Text style={styles.saveButtonText}>שמור הגדרות</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Color.colorGainsboro,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: FontFamily.assistantSemiBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
  },
  saveButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Color.grayscaleColorWhite,
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
  },
});

export default NotificationSettings;
