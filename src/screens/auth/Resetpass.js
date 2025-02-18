import * as React from "react";
import { 
  Text, 
  StyleSheet, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  I18nManager,
  Alert,
  ActivityIndicator 
} from "react-native";
import { Image } from "expo-image";
import { Color, FontFamily, Border } from "../../styles/GlobalStyles";
import FirebaseApi from '../../utils/FirebaseApi';

// Enable RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation, route }) => {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const validatePasswords = () => {
    if (password.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePasswords()) return;

    try {
      setIsLoading(true);
      await FirebaseApi.updatePassword(password);
      Alert.alert(
        'הצלחה',
        'הסיסמה עודכנה בהצלחה',
        [
          {
            text: 'אישור',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Password Reset Error:', error);
      let errorMessage = 'אירעה שגיאה בעדכון הסיסמה';
      
      switch (error.code) {
        case 'auth/weak-password':
          errorMessage = 'הסיסמה חלשה מדי';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'יש להתחבר מחדש לפני שינוי הסיסמה';
          navigation.navigate('Login');
          break;
      }
      
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header */}
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

        <Text style={styles.title}>איפוס סיסמה</Text>
        
        <Text style={styles.subtitle}>
          הזן סיסמה חדשה שתהיה שונה מהסיסמאות הקודמות
        </Text>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="סיסמה חדשה"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Image
                style={styles.eyeIcon}
                contentFit="cover"
                source={require("../../assets/ic--eye.png")}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="אימות סיסמה"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Image
                style={styles.eyeIcon}
                contentFit="cover"
                source={require("../../assets/ic--eye.png")}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Color.grayscaleColorWhite} />
          ) : (
            <Text style={styles.submitButtonText}>שמור</Text>
          )}
        </TouchableOpacity>

        {/* Password Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>הסיסמה חייבת לכלול:</Text>
          <Text style={styles.requirementText}>• לפחות 6 תווים</Text>
          <Text style={styles.requirementText}>• אות גדולה ואות קטנה באנגלית</Text>
          <Text style={styles.requirementText}>• מספר אחד לפחות</Text>
          <Text style={styles.requirementText}>• תו מיוחד אחד לפחות (!@#$%^&*)</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.grayscaleColorWhite,
  },
  contentContainer: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.05,
  },
  backButton: {
    padding: SCREEN_WIDTH * 0.02,
    alignSelf: 'flex-start',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.08,
    fontFamily: FontFamily.assistantBold,
    textAlign: 'center',
    marginVertical: SCREEN_HEIGHT * 0.02,
  },
  subtitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontFamily: FontFamily.assistantRegular,
    textAlign: 'center',
    color: Color.grayscaleColorSpanishGray,
    marginBottom: SCREEN_HEIGHT * 0.04,
  },
  inputContainer: {
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  inputWrapper: {
    flexDirection: 'row-reverse', // RTL support
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Border.br_xl,
    borderColor: Color.colorGainsboro,
    height: SCREEN_HEIGHT * 0.07,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.assistantRegular,
    fontSize: SCREEN_WIDTH * 0.045,
    textAlign: 'right',
  },
  eyeButton: {
    padding: SCREEN_WIDTH * 0.02,
  },
  eyeIcon: {
    width: 24,
    height: 24,
  },
  submitButton: {
    height: SCREEN_HEIGHT * 0.07,
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: Border.br_xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.02,
  },
  submitButtonText: {
    color: Color.grayscaleColorWhite,
    fontFamily: FontFamily.assistantBold,
    fontSize: SCREEN_WIDTH * 0.045,
  },
  requirementsContainer: {
    marginTop: SCREEN_HEIGHT * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    alignItems: 'flex-end', // יישור לימין
  },
  requirementsTitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: FontFamily.assistantBold,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  requirementText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: FontFamily.assistantRegular,
    color: Color.grayscaleColorSpanishGray,
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
});

export default ForgotPasswordScreen;