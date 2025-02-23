const admin = require("firebase-admin");

/**
 * Sends a notification to a specific user
 * @param {string} userId - The user ID to send the notification to
 * @param {Object} notification - The notification object
 * @param {string} notification.title - The notification title
 * @param {string} notification.body - The notification body
 * @param {Object} [notification.data] - Optional data payload
 * @return {Promise<boolean>} Returns true if successful, false otherwise
 */
async function sendNotificationToUser(userId, notification) {
  try {
    // Get user's FCM token
    let userDoc = await admin.firestore().collection("users").doc(userId).get();
    if (!userDoc.exists || !userDoc.data()?.fcmToken) {
      userDoc = await admin.firestore().collection("businesses").doc(userId).get();
    }
    const userData = userDoc.data();

    if (!userData?.fcmToken) {
      console.log("No FCM token found for user:", userId);
      return false;
    }

    // Send the notification
    await admin.messaging().send({
      token: userData.fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: "high",
        notification: {
          channelId: "high-priority",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: "default",
            badge: 1,
          },
        },
        headers: {
          "apns-priority": "10",
        },
      },
    });

    // Log success
    await admin.firestore().collection("notifications").add({
      userId,
      ...notification,
      status: "sent",
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    // Log fail
    await admin.firestore().collection("notifications").add({
      userId,
      ...notification,
      status: "failed",
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return false;
  }
}

/**
 * Sends a notification to multiple users
 * @param {string[]} userIds - Array of user IDs to send the notification to
 * @param {Object} notification - The notification object
 * @return {Promise<boolean>} Returns true if all notifications were sent successfully
 */
async function sendNotificationToUsers(userIds, notification) {
  const results = await Promise.all(
    userIds.map((userId) => sendNotificationToUser(userId, notification)),
  );
  return results.every((result) => result);
}

/**
 * Sends a notification to a topic
 * @param {string} topic - The topic to send the notification to
 * @param {Object} notification - The notification object
 * @return {Promise<boolean>} Returns true if successful, false otherwise
 */
async function sendNotificationToTopic(topic, notification) {
  try {
    await admin.messaging().send({
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: "high",
        notification: {
          channelId: "high-priority",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: "default",
            badge: 1,
          },
        },
        headers: {
          "apns-priority": "10",
        },
      },
    });

    // Log success
    await admin.firestore().collection("notifications").add({
      topic,
      ...notification,
      status: "sent",
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error sending topic notification:", error);
    // Log fail
    await admin.firestore().collection("notifications").add({
      topic,
      ...notification,
      status: "failed",
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return false;
  }
}

module.exports = {
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToTopic,
};
