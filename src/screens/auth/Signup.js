import * as React from "react";
import { 
  Text, 
  StyleSheet, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Dimensions, 
  I18nManager, 
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator
} from "react-native";
import { Image } from "expo-image";
import { Color, FontFamily, Border } from "../../styles/GlobalStyles";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { storeUserData } from "../../utils/userStorage";

// Enable RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Signup = ({ navigation }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם הוא שדה חובה';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'דוא"ל הוא שדה חובה';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'כתובת דוא"ל לא תקינה';
    }

    if (!formData.password) {
      newErrors.password = 'סיסמה היא שדה חובה';
    } else if (formData.password.length < 6) {
      newErrors.password = 'סיסמה חייבת להכיל לפחות 6 תווים';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'יש לאשר את התנאים וההגבלות';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      // Create user with email and password
      const { user } = await auth().createUserWithEmailAndPassword(formData.email, formData.password);

      // Update user profile with display name
      await user.updateProfile({
        displayName: formData.name.trim()
      });

      // Save user data to Firestore
      const userDocRef = firestore().collection('users').doc(user.uid);
      const userData = {
        uid: user.uid,
        name: formData.name.trim(),
        email: formData.email,
        phoneNumber: null,
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
        lastLogin: firestore.Timestamp.now()
      };
      await userDocRef.set(userData);

      // Store user data locally
      await storeUserData(userData);

      // Send email verification
      await user.sendEmailVerification();

      // Show success message
      Alert.alert(
        'הרשמה הצליחה',
        'נשלח אליך מייל אימות. אנא אמת את כתובת המייל שלך.',
        [
          {
            text: 'אישור',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Registration Error:', error);
      let errorMessage = 'אירעה שגיאה בתהליך ההרשמה';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'כתובת האימייל כבר קיימת במערכת';
          break;
        case 'auth/invalid-email':
          errorMessage = 'כתובת האימייל אינה תקינה';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'הרשמה באמצעות אימייל וסיסמה אינה מאופשרת';
          break;
        case 'auth/weak-password':
          errorMessage = 'הסיסמה חלשה מדי';
          break;
      }

      Alert.alert('שגיאה בהרשמה', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Image
                  style={styles.backIcon}
                  contentFit="cover"
                  source={require("../../assets/ic--back.png")}
                />
              </TouchableOpacity>
              <Text style={styles.title}>ברוכים הבאים! 👋</Text>
              <Text style={styles.subtitle}>נשמח שתצטרפו למשפחת Tori 🌟</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>איך נוכל לקרוא לך? 😊</Text>
                <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                    <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="השם המלא שלך"
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholderTextColor={Color.grayscaleColorSpanishGray}
                    />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>המייל שלך 📧</Text>
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                    <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="כתובת הדוא״ל שלך"
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={Color.grayscaleColorSpanishGray}
                    />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>בחר סיסמה חזקה 🔒</Text>
                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                    <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIconContainer}
                    >
                    <Text style={styles.eyeIcon}>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                    <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="לפחות 6 תווים"
                    value={formData.password}
                    onChangeText={(text) => setFormData({...formData, password: text})}
                    secureTextEntry={!isPasswordVisible}
                    placeholderTextColor={Color.grayscaleColorSpanishGray}
                    />
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>אימות סיסמה 🔄</Text>
                <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                    <TouchableOpacity
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    style={styles.eyeIconContainer}
                    >
                    <Text style={styles.eyeIcon}>{isConfirmPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                    <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="הקלד שוב את הסיסמה"
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                    secureTextEntry={!isConfirmPasswordVisible}
                    placeholderTextColor={Color.grayscaleColorSpanishGray}
                    />
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>
              {/* Terms Checkbox */}
              <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                  קראתי ואני מסכים/ה ל
                  <Text style={styles.termsLink}> תנאי השימוש</Text>
                </Text>
                <Text style={styles.termsLink}>  </Text>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  <View style={[styles.checkboxInner, acceptedTerms && styles.checkboxChecked]} />
                </TouchableOpacity>
                
              </View>
              {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
              {/* Submit Button */}
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSignUp}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>הרשמה</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>כבר יש לך חשבון? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>התחבר עכשיו</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Lighter, refreshing background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.05,
  },
  header: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.04,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2563EB', // Primary blue
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B', // Softer gray
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#334155', // Dark gray
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    width: '100%',
  },
  inputIcon: {
    fontSize: 20,
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    textAlign: 'right',
    color: '#1E293B',
  },
  eyeIconContainer: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },
  eyeIcon: {
    fontSize: 20,
    color: '#64748B',
  },
  errorText: {
    color: '#EF4444', // Error red
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    textAlign: 'right',
    marginTop: 4,
  },
  inputError: {
    borderColor: '#EF4444', // Error red
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SCREEN_HEIGHT * 0.02,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#2563EB', // Primary blue
  },
  termsText: {
    fontFamily: FontFamily["Assistant-Regular"],
    fontSize: 16,
  },
  termsLink: {
    color: '#2563EB', // Primary blue
    fontFamily: FontFamily["Assistant-Bold"],
  },
  submitButton: {
    backgroundColor: '#2563EB', // Primary blue
    height: SCREEN_HEIGHT * 0.07,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.08,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SCREEN_HEIGHT * 0.03,
  },
  footerText: {
    fontFamily: FontFamily["Assistant-Regular"],
    fontSize: 16,
  },
  footerLink: {
    fontFamily: FontFamily["Assistant-Bold"],
    fontSize: 16,
    color: '#2563EB', // Primary blue
  },
});

export default Signup;