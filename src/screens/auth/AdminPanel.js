import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AdminPanel = ({ navigation }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createAppointmentsForBusiness = async (business, startDate, db) => {
    const businessData = business.data();
    const businessId = business.id;
    const now = firestore.Timestamp.now();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const daysMap = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };

    while (startDate < endDate) {
      const dayOfWeek = startDate.getDay();
      const dayName = daysMap[dayOfWeek];
      const daySchedule = businessData.workingHours?.[dayName] || { isOpen: false };
      const slotDuration = businessData.scheduleSettings?.slotDuration || 30;

      if (daySchedule.isOpen && daySchedule.open && daySchedule.close) {
        const [openHours, openMinutes] = daySchedule.open.split(':').map(Number);
        const [closeHours, closeMinutes] = daySchedule.close.split(':').map(Number);

        const dayStartTime = new Date(startDate);
        dayStartTime.setHours(openHours, openMinutes, 0, 0);
        const dayEndTime = new Date(startDate);
        dayEndTime.setHours(closeHours, closeMinutes, 0, 0);

        let currentSlot = dayStartTime;
        while (currentSlot < dayEndTime) {
          await db.collection("appointments").add({
            businessId,
            createdAt: now,
            customerId: null,
            notes: null,
            serviceId: "0",
            startTime: firestore.Timestamp.fromDate(currentSlot),
            status: "available",
            updatedAt: now,
          });
          currentSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
        }
      }
      startDate.setDate(startDate.getDate() + 1);
    }
  };

  const generateAppointments = async () => {
    try {
      setIsGenerating(true);
      const db = firestore();
      const businessesSnapshot = await db.collection("businesses").get();
      
      console.log(`Found ${businessesSnapshot.size} businesses. Starting appointment generation...`);
      let successCount = 0;
      let errorCount = 0;
      
      for (const businessDoc of businessesSnapshot.docs) {
        console.log(`Generating appointments for business: ${businessDoc.id}`);
        try {
          const startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          await createAppointmentsForBusiness(businessDoc, startDate, db);
          console.log(`Successfully generated appointments for business: ${businessDoc.id}`);
          successCount++;
        } catch (error) {
          console.error(`Error generating appointments for business ${businessDoc.id}:`, error);
          errorCount++;
        }
      }

      Alert.alert(
        "Success",
        `Generated appointments for ${successCount} businesses. Failed for ${errorCount} businesses.`
      );
    } catch (error) {
      console.error("Error generating appointments:", error);
      Alert.alert("Error", "Failed to generate appointments");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteAvailableAppointments = async () => {
    try {
      setIsDeleting(true);
      const db = firestore();
      
      // Get all available appointments
      const appointmentsSnapshot = await db.collection("appointments")
        .where("status", "==", "available")
        .get();

      console.log(`Found ${appointmentsSnapshot.size} available appointments to delete...`);

      // Confirm with user
      Alert.alert(
        "אישור מחיקה",
        `האם אתה בטוח שברצונך למחוק ${appointmentsSnapshot.size} תורים פנויים?`,
        [
          {
            text: "ביטול",
            style: "cancel"
          },
          {
            text: "מחק",
            style: "destructive",
            onPress: async () => {
              try {
                // Delete in batches of 500 (Firestore limit)
                const batchSize = 500;
                const batches = [];
                let batch = db.batch();
                let operationCount = 0;

                for (const doc of appointmentsSnapshot.docs) {
                  batch.delete(doc.ref);
                  operationCount++;

                  if (operationCount === batchSize) {
                    batches.push(batch.commit());
                    batch = db.batch();
                    operationCount = 0;
                  }
                }

                // Commit any remaining operations
                if (operationCount > 0) {
                  batches.push(batch.commit());
                }

                await Promise.all(batches);
                Alert.alert(
                  "הצלחה",
                  `נמחקו ${appointmentsSnapshot.size} תורים פנויים`
                );
              } catch (error) {
                console.error("Error deleting appointments:", error);
                Alert.alert(
                  "שגיאה",
                  "אירעה שגיאה במחיקת התורים"
                );
              } finally {
                setIsDeleting(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error getting appointments:", error);
      Alert.alert(
        "שגיאה",
        "אירעה שגיאה בטעינת התורים"
      );
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      
      <TouchableOpacity
        style={[styles.button, isGenerating && styles.disabledButton]}
        onPress={generateAppointments}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.buttonText}>יוצר תורים...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>צור תורים לכל העסקים</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, isDeleting && styles.disabledButton]}
        onPress={deleteAvailableAppointments}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.buttonText}>מוחק תורים...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>מחק את כל התורים הפנויים</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeButtonText}>סגור</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily["Assistant-Bold"],
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  closeButton: {
    backgroundColor: '#757575',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FontFamily["Assistant-SemiBold"],
  },
});

export default AdminPanel;
