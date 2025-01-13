import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  I18nManager
} from 'react-native';
import { Color, FontFamily } from '../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const PersonalDetails = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [originalPhone, setOriginalPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
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
        setUserData({
          name: data.name || '',
          email: data.email || currentUser.email,
          phoneNumber: data.phoneNumber || ''
        });
        setOriginalPhone(data.phoneNumber || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    try {
      setIsSendingCode(true);
      setVerifying(true);
      const phoneNumber = '+972' + userData.phoneNumber.substring(1); // Convert 05X to +972
      const confirmation = await auth().verifyPhoneNumber(phoneNumber);
      setVerificationId(confirmation.verificationId);
      setShowVerificationModal(true);
    } catch (error) {
      console.error('Error sending verification code:', error);
      Alert.alert('שגיאה', 'לא ניתן לשלוח קוד אימות. נסה שוב מאוחר יותר');
    } finally {
      setVerifying(false);
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    try {
      setVerifying(true);
      const credential = auth.PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      await auth().currentUser.linkWithCredential(credential);
      await saveUserData();
      setShowVerificationModal(false);
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('שגיאה', 'קוד אימות שגוי');
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate phone number format
      if (userData.phoneNumber && !/^05\d{8}$/.test(userData.phoneNumber)) {
        Alert.alert('שגיאה', 'מספר טלפון לא תקין. יש להזין מספר בפורמט: 05XXXXXXXX');
        return;
      }

      // If phone number changed, verify it first
      if (userData.phoneNumber !== originalPhone) {
        await sendVerificationCode();
        return;
      }

      // If phone hasn't changed, just save the data
      await saveUserData();
    } catch (error) {
      console.error('Error in save process:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הנתונים');
    }
  };

  const saveUserData = async () => {
    try {
      setSaving(true);
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          name: userData.name,
          phoneNumber: userData.phoneNumber,
        });

      Alert.alert('הצלחה', 'הפרטים עודכנו בהצלחה');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הנתונים');
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
        <Text style={styles.headerTitle}>פרטים אישיים</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>שם מלא</Text>
          <TextInput
            style={styles.input}
            value={userData.name}
            onChangeText={(text) => setUserData(prev => ({ ...prev, name: text }))}
            placeholder="הזן שם מלא"
            placeholderTextColor={Color.grayscaleColorSpanishGray}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>דוא"ל</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={userData.email}
            editable={false}
          />
          <Text style={styles.helperText}>* לא ניתן לשנות כתובת דוא"ל</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>טלפון נייד</Text>
          <TextInput
            style={styles.input}
            value={userData.phoneNumber}
            onChangeText={(text) => setUserData(prev => ({ ...prev, phoneNumber: text }))}
            placeholder="05XXXXXXXX"
            placeholderTextColor={Color.grayscaleColorSpanishGray}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (saving || verifying) && styles.savingButton]}
          onPress={handleSave}
          disabled={saving || verifying}
        >
          {saving ? (
            <ActivityIndicator color={Color.grayscaleColorWhite} />
          ) : isSendingCode ? (
            <Text style={styles.saveButtonText}>שולח קוד אימות...</Text>
          ) : verifying ? (
            <ActivityIndicator color={Color.grayscaleColorWhite} />
          ) : (
            <Text style={styles.saveButtonText}>שמור שינויים</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>אימות מספר טלפון</Text>
            <Text style={styles.modalText}>
              הזן את קוד האימות שנשלח למספר {userData.phoneNumber}
            </Text>
            <TextInput
              style={styles.verificationInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="הזן קוד אימות"
              keyboardType="number-pad"
              maxLength={6}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton]}
                onPress={verifyCode}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color={Color.grayscaleColorWhite} />
                ) : (
                  <Text style={styles.modalButtonText}>אמת</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowVerificationModal(false);
                  setVerificationCode('');
                }}
                disabled={verifying}
              >
                <Text style={styles.modalButtonText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: FontFamily.assistantSemiBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Color.colorGainsboro,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorBlack,
    textAlign: 'right',
  },
  disabledInput: {
    backgroundColor: Color.colorGainsboro,
  },
  helperText: {
    fontSize: 12,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Color.grayscaleColorWhite,
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Color.grayscaleColorWhite,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorBlack,
    textAlign: 'center',
    marginBottom: 24,
  },
  verificationInput: {
    height: 48,
    width: '100%',
    borderWidth: 1,
    borderColor: Color.colorGainsboro,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 24,
    fontFamily: FontFamily.assistantBold,
    color: Color.grayscaleColorBlack,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  verifyButton: {
    backgroundColor: Color.primaryColorAmaranthPurple,
  },
  cancelButton: {
    backgroundColor: Color.grayscaleColorSpanishGray,
  },
  modalButtonText: {
    color: Color.grayscaleColorWhite,
    fontSize: 16,
    fontFamily: FontFamily.assistantBold,
  },
});

export default PersonalDetails;
