import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '../../styles/GlobalStyles';

const EditCustomer = ({ navigation, route }) => {
  const { customer } = route.params;
  const [customerData, setCustomerData] = useState({
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
  });

  const handleSave = () => {
    // כאן יתבצע שמירת הנתונים לשרת
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-forward" size={24} color="#333" />
            <Text style={styles.backButtonText}>חזור</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✏️ עריכת פרטי לקוח</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>👤 שם מלא</Text>
            <TextInput
              style={styles.input}
              value={customerData.name}
              onChangeText={(text) => setCustomerData({ ...customerData, name: text })}
              placeholder="הכנס שם מלא"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📱 טלפון</Text>
            <TextInput
              style={styles.input}
              value={customerData.phone}
              onChangeText={(text) => setCustomerData({ ...customerData, phone: text })}
              placeholder="הכנס מספר טלפון"
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📧 אימייל</Text>
            <TextInput
              style={styles.input}
              value={customerData.email}
              onChangeText={(text) => setCustomerData({ ...customerData, email: text })}
              placeholder="הכנס כתובת אימייל"
              keyboardType="email-address"
              textAlign="right"
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>💾 שמור שינויים</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    paddingTop: 40, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: FontFamily["Assistant-Bold"],
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginRight: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    color: '#333',
    marginRight: 4,
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontFamily: FontFamily["Assistant-SemiBold"],
    color: '#444',
    marginBottom: 10,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: FontFamily["Assistant-Regular"],
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saveButton: {
    backgroundColor: '#2563eb', 
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: FontFamily["Assistant-Bold"],
  },
});

export default EditCustomer;
