/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Helper function to create appointments for a business
async function createAppointmentsForBusiness(business, startDate, db) {
  // Function implementation commented out temporarily
  console.log('createAppointmentsForBusiness disabled');
  return null;
}

// All Firebase function triggers are temporarily disabled

/*
// When a new business is registered
exports.onBusinessCreated = functions.firestore
  .document("businesses/{businessId}")
  .onCreate(async (snap, context) => {
    // Implementation commented out
});

// 1. Create appointments for a day in a month at 02:00
exports.createDailyAppointments = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("Asia/Jerusalem")
  .onRun(async (context) => {
    // Implementation commented out
});

// 2. Add new available appointment to business's availableSlots
exports.onAppointmentCreated = functions.firestore
  .document("appointments/{appointmentId}")
  .onCreate(async (snap, context) => {
    // Implementation commented out
});

// 3. Handle appointment booking
exports.onAppointmentUpdate = functions.firestore
  .document("appointments/{appointmentId}")
  .onUpdate(async (change, context) => {
    // Implementation commented out
});
*/

// Export empty objects for all functions to maintain structure
exports.onBusinessCreated = () => null;
exports.createDailyAppointments = () => null;
exports.onAppointmentCreated = () => null;
exports.onAppointmentUpdate = () => null;
