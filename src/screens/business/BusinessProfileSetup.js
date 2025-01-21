import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Color, FontFamily } from '../../styles/GlobalStyles';
import * as ImagePicker from 'expo-image-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const BusinessProfileSetup = ({ navigation, route }) => {
  const { businessData } = route.params;
  const [profileData, setProfileData] = useState({
    about: '',
    images: [],
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri]
      }));
    }
  };

  const removeImage = (index) => {
    setProfileData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleNext = async () => {
    try {
      // שמירת נתוני הפרופיל ב-Firestore
      await firestore()
        .collection('businesses')
        .doc(auth().currentUser.uid)
        .update({
          about: profileData.about,
          images: profileData.images,
          updatedAt: firestore.FieldValue.serverTimestamp()
        });

      navigation.navigate('BusinessServicesSetup', {
        businessId: auth().currentUser.uid,
        businessData: { ...businessData, ...profileData }
      });
    } catch (error) {
      console.error('Error saving profile data:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת נתוני הפרופיל');
    }
  };

  const handleBack = () => {
    navigation.navigate('BusinessServicesSetup', { businessData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={24} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.title}>✨ פרופיל העסק</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>ברוכים הבאים! 👋</Text>
          <Text style={styles.subtitle}>
            בואו ניצור פרופיל מרשים שיגרום ללקוחות להתאהב בעסק שלך 💫
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 גלריית העסק</Text>
          <Text style={styles.sectionDescription}>
            הוסף תמונות מרשימות שמציגות את העסק שלך בצורה הטובה ביותר
          </Text>
          <View style={styles.imagesContainer}>
            {profileData.images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera" size={32} color="#2196F3" />
              <Text style={styles.addImageText}>הוסף תמונה</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💝 אודות העסק</Text>
          <Text style={styles.sectionDescription}>
            ספר לנו על הייחודיות של העסק שלך, על השירותים שאתה מציע ועל החוויה שהלקוחות יקבלו
          </Text>
          <TextInput
            style={styles.aboutInput}
            value={profileData.about}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, about: text }))}
            placeholder="למשל: אנחנו מספרה מקצועית עם 10 שנות ניסיון, המתמחה בעיצוב שיער..."
            multiline
            textAlignVertical="top"
            numberOfLines={6}
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>המשך לשלב הבא ➡️</Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            🔄 תוכל לערוך את הפרטים בכל זמן דרך הגדרות העסק
          </Text>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('BusinessScheduleSetup', {
              businessId: auth().currentUser.uid,
              businessData: { ...businessData, about: '', images: [] }
            })}
          >
            <Text style={styles.skipButtonText}>דלג לשלב הבא ⏩</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2196F3',
    textAlign: 'center',
    marginRight: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#1e40af',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#2196F3',
    marginBottom: 8,
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'right',
    lineHeight: 20,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  addImageText: {
    fontSize: 12,
    fontFamily: FontFamily["Assistant-Medium"],
    color: '#2196F3',
    marginTop: 4,
  },
  aboutInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 120,
  },
  actionButtons: {
    gap: 16,
    marginTop: 16,
  },
  nextButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-Bold"],
  },
  infoText: {
    fontSize: 14,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 8,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Medium"],
  },
  bottomPadding: {
    height: 40,
  },
});

export default BusinessProfileSetup;
