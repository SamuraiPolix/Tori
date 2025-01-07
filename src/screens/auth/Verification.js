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
  Animated
} from "react-native";
import { Image } from "expo-image";
import { Color, FontFamily, Border } from "../../styles/GlobalStyles";

// Enable RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VerificationScreen = ({ navigation, route }) => {
  const [verificationCode, setVerificationCode] = React.useState(['', '', '', '']);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const phoneNumber = route.params?.phoneNumber || '';

  React.useEffect(() => {
    if (showSuccessModal) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuccessModal]);

  const handleConfirm = () => {
    const code = verificationCode.join('');
    if (code.length === 4) {
      // Add verification logic here
      console.log('Verifying code:', code);
      // Simulating successful verification
      setShowSuccessModal(true);
    } else {
      Alert.alert('שגיאה', 'נא להזין קוד אימות מלא');
    }
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    navigation.navigate('Home');
  };

  const handleResend = () => {
    console.log('Resending code to:', phoneNumber);
    Alert.alert('הודעה', 'קוד חדש נשלח למספר הטלפון שלך');
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
        <Text style={styles.timerText}>הקוד יפוג בעוד 02:00 ⏱️</Text>

        {/* Numeric Keyboard */}
        <View style={styles.keyboardContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <TouchableOpacity
              key={number}
              style={styles.keyButton}
              onPress={() => {
                const firstEmptyIndex = verificationCode.findIndex(d => d === '');
                if (firstEmptyIndex !== -1) {
                  const newCode = [...verificationCode];
                  newCode[firstEmptyIndex] = number.toString();
                  setVerificationCode(newCode);
                }
              }}
            >
              <Text style={styles.keyText}>{number}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.keyButton}
            onPress={() => {
              const lastFilledIndex = verificationCode.slice().reverse().findIndex(d => d !== '');
              if (lastFilledIndex !== -1) {
                const newCode = [...verificationCode];
                newCode[verificationCode.length - 1 - lastFilledIndex] = '';
                setVerificationCode(newCode);
              }
            }}
          >
            <Image
              style={styles.deleteIcon}
              contentFit="cover"
              source={require("../../assets/delete.png")}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keyButton}
            onPress={() => {
              const firstEmptyIndex = verificationCode.findIndex(d => d === '');
              if (firstEmptyIndex !== -1) {
                const newCode = [...verificationCode];
                newCode[firstEmptyIndex] = "0";
                setVerificationCode(newCode);
              }
            }}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            verificationCode.every(d => d !== '') && styles.confirmButtonActive
          ]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>אימות הקוד ✓</Text>
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendButton}>שליחת קוד חדש 🔄</Text>
          </TouchableOpacity>
          <Text style={styles.resendText}>לא קיבלת את הקוד? </Text>
        </View>

        {/* Success Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  opacity: fadeAnim,
                  transform: [{
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.modalEmoji}>✅</Text>
              <Text style={styles.modalTitle}>האימות בוצע בהצלחה!</Text>
              <Text style={styles.modalSubtitle}>ברוכים הבאים לTori</Text>
              
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleContinue}
              >
                <Text style={styles.modalButtonText}>מעבר לאפליקציה 🚀</Text>
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
  confirmButtonActive: {
    backgroundColor: '#2563EB',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily["Assistant-Bold"],
    fontSize: 18,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748B',
  },
  resendButton: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2563EB',
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
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
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