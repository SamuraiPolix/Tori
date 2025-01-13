const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// All Firebase function triggers are temporarily disabled

/*
exports.generateDailySlots = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Jerusalem")
  .onRun(async (context) => {
    // Implementation commented out
});

exports.cleanupOldSlots = functions.pubsub
  .schedule("0 1 * * *")
  .timeZone("Asia/Jerusalem")
  .onRun(async (context) => {
    // Implementation commented out
});
*/

// Export empty functions to maintain structure
exports.generateDailySlots = () => null;
exports.cleanupOldSlots = () => null;
