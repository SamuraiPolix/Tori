import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import FirebaseApi from '../../utils/FirebaseApi';

const BusinessLogin = ({ navigation }) => {
  console.log('Rendering BusinessLogin...'); // Debug log

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log('BusinessLogin mounted'); // Debug log
    return () => {
      console.log('BusinessLogin unmounted'); // Debug log
    };
  }, []);

  const handleLogin = async () => {
    console.log('Attempting login...'); // Debug log
    
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }

    setLoading(true);
    try {
      console.log('Signing in with email...'); // Debug log
      const user = await FirebaseApi.signInWithEmailAndPassword(email, password);
      console.log('User signed in:', user.uid); // Debug log

      console.log('Fetching business doc...'); // Debug log
      const businessData = await FirebaseApi.getBusinessData(user.uid);
      console.log('Business data exists:', !!businessData); // Debug log

      if (!businessData) {
        console.log('No business doc found, signing out...'); // Debug log
        await FirebaseApi.signOut();
        Alert.alert('שגיאה', 'משתמש זה אינו רשום כבעל עסק');
        setLoading(false);
        return;
      }

      console.log('Business doc found, navigating to dashboard...'); // Debug log
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'BusinessDashboard',
          params: { 
            businessId: user.uid,
            businessData
          }
        }],
      });
    } catch (error) {
      console.error('Login error:', error); // Debug log
      
      let errorMessage = 'אירעה שגיאה בהתחברות';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'כתובת האימייל אינה תקינה';
          break;
        case 'auth/user-not-found':
          errorMessage = 'משתמש לא קיים במערכת';
          break;
        case 'auth/wrong-password':
          errorMessage = 'סיסמה שגויה';
          break;
      }
      
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topPadding} />
        
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>ברוכים הבאים! 👋</Text>
            <Text style={styles.subtitle}>התחברו כדי לנהל את העסק שלכם</Text>
          </View>
        </View>

        <View style={styles.content}>
          

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>📧 אימייל</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="הזן את האימייל שלך"
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>🔒 סיסמה</Text>
              <View style={styles.passwordContainer}>
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="הזן את הסיסמה שלך"
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>שכחת סיסמה?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>התחברות</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('BusinessSignup')}
              >
                <Text style={styles.signupLink}>הרשמה</Text>
              </TouchableOpacity>
              <Text style={styles.signupText}>עדיין אין לך חשבון? </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topPadding: {
    height: Platform.OS === 'ios' ? 80 : 60,
  },
  header: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: FontFamily.primary,
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FontFamily.primary,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: FontFamily.primary,
    color: '#1e40af',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: FontFamily.primary,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: FontFamily.primary,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FontFamily.primary,
    color: '#1e293b',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  showPasswordButton: {
    padding: 16,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
    color: '#2196F3',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.primary,
    color: '#fff',
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
    color: '#64748b',
  },
  signupLink: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
    color: '#2196F3',
    fontWeight: 'bold',
    marginRight: 4,
  },
});

export default BusinessLogin;
