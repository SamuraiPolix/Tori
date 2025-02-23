/**
 * Firebase Cloud Functions for Tori app
 * Handles notifications and appointment management
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { sendNotificationToUser } = require("./notifications");

admin.initializeApp();

/**
 * Creates a notification when an appointment status changes
 * @param {Object} change - The change object containing before and after snapshots
 * @param {Object} context - The event context
 * @return {Promise<void>}
 */
exports.onAppointmentStatusChange = functions.firestore
  .document("appointments/{appointmentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only proceed if status has changed
    if (before.status === after.status) {
      return;
    }

    const appointmentId = context.params.appointmentId;
    const businessId = after.businessId;

    // Get business data
    const businessDoc = await admin.firestore()
      .collection("businesses")
      .doc(businessId)
      .get();

    const businessName = businessDoc.data()?.name || "Business";

    let notification;
    switch (after.status) {
      case "approved":
        notification = {
          title: "Appointment Approved",
          body: `Your appointment with ${businessName} has been approved`,
          data: {
            appointmentId,
            type: "appointment_status",
            status: "approved",
          },
        };
        await sendNotificationToUser(after.customerId, notification);
        break;

      case "canceled":
        notification = {
          title: "Appointment Canceled",
          body: `Your appointment with ${businessName} has been canceled`,
          data: {
            appointmentId,
            type: "appointment_status",
            status: "canceled",
          },
        };
        await sendNotificationToUser(after.customerId, notification);
        break;

      case "pending":
        notification = {
          title: "Appointment Status Update",
          body: `Your appointment request with ${businessName} is pending confirmation`,
          data: {
            appointmentId,
            type: "appointment_status",
            status: "pending",
          },
        };
        await sendNotificationToUser(after.customerId, notification);
        break;

      default:
        break;
    }
  });

/**
 * Notifies business when a new appointment is created
 */
exports.onAppointmentCreation = functions.firestore
  .document("appointments/{appointmentId}")
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    const appointmentId = context.params.appointmentId;
    const businessId = appointment.businessId;
    const customerId = appointment.customerId;

    // Get business and customer data
    const [businessDoc, customerDoc] = await Promise.all([
      admin.firestore().collection("businesses").doc(businessId).get(),
      admin.firestore().collection("users").doc(customerId).get(),
    ]);

    const businessData = businessDoc.data();
    const customerName = customerDoc.data()?.name || "Customer";

    let title;
    let body;
    let status;
    if (appointment.status === "approved") {
      title = "New Appointment Created";
      body = `New appointment made by ${customerName}`;
      status = "approved";
    } else {
      title = "New Appointment Waiting for Confirmation";
      body = `New appointment waiting for confirmation by ${customerName}`;
      status = "pending";
    }

    const notification = {
      title: title,
      body: body,
      data: {
        appointmentId,
        type: "new_appointment",
        status: status,
      },
    };

    await sendNotificationToUser(businessId, notification);
  });

/**
 * Processes notifications from the notifications collection
 * @param {Object} snap - The snapshot of the created document
 * @param {Object} context - The event context
 * @return {Promise<void>}
 */
// exports.processNotification = functions.firestore
//   .document("notifications/{notificationId}")
//   .onCreate(async (snap, context) => {
//     const notification = snap.data();

//     if (notification.userId) {
//       await sendNotificationToUser(notification.userId, notification);
//     } else if (notification.topic) {
//       await sendNotificationToTopic(notification.topic, notification);
//     }
//   });

// Export empty objects for all functions to maintain structure
exports.onBusinessCreated = () => null;
exports.createDailyAppointments = () => null;
exports.onAppointmentCreated = () => null;
exports.onAppointmentUpdate = () => null;
