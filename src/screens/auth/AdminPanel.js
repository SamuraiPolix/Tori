import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AdminPanel = ({ navigation }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);

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

  const migrateAppointments = async () => {
    try {
      // Confirm with user before starting
      Alert.alert(
        'Start Migration',
        'This will update all appointments to include customer and service data. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                setIsMigrating(true);
                setMigrationProgress(0);
                
                const db = firestore();
                
                // Get all non-available appointments
                const appointmentsSnapshot = await db
                  .collection('appointments')
                  .where('status', '!=', 'available')
                  .get();
                
                const totalAppointments = appointmentsSnapshot.docs.length;
                
                if (totalAppointments === 0) {
                  Alert.alert('Info', 'No appointments found to migrate');
                  return;
                }

                console.log(`Starting migration of ${totalAppointments} appointments...`);
                let successCount = 0;
                let errorCount = 0;
                let skippedCount = 0;
                let batch = db.batch();
                let batchCount = 0;

                for (const doc of appointmentsSnapshot.docs) {
                  try {
                    const appointment = doc.data();
                    
                    // Skip if already migrated
                    if (appointment.customerName && appointment.serviceName) {
                      skippedCount++;
                      continue;
                    }

                    // Skip if no customer ID or service ID
                    if (!appointment.customerId || !appointment.serviceId) {
                      console.warn(`Skipping appointment ${doc.id} - missing customer or service ID`);
                      skippedCount++;
                      continue;
                    }

                    // Get customer data
                    const customerDoc = await db.collection('users').doc(appointment.customerId).get();
                    const customerData = customerDoc.data();

                    if (!customerDoc.exists) {
                      console.warn(`Customer ${appointment.customerId} not found for appointment ${doc.id}`);
                      errorCount++;
                      continue;
                    }

                    // Get business and service data
                    const businessDoc = await db.collection('businesses').doc(appointment.businessId).get();
                    const businessData = businessDoc.data();
                    
                    if (!businessDoc.exists) {
                      console.warn(`Business ${appointment.businessId} not found for appointment ${doc.id}`);
                      errorCount++;
                      continue;
                    }

                    const serviceData = businessData?.services?.[appointment.serviceId];
                    
                    if (!serviceData) {
                      console.warn(`Service ${appointment.serviceId} not found in business ${appointment.businessId}`);
                      errorCount++;
                      continue;
                    }

                    // Update appointment with denormalized data
                    batch.update(doc.ref, {
                      customerName: customerData.name || 'לקוח לא זמין',
                      customerPhone: customerData.phone || customerData.phoneNumber || 'לא זמין',
                      serviceName: serviceData.name || 'שירות לא זמין',
                      servicePrice: parseInt(serviceData.price) || 0,
                      serviceDuration: parseInt(serviceData.duration) || 0,
                      updatedAt: firestore.FieldValue.serverTimestamp()
                    });

                    batchCount++;
                    successCount++;

                    // Commit every 500 updates
                    if (batchCount === 500) {
                      await batch.commit();
                      console.log(`Migrated ${successCount} appointments`);
                      batch = db.batch();
                      batchCount = 0;
                    }

                    // Update progress
                    const progress = Math.round((successCount / totalAppointments) * 100);
                    setMigrationProgress(progress);

                  } catch (error) {
                    console.error(`Error migrating appointment ${doc.id}:`, error);
                    errorCount++;
                  }
                }

                // Commit any remaining updates
                if (batchCount > 0) {
                  await batch.commit();
                }

                const message = [
                  `Successfully migrated: ${successCount} appointments`,
                  `Skipped (already migrated): ${skippedCount} appointments`,
                  `Failed: ${errorCount} appointments`
                ].join('\n');

                Alert.alert('Migration Complete', message);
                console.log(`Migration complete.\n${message}`);

              } catch (error) {
                console.error('Error in migration:', error);
                Alert.alert('Error', 'Failed to migrate appointments: ' + error.message);
              } finally {
                setIsMigrating(false);
                setMigrationProgress(0);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error showing migration alert:', error);
      Alert.alert('Error', 'Failed to start migration');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointment Management</Text>
        
        <TouchableOpacity
          style={[styles.button, isGenerating && styles.buttonDisabled]}
          onPress={generateAppointments}
          disabled={isGenerating}>
          <Text style={styles.buttonText}>
            {isGenerating ? 'Generating...' : 'Generate Available Appointments'}
          </Text>
          {isGenerating && <ActivityIndicator color="#FFFFFF" style={styles.spinner} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isDeleting && styles.buttonDisabled]}
          onPress={deleteAvailableAppointments}
          disabled={isDeleting}>
          <Text style={styles.buttonText}>
            {isDeleting ? 'Deleting...' : 'Delete Available Appointments'}
          </Text>
          {isDeleting && <ActivityIndicator color="#FFFFFF" style={styles.spinner} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isMigrating && styles.buttonDisabled]}
          onPress={migrateAppointments}
          disabled={isMigrating}>
          <Text style={styles.buttonText}>
            {isMigrating ? `Migrating (${migrationProgress}%)` : 'Migrate Appointment Data'}
          </Text>
          {isMigrating && <ActivityIndicator color="#FFFFFF" style={styles.spinner} />}
        </TouchableOpacity>
      </View>

      {isMigrating && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${migrationProgress}%` }]} />
          <Text style={styles.progressText}>{migrationProgress}% Complete</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    marginBottom: 20,
    color: '#333333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    marginBottom: 15,
    color: '#444444',
  },
  button: {
    backgroundColor: '#156779',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.medium,
    marginRight: 10,
  },
  spinner: {
    marginLeft: 10,
  },
  progressContainer: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: 20,
    backgroundColor: '#156779',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 20,
    color: '#000000',
    fontFamily: FontFamily.medium,
  },
});

export default AdminPanel;
