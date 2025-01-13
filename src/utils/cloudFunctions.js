import functions from '@react-native-firebase/functions';
import firestore from '@react-native-firebase/firestore';

// Function to process appointment creation
export const processAppointmentCreation = async (appointmentData) => {
  try {
    const { customerId, businessId, startTime, serviceId, notes = "" } = appointmentData;
    const batch = firestore().batch();

    // Create appointment document
    const appointmentRef = firestore().collection('appointments').doc();
    const appointmentDoc = {
      businessId,
      customerId,
      serviceId,
      startTime: firestore.Timestamp.fromDate(new Date(startTime)),
      notes,
      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    batch.set(appointmentRef, appointmentDoc);

    // Remove the time slot from available slots
    const dateStr = new Date(startTime).toISOString().split('T')[0];
    const slotRef = firestore()
      .collection('businesses')
      .doc(businessId)
      .collection('availableSlots')
      .doc(dateStr);

    // Get current slots
    const slotsDoc = await slotRef.get();
    if (slotsDoc.exists) {
      const slots = slotsDoc.data().slots || [];
      const updatedSlots = slots.filter(slot => 
        new Date(slot.startTime).getTime() !== new Date(startTime).getTime()
      );
      batch.update(slotRef, { slots: updatedSlots });
    }

    // Update business statistics
    const businessRef = firestore().collection('businesses').doc(businessId);
    batch.update(businessRef, {
      totalAppointments: firestore.FieldValue.increment(1),
      lastAppointmentDate: firestore.FieldValue.serverTimestamp()
    });

    // Commit all changes
    await batch.commit();
    console.log('Successfully processed appointment creation');
    return appointmentRef.id;
  } catch (error) {
    console.error('Error processing appointment:', error);
    throw error;
  }
};

// Function to process appointment cancellation
export const processAppointmentCancellation = async (appointmentId) => {
  try {
    const batch = firestore().batch();

    // Get the appointment data
    const appointmentRef = firestore().collection('appointments').doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    
    if (!appointmentDoc.exists) {
      throw new Error('Appointment not found');
    }

    const appointmentData = appointmentDoc.data();
    const { businessId, startTime } = appointmentData;

    // Add the time slot back to available slots
    const dateStr = new Date(startTime.toDate()).toISOString().split('T')[0];
    const slotRef = firestore()
      .collection('businesses')
      .doc(businessId)
      .collection('availableSlots')
      .doc(dateStr);

    // Get current slots
    const slotsDoc = await slotRef.get();
    if (slotsDoc.exists) {
      const slots = slotsDoc.data().slots || [];
      slots.push({ startTime });
      // Sort slots by time
      slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      batch.update(slotRef, { slots });
    } else {
      // Create new slots document if it doesn't exist
      batch.set(slotRef, { slots: [{ startTime }] });
    }

    // Update the appointment status
    batch.update(appointmentRef, {
      status: 'cancelled',
      updatedAt: firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    console.log('Successfully processed appointment cancellation');
    return true;
  } catch (error) {
    console.error('Error processing appointment cancellation:', error);
    throw error;
  }
};

// Function to reschedule an appointment
export const rescheduleAppointment = async (appointmentId, newStartTime) => {
  try {
    const batch = firestore().batch();

    // Get the appointment data
    const appointmentRef = firestore().collection('appointments').doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    
    if (!appointmentDoc.exists) {
      throw new Error('Appointment not found');
    }

    const appointmentData = appointmentDoc.data();
    const { businessId, startTime: oldStartTime } = appointmentData;

    // 1. Add the old time slot back to available slots
    const oldDateStr = new Date(oldStartTime.toDate()).toISOString().split('T')[0];
    const oldSlotRef = firestore()
      .collection('businesses')
      .doc(businessId)
      .collection('availableSlots')
      .doc(oldDateStr);

    // Get current slots for old date
    const oldSlotsDoc = await oldSlotRef.get();
    if (oldSlotsDoc.exists) {
      const slots = oldSlotsDoc.data().slots || [];
      slots.push({ startTime: oldStartTime });
      slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      batch.update(oldSlotRef, { slots });
    } else {
      batch.set(oldSlotRef, { slots: [{ startTime: oldStartTime }] });
    }

    // 2. Remove the new time slot from available slots
    const newDateStr = new Date(newStartTime).toISOString().split('T')[0];
    const newSlotRef = firestore()
      .collection('businesses')
      .doc(businessId)
      .collection('availableSlots')
      .doc(newDateStr);

    // Get current slots for new date
    const newSlotsDoc = await newSlotRef.get();
    if (newSlotsDoc.exists) {
      const slots = newSlotsDoc.data().slots || [];
      const updatedSlots = slots.filter(slot => 
        new Date(slot.startTime).getTime() !== new Date(newStartTime).getTime()
      );
      batch.update(newSlotRef, { slots: updatedSlots });
    }

    // 3. Update the appointment with new time
    batch.update(appointmentRef, {
      startTime: firestore.Timestamp.fromDate(new Date(newStartTime)),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      status: 'rescheduled'
    });

    await batch.commit();
    console.log('Successfully rescheduled appointment');
    return true;
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    throw error;
  }
};
