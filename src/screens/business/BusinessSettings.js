import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TextInput, 
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView
} from 'react-native';
import { FontFamily, Color } from '../../styles/GlobalStyles';
import auth from '@react-native-firebase/auth';
import BusinessServicesSettings from './BusinessServicesSettings';
import BusinessHoursSettings from './BusinessHoursSettings';
import { Ionicons } from '@expo/vector-icons';
import BusinessSidebar from '../../components/BusinessSidebar';

export default function BusinessSettings({ navigation }) {
  const [activeTab, setActiveTab] = useState("general");
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          about: data.about || '',
          workHours: data.workingHours || {},
          services: data.services || [],
          settings: {
            notificationsEnabled: data.settings?.notificationsEnabled ?? true,
            autoConfirm: data.settings?.autoConfirm ?? false,
            allowOnlineBooking: data.settings?.allowOnlineBooking ?? true,
            reminderTime: data.settings?.reminderTime ?? 60,
          }
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
          about: businessData.about,
          workingHours: businessData.workHours,
          services: businessData.services,
          settings: businessData.settings,
          updatedAt: firestore.FieldValue.serverTimestamp()
        });

      Alert.alert('✨ הצלחה', 'הגדרות העסק עודכנו בהצלחה');
    } catch (error) {
      console.error('Error saving business settings:', error);
      Alert.alert('❌ שגיאה', 'אירעה שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="create" size={28} color="#2563eb" style={styles.headerIcon} />
        <Text style={styles.headerTitle}>פרטי העסק</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        הזן את הפרטים הבסיסיים של העסק שלך 🏪
      </Text>

      <View style={styles.card}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            <Ionicons name="storefront" size={16} color="#64748b" /> שם העסק
          </Text>
          <TextInput
            style={styles.input}
            value={businessData.name}
            onChangeText={(text) => setBusinessData({...businessData, name: text})}
            placeholder="לדוגמה: המספרה של יוסי"
            placeholderTextColor="#94a3b8"
            textAlign="right"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            <Ionicons name="call" size={16} color="#64748b" /> טלפון העסק
          </Text>
          <TextInput
            style={styles.input}
            value={businessData.phone}
            onChangeText={(text) => setBusinessData({...businessData, phone: text})}
            placeholder="הזן מספר טלפון"
            placeholderTextColor="#94a3b8"
            textAlign="right"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            <Ionicons name="mail" size={16} color="#64748b" /> דוא״ל
          </Text>
          <TextInput
            style={styles.input}
            value={businessData.email}
            onChangeText={(text) => setBusinessData({...businessData, email: text})}
            placeholder="your@email.com"
            placeholderTextColor="#94a3b8"
            textAlign="right"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            <Ionicons name="location" size={16} color="#64748b" /> כתובת העסק
          </Text>
          <TextInput
            style={styles.input}
            value={businessData.address}
            onChangeText={(text) => setBusinessData({...businessData, address: text})}
            placeholder="הזן את כתובת העסק המלאה"
            placeholderTextColor="#94a3b8"
            textAlign="right"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            <Ionicons name="document-text-outline" size={16} color="#64748b" /> אודות העסק
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={businessData.about}
            onChangeText={(text) => setBusinessData({...businessData, about: text})}
            placeholder="ספר ללקוחות על העסק שלך, השירותים שאתה מציע והניסיון שלך..."
            placeholderTextColor="#94a3b8"
            textAlign="right"
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cog" size={24} color="#2563eb" />
          <Text style={styles.cardTitle}>הגדרות נוספות</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>
              התראות
            </Text>
            <Text style={styles.settingDescription}>קבל התראות על הזמנות חדשות</Text>
          </View>
          <Switch
            value={businessData.settings.notificationsEnabled}
            onValueChange={(value) => 
              setBusinessData({
                ...businessData, 
                settings: {...businessData.settings, notificationsEnabled: value}
              })
            }
            trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
            thumbColor={businessData.settings.notificationsEnabled ? '#2563eb' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>
              אישור אוטומטי
            </Text>
            <Text style={styles.settingDescription}>אשר הזמנות באופן אוטומטי</Text>
          </View>
          <Switch
            value={businessData.settings.autoConfirm}
            onValueChange={(value) => 
              setBusinessData({
                ...businessData, 
                settings: {...businessData.settings, autoConfirm: value}
              })
            }
            trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
            thumbColor={businessData.settings.autoConfirm ? '#2563eb' : '#94a3b8'}
          />
        </View>
      </View>
    </ScrollView>
  );

  // if (loading || !businessData) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#2196F3" />
  //       <Text style={styles.loadingText}>טוען נתונים...</Text>
  //     </View>
  //   );
  // }

  return (
    <SafeAreaView style={styles.container}>
      <BusinessSidebar 
        isVisible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        businessData={businessData}
        currentScreen="BusinessSettings"
      />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Color.primaryColorAmaranthPurple} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>הגדרות העסק</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsSidebarOpen(true)}
          >
            <Ionicons name="menu-outline" size={24} color={Color.primaryColorAmaranthPurple} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, activeTab === "general" && styles.activeTab]}
          onPress={() => setActiveTab("general")}
        >
          <Ionicons name="card-text-outline" size={18} color={activeTab === "general" ? "#2563eb" : "#64748b"} />
          <Text style={[styles.tabText, activeTab === "general" && styles.activeTabText]}>
            פרטי העסק
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === "services" && styles.activeTab]}
          onPress={() => setActiveTab("services")}
        >
          <Ionicons name="scissors-cutting" size={18} color={activeTab === "services" ? "#2563eb" : "#64748b"} />
          <Text style={[styles.tabText, activeTab === "services" && styles.activeTabText]}>
            שירותים
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === "hours" && styles.activeTab]}
          onPress={() => setActiveTab("hours")}
        >
          <Ionicons name="clock-outline" size={18} color={activeTab === "hours" ? "#2563eb" : "#64748b"} />
          <Text style={[styles.tabText, activeTab === "hours" && styles.activeTabText]}>
            שעות פעילות
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "general" && renderGeneralTab()}
        {activeTab === "services" && (
          <BusinessServicesSettings 
            services={businessData.services}
            onServicesChange={services => setBusinessData({...businessData, services})}
          />
        )}
        {activeTab === "hours" && (
          <BusinessHoursSettings 
            workHours={businessData.workHours}
            onHoursChange={workHours => setBusinessData({...businessData, workHours})}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="content-save" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>שמור שינויים</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  header: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamily.rubikMedium,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontFamily: FontFamily.rubikRegular,
    color: '#64748b',
  },
  activeTabText: {
    color: '#2563eb',
    fontFamily: FontFamily.rubikSemiBold,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FontFamily.rubikSemiBold,
  },
  tabContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerIcon: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FontFamily.rubikBold,
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: FontFamily.rubikRegular,
    color: '#64748b',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FontFamily.rubikBold,
    color: '#2563eb',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.rubikSemiBold,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: FontFamily.rubikRegular,
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: FontFamily.rubikSemiBold,
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: FontFamily.rubikRegular,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: FontFamily.rubikRegular,
    color: '#64748b',
  },
});
