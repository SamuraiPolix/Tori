import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function BusinessSettings({ navigation }) {
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      const businessDoc = await firestore()
        .collection('businesses')
        .doc(auth().currentUser.uid)
        .get();

      if (businessDoc.exists) {
        const data = businessDoc.data();
        setBusinessData({
          name: data.name || '',
          phone: data.businessPhone || '',
          email: data.email || '',
          address: data.address || '',
          workHours: data.workingHours || '9:00-18:00',
          notificationsEnabled: data.settings?.notificationsEnabled ?? true,
          autoConfirm: data.settings?.autoConfirm ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת נתוני העסק');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessData) return;

    setSaving(true);
    try {
      await firestore()
        .collection('businesses')
        .doc(auth().currentUser.uid)
        .update({
          name: businessData.name,
          businessPhone: businessData.phone,
          email: businessData.email,
          address: businessData.address,
          workingHours: businessData.workHours,
          settings: {
            notificationsEnabled: businessData.notificationsEnabled,
            autoConfirm: businessData.autoConfirm
          },
          updatedAt: firestore.FieldValue.serverTimestamp()
        });

      Alert.alert('הצלחה', 'ההגדרות נשמרו בהצלחה');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving business settings:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.navigate('Welcome');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהתנתקות');
    }
  };

  if (loading || !businessData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>טוען נתונים...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>➡️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ הגדרות העסק</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 פרטי העסק</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>✨ שם העסק</Text>
            <TextInput
              style={styles.input}
              value={businessData.name}
              onChangeText={(text) => setBusinessData({ ...businessData, name: text })}
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>📱 טלפון</Text>
            <TextInput
              style={styles.input}
              value={businessData.phone}
              onChangeText={(text) => setBusinessData({ ...businessData, phone: text })}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>📧 אימייל</Text>
            <TextInput
              style={styles.input}
              value={businessData.email}
              onChangeText={(text) => setBusinessData({ ...businessData, email: text })}
              keyboardType="email-address"
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>📍 כתובת</Text>
            <TextInput
              style={styles.input}
              value={businessData.address}
              onChangeText={(text) => setBusinessData({ ...businessData, address: text })}
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>🕒 שעות פעילות</Text>
            <TextInput
              style={styles.input}
              value={businessData.workHours}
              onChangeText={(text) => setBusinessData({ ...businessData, workHours: text })}
              textAlign="right"
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>🔔 התראות</Text>
            <Switch
              value={businessData.notificationsEnabled}
              onValueChange={(value) => 
                setBusinessData({ ...businessData, notificationsEnabled: value })
              }
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>✅ אישור תורים אוטומטי</Text>
            <Switch
              value={businessData.autoConfirm}
              onValueChange={(value) => 
                setBusinessData({ ...businessData, autoConfirm: value })
              }
            />
          </View>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => navigation.navigate('BusinessServicesSetup', { businessData })}
          >
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.navigationArrow}>⬅️</Text>
              <Text style={styles.sectionTitle}>✂️ ניהול שירותים</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => navigation.navigate('BusinessProfileSetup', { businessData })}
          >
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.navigationArrow}>⬅️</Text>
              <Text style={styles.sectionTitle}>🖼️ אודות וגלריה</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => navigation.navigate('EmployeeManagement', { businessData })}
          >
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.navigationArrow}>⬅️</Text>
              <Text style={styles.sectionTitle}>👥 צוות העסק</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => navigation.navigate('PaymentSettings', { businessData })}
          >
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.navigationArrow}>⬅️</Text>
              <Text style={styles.sectionTitle}>💳 תשלומים</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.section, styles.logoutSection]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>🚪 התנתק</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>💾 שמור שינויים</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2196F3',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e293b',
    marginBottom: 16,
    width: '100%',
    textAlign: 'right',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    backgroundColor: '#f8fafc',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center'
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"]
  },
  navigationArrow: {
    fontSize: 18,
    transform: [{ scaleX: -1 }],
  },
  logoutSection: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#ef4444',
    textAlign: 'center',
  },
  settingsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 16,
    width: '100%',
  },
  settingButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"]
  },
});
