import * as React from "react";
import { 
  Text, 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  I18nManager,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  ScrollView,
  Image
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Color, FontFamily, Border } from "../../styles/GlobalStyles";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { storeUserData } from "../../utils/userStorage";
import FirebaseApi from '../../utils/FirebaseApi';

// Enable RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

GoogleSignin.configure({
  webClientId: '358621723244-l1hg1nsrds5p0nlh7jffld2juqv68tr7.apps.googleusercontent.com',
  offlineAccess: true
});

const Frame = ({ navigation }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeInput, setActiveInput] = React.useState('email'); // 'email' or 'phone'
  const [confirmation, setConfirmation] = React.useState(null);
  const [showNamePrompt, setShowNamePrompt] = React.useState(false);
  const [userName, setUserName] = React.useState('');

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const slideUp = () => {
    Animated.timing(slideAnim, {
      toValue: -50,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const slideDown = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text && text.includes('@')) {
      slideUp();
      fadeIn();
    } else {
      slideDown();
      fadeOut();
    }
  };

  const handlePhoneNumberChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  const handleLogin = async () => {
    let loginEmail = email;
    let loginPassword = password;

    // Use test credentials if no email and password are entered
    if (!email && !password) {
      loginEmail = 'test@tori.co.il';
      loginPassword = 'testing';
    } else if (!email || !password) {
      Alert.alert('שגיאה', 'אנא הזן אימייל וסיסמה');
      return;
    }

    setIsLoading(true);
    try {
      const { user, userData } = await FirebaseApi.signInWithEmail(loginEmail, loginPassword);
      await storeUserData(userData);
      setIsLoading(false);
      navigation.navigate('Home');
    } catch (error) {
      let errorMessage = 'אירעה שגיאה בתהליך ההתחברות';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'כתובת האימייל אינה תקינה';
          break;
        case 'auth/user-disabled':
          errorMessage = 'המשתמש חסום';
          break;
        case 'auth/user-not-found':
          errorMessage = 'משתמש לא קיים';
          break;
        case 'auth/wrong-password':
          errorMessage = 'סיסמה שגויה';
          break;
      }
      
      Alert.alert('שגיאה בהתחברות', errorMessage);
      console.error('Login Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { user, userData } = await FirebaseApi.signInWithGoogle();
      await storeUserData(userData);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      let errorMessage = 'אירעה שגיאה בהתחברות עם Google';
      
      if (error.code === 'firestore/not-found') {
        errorMessage = 'שגיאה ביצירת משתמש חדש';
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.toString().includes('SIGN_IN_CANCELLED')) {
        errorMessage = 'ההתחברות בוטלה';
      } else if (error?.toString().includes('PLAY_SERVICES_NOT_AVAILABLE')) {
        errorMessage = 'שירותי Google Play אינם זמינים';
      }
      
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (phone.length < 10) {
      Alert.alert('שגיאה', 'נא להזין מספר טלפון תקין');
      return;
    }

    setIsLoading(true);
    try {
      const confirmationResult = await FirebaseApi.signInWithPhone(phone);
      setConfirmation(confirmationResult);
      Alert.alert('קוד אימות נשלח', 'אנא הזן את הקוד שקיבלת ב-SMS');
    } catch (error) {
      console.error('Phone Auth Error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשליחת קוד האימות. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerification = async () => {
    if (!code) {
      Alert.alert('שגיאה', 'נא להזין קוד אימות');
      return;
    }

    try {
      setIsLoading(true);
      await FirebaseApi.confirmPhoneCode(confirmation, code);
      
      // Check if user already exists
      const { userData, isExisting } = await FirebaseApi.handlePhoneAuthentication();
      
      if (isExisting) {
        // User exists, store data and navigate to home
        await storeUserData(userData);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        // New user, show name prompt
        setShowNamePrompt(true);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('שגיאה', 'קוד האימות שגוי');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!userName.trim()) {
      Alert.alert('שגיאה', 'נא להזין שם');
      return;
    }

    try {
      setIsLoading(true);
      const { user, userData } = await FirebaseApi.createUserAfterPhoneAuth(userName);
      
      // Store user data locally
      await storeUserData(userData);
      
      // Navigate to home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת פרטי המשתמש');
    } finally {
      setIsLoading(false);
      setShowNamePrompt(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('שגיאה', 'נא להזין כתובת אימייל');
      return;
    }

    setIsLoading(true);
    try {
      await FirebaseApi.resetPassword(email);
      Alert.alert('הודעה', 'נשלח אימייל עם קישור לאיפוס הסיסמה');
    } catch (error) {
      console.error('Forgot password error:', error);
      let errorMessage = 'אירעה שגיאה בשליחת האימייל';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'כתובת האימייל אינה תקינה';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'משתמש לא קיים במערכת';
      }
      
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailForm = () => (
    <View style={styles.formSection}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>אימייל</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={handleEmailChange}
          placeholder="הכנס את האימייל שלך"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>סיסמה</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="הכנס סיסמה"
          secureTextEntry={true}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={handleForgotPassword}
        disabled={isLoading}
      >
        <Text style={styles.forgotPasswordText}>שכחת סיסמה?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, (email.length > 0 && password.length > 0) && styles.submitButtonActive]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>התחבר</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPhoneForm = () => (
    <View style={styles.formSection}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>מספר טלפון</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={handlePhoneNumberChange}
          placeholder="הכנס מספר טלפון (לדוגמה: 0501234567)"
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      {confirmation && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>קוד אימות</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="הכנס את הקוד שקיבלת"
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, phone.length === 10 && styles.submitButtonActive]}
        onPress={confirmation ? handleCodeVerification : handlePhoneLogin}
        disabled={
          (confirmation ? code.length !== 6 : phone.length !== 10) || 
          isLoading
        }
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {confirmation ? 'אמת קוד' : 'שלח קוד אימות'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderNamePrompt = () => (
    <Modal
      visible={showNamePrompt}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>ברוך הבא!</Text>
          <Text style={styles.modalText}>איך נוכל לקרוא לך?</Text>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="הכנס את השם שלך"
            autoFocus={true}
          />
          <TouchableOpacity
            style={[styles.submitButton, userName.trim().length > 0 && styles.submitButtonActive]}
            onPress={handleNameSubmit}
            disabled={!userName.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>המשך</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderNamePrompt()}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ברוכים הבאים! 👋</Text>
          <Text style={styles.subtitle}>שמחים לראות אותך שוב</Text>
        </View>

        <View style={styles.methodSelector}>
          <TouchableOpacity 
            style={[styles.methodButton, activeInput === 'email' && styles.methodButtonActive]}
            onPress={() => {
              setActiveInput('email');
              setConfirmation(null);
              setCode('');
            }}
          >
            <Text style={[styles.methodButtonText, activeInput === 'email' && styles.methodButtonTextActive]}>
              אימייל וסיסמה
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.methodButton, activeInput === 'phone' && styles.methodButtonActive]}
            onPress={() => {
              setActiveInput('phone');
              setEmail('');
              setPassword('');
            }}
          >
            <Text style={[styles.methodButtonText, activeInput === 'phone' && styles.methodButtonTextActive]}>
              מספר טלפון
            </Text>
          </TouchableOpacity>
        </View>

        {activeInput === 'email' ? renderEmailForm() : renderPhoneForm()}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>או</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
        >
          <ExpoImage
            style={styles.googleIcon}
            contentFit="cover"
            source={require("../../assets/google.webp")}
          />
          <Text style={styles.googleButtonText}>המשך עם Google</Text>
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          הפרטים שלך מאובטחים אצלנו 🔒
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>עדיין אין לך חשבון? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>הירשם עכשיו</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#EEF2FF', 
    padding: 20,
    borderRadius: 16,
    shadowColor: '#6366F1', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1E293B',
    marginBottom: 8,
    textShadow: '0px 2px 4px rgba(99, 102, 241, 0.1)', 
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#6366F1', 
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF', 
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  methodButtonActive: {
    backgroundColor: '#EEF2FF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodButtonText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#64748B',
  },
  methodButtonTextActive: {
    color: '#4F46E5', 
  },
  formSection: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#1E293B',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    backgroundColor: '#FFFFFF',
    textAlign: 'right',
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#94A3B8',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonActive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#C7D2FE', 
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748B',
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
  },
  googleButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#1E293B',
  },
  privacyNote: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    backgroundColor: '#F8FAFF', 
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
  },
  signupLink: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#2563EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
    padding: 5,
    marginLeft: 5,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
});

export default Frame;