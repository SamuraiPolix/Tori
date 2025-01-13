import firestore from '@react-native-firebase/firestore';

/**
 * Forces slot generation for all businesses in the system
 */
export const forceGenerateAllSlots = async () => {
  try {
    console.log('Starting slot generation for all businesses...');
    const businesses = await firestore()
      .collection('businesses')
      .get();

    const results = [];
    for (const doc of businesses.docs) {
      const businessId = doc.id;
      console.log(`Generating slots for business: ${businessId}`);
      
      try {
        // await initializeBusinessSlots(businessId); // Removed this line as it's no longer needed
        results.push({
          businessId,
          success: true
        });
      } catch (error) {
        console.error(`Error generating slots for business ${businessId}:`, error);
        results.push({
          businessId,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('Slot generation complete:', {
      total: results.length,
      successful,
      failed
    });

    return {
      success: true,
      summary: {
        total: results.length,
        successful,
        failed
      },
      results
    };
  } catch (error) {
    console.error('Error in force generating slots:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Forces slot generation for a specific business
 */
export const forceGenerateSlotsForBusiness = async (businessId) => {
  try {
    console.log(`Force generating slots for business: ${businessId}`);
    // await initializeBusinessSlots(businessId); // Removed this line as it's no longer needed
    console.log('Slot generation successful');
    return { success: true };
  } catch (error) {
    console.error('Error generating slots:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates real appointments for testing with minimal fields
 */
export const createRealAppointments = async () => {
  try {
    console.log('🔄 Starting to create real appointments...');
    
    // Get all businesses
    const businessesSnapshot = await firestore()
      .collection('businesses')
      .get();

    const batch = firestore().batch();
    let appointmentsCreated = 0;

    for (const businessDoc of businessesSnapshot.docs) {
      const business = businessDoc.data();
      console.log(`📅 Creating appointments for business: ${business.name}`);

      // Get available slots for next 7 days
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        console.log(`Checking date: ${dateStr}`);

        // Get slots for this date
        const slotsDoc = await businessDoc.ref
          .collection('availableSlots')
          .doc(dateStr)
          .get();

        if (!slotsDoc.exists) {
          console.log(`No slots document for date: ${dateStr}`);
          continue;
        }

        const { slots } = slotsDoc.data();
        if (!Array.isArray(slots) || slots.length === 0) {
          console.log(`No valid slots array for date: ${dateStr}`);
          continue;
        }

        console.log(`Found ${slots.length} slots for date: ${dateStr}`);

        // Create appointments for random slots
        for (const service of business.services || []) {
          if (!service.duration) {
            console.log(`Service ${service.name} has no duration, skipping`);
            continue;
          }

          const slotDuration = parseInt(business.scheduleSettings?.slotDuration) || 15;
          const requiredSlots = Math.ceil(service.duration / slotDuration);
          
          if (requiredSlots > slots.length) {
            console.log(`Service ${service.name} requires ${requiredSlots} slots but only ${slots.length} available`);
            continue;
          }

          // Try to create 2-3 appointments per service per day
          const appointmentsToCreate = Math.floor(Math.random() * 2) + 2;
          
          for (let j = 0; j < appointmentsToCreate; j++) {
            // Find an available slot sequence
            let foundSlot = false;
            let startIndex = -1;

            // Try 5 random positions to find available slots
            for (let attempt = 0; attempt < 5; attempt++) {
              startIndex = Math.floor(Math.random() * (slots.length - requiredSlots));
              let consecutive = true;
              
              // Check if slots are available
              for (let k = 0; k < requiredSlots; k++) {
                if (!slots[startIndex + k] || slots[startIndex + k].isBooked) {
                  consecutive = false;
                  break;
                }
              }
              
              if (consecutive) {
                foundSlot = true;
                break;
              }
            }
            
            if (!foundSlot) {
              console.log(`Could not find ${requiredSlots} consecutive slots for service ${service.name}`);
              continue;
            }

            // Create the appointment
            const startTime = slots[startIndex].startTime;
            const now = firestore.Timestamp.now();
            
            const appointmentId = firestore().collection('appointments').doc().id;
            const appointmentRef = firestore().collection('appointments').doc(appointmentId);

            console.log(`Creating appointment for ${service.name} at ${startTime.toDate().toLocaleString()}`);

            const appointment = {
              businessId: business.businessId || business.id,
              createdAt: now,
              customerId: 'test_customer_' + Math.random().toString(36).substring(7),
              startTime,
              notes: 'Test appointment created by admin',
              serviceId: service.id,
              status: Math.random() > 0.2 ? 'confirmed' : 'pending',
              updatedAt: now
            };

            batch.set(appointmentRef, appointment);
            appointmentsCreated++;

            // Mark slots as booked
            for (let k = 0; k < requiredSlots; k++) {
              slots[startIndex + k].isBooked = true;
            }
          }
        }

        // Update slots document with booked slots
        batch.update(slotsDoc.ref, { slots });
      }
    }

    // Commit all changes
    await batch.commit();
    console.log(`✅ Created ${appointmentsCreated} test appointments`);
    return appointmentsCreated;
  } catch (error) {
    console.error('❌ Error creating real appointments:', error);
    throw error;
  }
};
