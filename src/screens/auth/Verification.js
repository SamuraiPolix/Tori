import * as React from "react";
import { 
  Text, 
  StyleSheet, 
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  I18nManager,
  Alert,
  Modal,
  Animated,
  ActivityIndicator
} from "react-native";
import { Image } from "expo-image";
import { Color, FontFamily, Border } from "../../styles/GlobalStyles";
import FirebaseApi from '../../utils/FirebaseApi';

// Enable RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VerificationScreen = ({ navigation, route }) => {
  const [verificationCode, setVerificationCode] = React.useState(['', '', '', '', '', '']);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const phoneNumber = route.params?.phoneNumber || '';
  const confirmation = route.params?.confirmation;
  const [timeLeft, setTimeLeft] = React.useState(120); // 2 minutes in seconds

  React.useEffect(() => {
    if (showSuccessModal) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuccessModal]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleConfirm = async () => {
    const code = verificationCode.join('');
    if (code.length === 6) {
      try {
        setIsLoading(true);
        await FirebaseApi.verifyCode(confirmation, code);
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Verification Error:', error);
        Alert.alert('שגיאה', 'קוד האימות שהוזן שגוי');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert('שגיאה', 'נא להזין קוד אימות מלא');
    }
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    navigation.navigate('Home');
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      const newConfirmation = await FirebaseApi.sendVerificationCode(phoneNumber);
      route.params.confirmation = newConfirmation;
      setTimeLeft(120); // Reset timer
      Alert.alert('הודעה', 'קוד חדש נשלח למספר הטלפון שלך');
    } catch (error) {
      console.error('Resend Error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשליחת הקוד החדש');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (number) => {
    const currentIndex = verificationCode.findIndex(digit => digit === '');
    if (currentIndex !== -1) {
      const newCode = [...verificationCode];
      newCode[currentIndex] = number.toString();
      setVerificationCode(newCode);
    }
  };

  const handleDelete = () => {
    const lastFilledIndex = verificationCode.map(digit => digit !== '').lastIndexOf(true);
    if (lastFilledIndex !== -1) {
      const newCode = [...verificationCode];
      newCode[lastFilledIndex] = '';
      setVerificationCode(newCode);
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

        <Text style={styles.title}>כמעט שם! ✨</Text>
        
        <Text style={styles.subtitle}>
          {`שלחנו קוד אימות למספר ${phoneNumber} 📱\nהזינו אותו כאן להשלמת התהליך`}
        </Text>

        {/* Verification Code Input */}
        <View style={styles.codeContainer}>
          {verificationCode.map((digit, index) => (
            <View key={index} style={[
              styles.digitBox,
              digit && styles.digitBoxFilled,
              index === verificationCode.findIndex(d => d === '') && styles.digitBoxActive
            ]}>
              <Text style={styles.digit}>{digit}</Text>
            </View>
          ))}
        </View>

        {/* Timer */}
        <Text style={styles.timerText}>
          {timeLeft > 0 ? `הקוד יפוג בעוד ${formatTime(timeLeft)} ⏱️` : 'הקוד פג תוקף'}
        </Text>

        {/* Resend Button */}
        {timeLeft === 0 && (
          <TouchableOpacity 
            style={styles.resendButton}
            onPress={handleResend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Color.primary} />
            ) : (
              <Text style={styles.resendText}>שלח קוד חדש</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Numeric Keyboard */}
        <View style={styles.keyboardContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'delete'].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.keyButton,
                !item && styles.keyButtonHidden,
                item === 'delete' && styles.deleteButton
              ]}
              onPress={() => {
                if (item === 'delete') {
                  handleDelete();
                } else if (item !== null) {
                  handleKeyPress(item);
                }
              }}
              disabled={!item || isLoading}
            >
              {item === 'delete' ? (
                <Image
                  style={styles.deleteIcon}
                  contentFit="cover"
                  source={require("../../assets/ic--delete.png")}
                />
              ) : (
                item !== null && <Text style={styles.keyText}>{item}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isLoading || verificationCode.includes('')}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>אישור</Text>
          )}
        </TouchableOpacity>

        {/* Success Modal */}
        <Modal
          transparent={true}
          visible={showSuccessModal}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalContent,
                { opacity: fadeAnim }
              ]}
            >
              <Image
                style={styles.successIcon}
                contentFit="cover"
                source={require("../../assets/ic--success.png")}
              />
              <Text style={styles.modalTitle}>מצוין!</Text>
              <Text style={styles.modalText}>
                המספר אומת בהצלחה
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleContinue}
              >
                <Text style={styles.modalButtonText}>המשך</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.05,
    paddingBottom: SCREEN_HEIGHT * 0.15,
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
    fontSize: 32,
    fontFamily: FontFamily["Assistant-Bold"],
    textAlign: 'center',
    marginVertical: SCREEN_HEIGHT * 0.02,
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    textAlign: 'center',
    color: '#64748B',
    marginBottom: SCREEN_HEIGHT * 0.04,
    lineHeight: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: SCREEN_WIDTH * 0.1,
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  digitBox: {
    width: SCREEN_WIDTH * 0.13,
    height: SCREEN_WIDTH * 0.13,
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  digitBoxFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  digitBoxActive: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  digit: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1E293B',
  },
  timerText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
    textAlign: 'center',
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  resendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  resendText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#FFFFFF',
    textAlign: 'center',
  },
  keyboardContainer: {
    width: '100%',
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.04,
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  keyButton: {
    width: SCREEN_WIDTH * 0.2,
    height: SCREEN_WIDTH * 0.13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  keyButtonHidden: {
    opacity: 0,
  },
  deleteButton: {
    backgroundColor: '#FFC080',
  },
  keyText: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#1E293B',
  },
  deleteIcon: {
    width: 24,
    height: 24,
  },
  confirmButton: {
    height: 56,
    backgroundColor: '#94A3B8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily["Assistant-Bold"],
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    width: SCREEN_WIDTH * 0.85,
  },
  successIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
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
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily["Assistant-Bold"],
    fontSize: 18,
    textAlign: 'center',
  },
});

export default VerificationScreen;