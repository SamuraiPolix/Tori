import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

class FirebaseApi {
  // Auth methods
  static getCurrentUser() {
    return auth().currentUser;
  }

  static async signUp(email, password, name) {
    const { user } = await auth().createUserWithEmailAndPassword(email, password);
    
    await user.updateProfile({
      displayName: name.trim()
    });

    const userData = {
      uid: user.uid,
      name: name.trim(),
      email: email,
      phoneNumber: null,
      createdAt: this.getServerTimestamp(),
      updatedAt: this.getServerTimestamp(),
      lastLogin: this.getServerTimestamp()
    };

    await this.createUserData(user.uid, userData);
    return { user, userData };
  }

  // Business methods
  static subscribeToBusinessData(userId, onData, onError) {
    return firestore()
      .collection('businesses')
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            onData(doc.data());
          } else {
            onData(null);
          }
        },
        onError
      );
  }

  static subscribeToAppointmentsByStatus(businessId, status, onData, onError) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = firestore()
      .collection('appointments')
      .where('businessId', '==', businessId)
      .where('status', '==', status);

    // Add date filter for approved and canceled appointments
    if (status === 'approved' || status === 'canceled') {
      query = query.where('startTime', '>=', firestore.Timestamp.fromDate(today));
    }

    // Add ordering
    if (status === 'completed') {
      query = query.orderBy('startTime', 'desc').limit(100);
    } else {
      query = query.orderBy('startTime', 'asc');
    }

    return query.onSnapshot(
      (snapshot) => {
        if (!snapshot.empty) {
          const appointments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          onData(appointments);
        } else {
          onData([]);
        }
      },
      onError
    );
  }

  static subscribeToPendingAppointments(businessId, onData, onError) {
    return this.subscribeToAppointmentsByStatus(businessId, 'pending', onData, onError);
  }

  static subscribeToApprovedAppointments(businessId, onData, onError) {
    return this.subscribeToAppointmentsByStatus(businessId, 'approved', onData, onError);
  }

  static subscribeToCanceledAppointments(businessId, onData, onError) {
    return this.subscribeToAppointmentsByStatus(businessId, 'canceled', onData, onError);
  }

  static subscribeToCompletedAppointments(businessId, onData, onError) {
    return this.subscribeToAppointmentsByStatus(businessId, 'completed', onData, onError);
  }

  static async getBusinessData(businessId) {
    try {
      if (!businessId) {
        console.warn('No businessId provided to getBusinessData');
        return null;
      }

      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .get();

      if (!businessDoc.exists) {
        console.warn(`No business found with ID: ${businessId}`);
        return null;
      }

      const data = businessDoc.data();
      console.log('Business data retrieved:', {
        id: businessId,
        name: data.name,
        hasServices: !!data.services,
        servicesCount: data.services ? Object.keys(data.services).length : 0
      });

      return {
        id: businessId,
        ...data
      };
    } catch (error) {
      console.error('Error getting business data:', error);
      throw error;
    }
  }

  static async getBusinessServices(businessId) {
    try {
      const businessData = await this.getBusinessData(businessId);
      if (!businessData || !businessData.services) {
        console.warn(`No services found for business: ${businessId}`);
        return {};
      }
      return businessData.services;
    } catch (error) {
      console.error('Error getting business services:', error);
      throw error;
    }
  }

  static async updateBusinessData(businessId, data) {
    await firestore()
      .collection('businesses')
      .doc(businessId)
      .update(data);
  }

  static async createBusiness(businessId, data) {
    await firestore()
      .collection('businesses')
      .doc(businessId)
      .set(data);
  }

  static async getBusinessAllAppointments(businessId) {
    // Get current date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsSnapshot = await firestore()
      .collection('appointments')
      .where('businessId', '==', businessId)
      .where('startTime', '>=', firestore.Timestamp.fromDate(today))
      .orderBy('startTime', 'asc')
      .get();

    return appointmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      const startTime = data.startTime.toDate();
      
      return {
        id: doc.id,
        ...data,
        formattedDate: startTime.toLocaleDateString('he-IL'),
        time: startTime.toLocaleTimeString('he-IL', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        // Use denormalized data
        userData: {
          name: data.customerName || 'לקוח לא זמין',
          phone: data.customerPhone || 'לא זמין',
          email: data.customerEmail || ''
        },
        service: {
          id: data.serviceId,
          name: data.serviceName || 'שירות לא זמין',
          duration: data.serviceDuration || 0,
          price: data.servicePrice || 0
        }
      };
    });
  }

  static async getBusinessAppointments(businessId, dateStr) {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const appointmentsSnapshot = await firestore()
      .collection('appointments')
      .where('businessId', '==', businessId)
      .where('startTime', '>=', firestore.Timestamp.fromDate(startOfDay))
      .where('startTime', '<=', firestore.Timestamp.fromDate(endOfDay))
      .get();

    return appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async getBusinessTimeSlots(businessId, dateStr, workingHours, slotDuration, existingAppointments) {
    const slots = {};
    const [startHour, startMinute] = workingHours.open.split(':').map(Number);
    const [endHour, endMinute] = workingHours.close.split(':').map(Number);
    
    const startTime = new Date(dateStr);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(dateStr);
    endTime.setHours(endHour, endMinute, 0, 0);

    const currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const hour = currentTime.getHours().toString().padStart(2, '0');
      if (!slots[hour]) {
        slots[hour] = [];
      }

      const slotTime = new Date(currentTime);
      const slotEndTime = new Date(slotTime.getTime() + slotDuration * 60000);

      // Check if slot overlaps with any existing appointment
      const isAvailable = !existingAppointments.some(appointment => {
        const appointmentStart = appointment.startTime.toDate();
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
        return (
          (slotTime >= appointmentStart && slotTime < appointmentEnd) ||
          (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd)
        );
      });

      slots[hour].push({
        time: slotTime,
        available: isAvailable
      });

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    return slots;
  }

  static async getServiceDetails(businessId, serviceId) {
    if (!serviceId) return null;

    const businessDoc = await firestore()
      .collection('businesses')
      .doc(businessId)
      .get();

    if (!businessDoc.exists) return null;

    const services = businessDoc.data().services || {};
    const serviceData = services.find(service => service.id === serviceId);

    if (!serviceData) return null;

    return {
      id: serviceId,
      name: serviceData.name || 'שם שירות לא זמין',
      duration: parseInt(serviceData.duration) || 0,
      price: parseInt(serviceData.price) || 0
    };
  }

  static async updateAppointmentStatus(appointmentId, newStatus) {
    try {
      if (!appointmentId) {
        throw new Error('No appointmentId provided to updateAppointmentStatus');
      }

      const appointmentRef = this.getAppointmentRef(appointmentId);
      if (!appointmentRef) {
        throw new Error('Could not get appointment reference');
      }

      await appointmentRef.update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  static getAppointmentRef(appointmentId) {
    if (!appointmentId) {
      console.warn('No appointmentId provided to getAppointmentRef');
      return null;
    }
    return firestore().collection('appointments').doc(appointmentId);
  }

  static async sendAppointmentStatusNotification(customerId, appointmentId, status) {
    // Get user's notification token
    const userDoc = await firestore()
      .collection('users')
      .doc(customerId)
      .get();

    if (!userDoc.exists) return;

    const userData = userDoc.data();
    if (!userData.notificationToken || !userData.notificationSettings?.statusUpdates) return;

    // Send notification logic here
    // This would typically involve calling a cloud function or using a notification service
  }

  // Appointments methods
  static async getAppointments(businessId) {
    const snapshot = await firestore()
      .collection('appointments')
      .where('businessId', '==', businessId)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime.toDate()
    }));
  }

  static async getBusinessAppointments(businessId, startTime, endTime) {
    const snapshot = await firestore()
      .collection('appointments')
      .where('businessId', '==', businessId)
      .where('startTime', '>=', firestore.Timestamp.fromDate(startTime))
      .where('startTime', '<=', firestore.Timestamp.fromDate(endTime))
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        startTime: data.startTime,
        duration: data.serviceDuration || 30,
        customerName: data.customerName,
        serviceName: data.serviceName,
        status: data.status
      };
    });
  }

  static async checkOverlappingAppointments(businessId, startTime, endTime) {
    const snapshot = await firestore()
      .collection('appointments')
      .where('businessId', '==', businessId)
      .where('startTime', '>=', startTime)
      .where('startTime', '<', firestore.Timestamp.fromDate(endTime))
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    return !snapshot.empty;
  }

  static async createAppointment(businessId, customerId, serviceId, startTime, notes = null) {
    return await firestore().runTransaction(async (transaction) => {
      const appointmentRef = firestore().collection('appointments').doc();
      const appointmentId = appointmentRef.id;

      // Get customer data
      const customerDoc = await transaction.get(firestore().collection('users').doc(customerId));
      const customerData = customerDoc.data();

      // Get business and service data
      const businessDoc = await transaction.get(firestore().collection('businesses').doc(businessId));
      const businessData = businessDoc.data();
      const serviceData = businessData.services.find(service => service.id === serviceId);

      if (!serviceData) {
        throw new Error(`Service ${serviceId} not found in business ${businessId}`);
      }

      // Create the appointment with denormalized data
      const now = firestore.Timestamp.now();
      const appointmentData = {
        businessId,
        createdAt: now,
        customerId,
        customerName: customerData.name,
        customerPhone: customerData.phone || customerData.phoneNumber,
        serviceDuration: serviceData.duration,
        serviceId,
        serviceName: serviceData.name,
        servicePrice: serviceData.price,
        startTime,
        status: 'pending',
        updatedAt: now
      };

      if (businessData.scheduleSettings.autoApprove) {
        appointmentData.status = 'approved';
      }

      // Only add notes if it's not null
      if (notes !== null) {
        appointmentData.notes = notes;
      }

      transaction.set(appointmentRef, appointmentData);

      return appointmentId;
    });
  }

  // Salon and Category methods
  static async getHaircutCategory() {
    const snapshot = await firestore()
      .collection('categories')
      .where('name', '==', 'תספורת')
      .get();

    if (snapshot.empty) return null;
    const categoryData = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...categoryData
    };
  }

  static async getBusinessesByCategory(categoryId) {
    const snapshot = await firestore()
      .collection('businesses')
      .where('categories', 'array-contains', categoryId)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async getTopBusinesses(categoryId, limit = 10) {
    const snapshot = await firestore()
      .collection('businesses')
      .where('categories', 'array-contains', categoryId)
      .get();

    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }

  // Category methods
  static async getCategories() {
    const categoriesSnapshot = await firestore()
      .collection('categories')
      .orderBy('name', 'asc')
      .get();
    
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      categoryId: doc.data().categoryId,
      name: doc.data().name,
      ...doc.data()
    }));
  }

  // User Favorites methods
  static async getUserFavorites(userId) {
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();

    return userDoc.data()?.favorites || [];
  }

  static async addToFavorites(userId, businessId) {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          favorites: firestore.FieldValue.arrayUnion(businessId),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  static async removeFromFavorites(userId, businessId) {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          favorites: firestore.FieldValue.arrayRemove(businessId),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Favorites methods
  static async getFavoriteBusinesses() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return [];
      }

      // Get user's favorites
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const favorites = userDoc.data()?.favorites || [];

      if (favorites.length === 0) {
        return [];
      }

      // Fetch business details for each favorite
      const businessesPromises = favorites.map(businessId =>
        firestore()
          .collection('businesses')
          .doc(businessId)
          .get()
      );

      const businessesSnapshots = await Promise.all(businessesPromises);
      return businessesSnapshots
        .filter(doc => doc.exists)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          image: { uri: doc.data().images?.[0] || '' }
        }));
    } catch (error) {
      console.error('Error fetching favorite businesses:', error);
      throw error;
    }
  }

  static async addFavorite(businessId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          favorites: firestore.FieldValue.arrayUnion(businessId),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });

      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  static async removeFavorite(businessId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // First get current favorites
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const currentFavorites = userDoc.data()?.favorites || [];
      console.log('Current favorites before removal:', currentFavorites);
      console.log('Attempting to remove businessId:', businessId);

      // Remove the businessId using filter
      const updatedFavorites = currentFavorites.filter(id => id !== businessId);
      console.log('Updated favorites after removal:', updatedFavorites);

      // Update with the new array
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          favorites: updatedFavorites,
          updatedAt: firestore.FieldValue.serverTimestamp()
        });

      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  static async isFavorite(businessId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return false;

      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const favorites = userDoc.data()?.favorites || [];
      return favorites.includes(businessId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  // Authentication methods
  static async signInWithEmail(email, password) {
    const { user } = await auth().signInWithEmailAndPassword(email, password);
    const userData = await this.getUserData(user.uid);
    await this.updateLastLogin(user.uid);
    return { user, userData };
  }

  static async signInWithGoogle() {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();

    if (!userInfo?.data?.idToken) {
      throw new Error('Failed to get ID token from Google Sign-In');
    }

    const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    const user = userCredential.user;

    // Prepare user data
    const userData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || userInfo.data.user.name || '',
      phoneNumber: user.phoneNumber || null,
      updatedAt: this.getServerTimestamp(),
      lastLogin: this.getServerTimestamp(),
      photoURL: user.photoURL || userInfo.data.user.photo || null,
    };

    const userDoc = await this.getUserData(user.uid);
    if (!userDoc) {
      userData.createdAt = this.getServerTimestamp();
      await this.createUserData(user.uid, userData);
    } else {
      await this.updateUserData(user.uid, userData);
    }

    return { user, userData };
  }

  static async signInWithPhone(phoneNumber) {
    const formattedPhoneNumber = phoneNumber.startsWith('0') 
      ? `+972${phoneNumber.substring(1)}` 
      : phoneNumber;
    return await auth().signInWithPhoneNumber(formattedPhoneNumber);
  }

  static async confirmPhoneCode(confirmation, code) {
    return await confirmation.confirm(code);
  }

  static async createNewUser(userData) {
    const userDocRef = firestore().collection('users').doc(userData.uid);
    await userDocRef.set({
      ...userData,
      createdAt: this.getServerTimestamp(),
      updatedAt: this.getServerTimestamp(),
      lastLogin: this.getServerTimestamp()
    });
  }

  static async updateUserProfile(userId, data) {
    const user = auth().currentUser;
    if (user) {
      await user.updateProfile(data);
      await this.updateUserData(userId, {
        ...data,
        updatedAt: this.getServerTimestamp()
      });
    }
  }

  static async getUserData(userId) {
    try {
      if (!userId) {
        console.warn('No userId provided to getUserData');
        return null;
      }

      const userDoc = await firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        console.warn(`No user found with ID: ${userId}`);
        return null;
      }

      const data = userDoc.data();
      // Normalize user data fields
      return {
        id: userId,
        name: data.displayName || data.name || data.fullName,
        phone: data.phoneNumber || data.phone,
        email: data.email,
        ...data
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  static async getUsersData(userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        console.warn('No userIds provided to getUsersData');
        return {};
      }

      const userDocs = await Promise.all(
        userIds.map(id => 
          firestore()
            .collection('users')
            .doc(id)
            .get()
        )
      );

      const usersData = {};
      userDocs.forEach(doc => {
        if (doc.exists) {
          const data = doc.data();
          usersData[doc.id] = {
            id: doc.id,
            name: data.displayName || data.name || data.fullName,
            phone: data.phoneNumber || data.phone,
            email: data.email,
            ...data
          };
        }
      });

      return usersData;
    } catch (error) {
      console.error('Error getting users data:', error);
      throw error;
    }
  }

  static async createUserData(userId, data) {
    await firestore().collection('users').doc(userId).set({
      ...data,
      createdAt: this.getServerTimestamp(),
      updatedAt: this.getServerTimestamp()
    });
  }

  static async updateUserData(userId, data) {
    await firestore().collection('users').doc(userId).update({
      ...data,
      updatedAt: this.getServerTimestamp()
    });
  }

  static async updateLastLogin(userId) {
    await firestore().collection('users').doc(userId).update({
      lastLogin: this.getServerTimestamp()
    });
  }

  static async resetPassword(email) {
    await auth().sendPasswordResetEmail(email);
  }

  static async updatePassword(newPassword) {
    const user = this.getCurrentUser();
    if (user) {
      await user.updatePassword(newPassword);
    } else {
      throw new Error('No authenticated user found');
    }
  }

  // Timestamp utility methods
  static getTimestampFromDate(date) {
    return firestore.Timestamp.fromDate(date);
  }

  static getServerTimestamp() {
    return firestore.FieldValue.serverTimestamp();
  }

  static async getAppointmentsForDate(businessId, date) {
    try {
      if (!businessId || !date) {
        throw new Error('businessId and date are required');
      }

      // Convert date to start and end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Convert to Firestore Timestamps
      const startTimestamp = this.getTimestampFromDate(startOfDay);
      const endTimestamp = this.getTimestampFromDate(endOfDay);

      const appointmentsQuery = await firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .where('startTime', '>=', startTimestamp)
        .where('startTime', '<=', endTimestamp)
        .get();

      return appointmentsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  static async getCustomerData(customerId) {
    try {
      if (!customerId) return null;
      
      const customerDoc = await firestore()
        .collection('users')
        .doc(customerId)
        .get();
        
      return customerDoc.exists ? customerDoc.data() : null;
    } catch (error) {
      console.error('Error fetching customer data:', error);
      return null;
    }
  }

  // Verification methods
  static async sendVerificationCode(phoneNumber) {
    const formattedPhoneNumber = phoneNumber.startsWith('0') 
      ? `+972${phoneNumber.substring(1)}` 
      : phoneNumber;
    return await auth().signInWithPhoneNumber(formattedPhoneNumber);
  }

  static async verifyCode(confirmation, code) {
    const credential = await confirmation.confirm(code);
    return credential;
  }

  static async sendEmailVerification() {
    const user = this.getCurrentUser();
    if (user) {
      await user.sendEmailVerification();
    } else {
      throw new Error('No authenticated user found');
    }
  }

  static async verifyBeforeUpdateEmail(email) {
    const user = this.getCurrentUser();
    if (user) {
      await user.verifyBeforeUpdateEmail(email);
    } else {
      throw new Error('No authenticated user found');
    }
  }

  // Notification methods
  static async checkPushNotificationPermission() {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  static async requestPushNotificationPermission() {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  static async updateNotificationSettings(userId, settings) {
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        notificationSettings: settings,
        updatedAt: this.getServerTimestamp()
      });
  }

  // Appointment methods
  static async getAppointmentById(appointmentId) {
    const appointmentDoc = await firestore()
      .collection('appointments')
      .doc(appointmentId)
      .get();

    return appointmentDoc.exists ? { id: appointmentDoc.id, ...appointmentDoc.data() } : null;
  }

  static async getAvailableSlots(businessId, date) {
    const dateStr = date.toISOString().split('T')[0];
    
    const availableSlotsDoc = await firestore()
      .collection('businesses')
      .doc(businessId)
      .collection('availableSlots')
      .doc(dateStr)
      .get();

    if (!availableSlotsDoc.exists || !availableSlotsDoc.data()?.slots) {
      return [];
    }

    const slotIds = availableSlotsDoc.data().slots;
    const appointmentDocs = await Promise.all(
      slotIds.map(id => 
        firestore()
          .collection('appointments')
          .doc(id)
          .get()
      )
    );

    return appointmentDocs
      .filter(doc => doc.exists && doc.data().status === 'available')
      .map(doc => {
        const data = doc.data();
        const startTime = data.startTime.toDate();
        return {
          id: doc.id,
          time: startTime,
          formattedTime: startTime.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          serviceName: data.serviceName,
          servicePrice: data.servicePrice,
          serviceDuration: data.serviceDuration
        };
      })
      .sort((a, b) => a.time - b.time);
  }

  static async rescheduleAppointment(appointmentId, newDate) {
    const appointment = await this.getAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Update appointment time and status together
    const appointmentRef = firestore().collection('appointments').doc(appointmentId);
    await appointmentRef.update({
      startTime: newDate,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });

    // Send notifications
    await this.sendAppointmentUpdateNotification(appointment.customerId, {
      type: 'reschedule',
      appointmentId,
      oldDate: appointment.startTime.toDate(),
      newDate,
      status: 'pending'
    });
  }

  static async sendAppointmentUpdateNotification(customerId, data) {
    // Implement notification sending logic here
  }

  // Business Profile methods
  static async updateBusinessProfile(businessId, profileData) {
    await firestore()
      .collection('businesses')
      .doc(businessId)
      .update(profileData);
  }

  static async getBusinessData(businessId) {
    try {
      if (!businessId) {
        console.warn('No businessId provided to getBusinessData');
        return null;
      }

      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .get();

      if (!businessDoc.exists) {
        console.warn(`No business found with ID: ${businessId}`);
        return null;
      }

      const data = businessDoc.data();
      console.log('Business data retrieved:', {
        id: businessId,
        name: data.name,
        hasServices: !!data.services,
        servicesCount: data.services ? Object.keys(data.services).length : 0
      });

      return {
        id: businessId,
        ...data
      };
    } catch (error) {
      console.error('Error getting business data:', error);
      throw error;
    }
  }

  static async getBusinessServices(businessId) {
    try {
      const businessData = await this.getBusinessData(businessId);
      if (!businessData || !businessData.services) {
        console.warn(`No services found for business: ${businessId}`);
        return {};
      }
      return businessData.services;
    } catch (error) {
      console.error('Error getting business services:', error);
      throw error;
    }
  }

  static async updateBusinessSchedule(businessId, scheduleData) {
    await firestore()
      .collection('businesses')
      .doc(businessId)
      .update({
        scheduleSettings: scheduleData,
        updatedAt: this.getServerTimestamp(),
      });
  }

  static async updateBusinessWorkingHours(businessId, workingHours) {
    await firestore()
      .collection('businesses')
      .doc(businessId)
      .update({
        workingHours: workingHours,
      });
  }

  static async updateBusinessServices(businessId, servicesData) {
    await firestore()
      .collection('businesses')
      .doc(businessId)
      .update({
        services: servicesData,
        updatedAt: this.getServerTimestamp()
      });
  }

  static async getBusinessStats(businessId, startDate, endDate) {
    const appointmentsSnapshot = await firestore()
      .collection('appointments')
      .where('businessId', '==', businessId)
      .where('startTime', '>=', startDate)
      .where('startTime', '<=', endDate)
      .get();

    const appointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate basic stats
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const canceledAppointments = appointments.filter(apt => apt.status === 'canceled').length;
    const totalRevenue = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.price || 0), 0);

    return {
      totalAppointments,
      completedAppointments,
      canceledAppointments,
      totalRevenue,
      appointments
    };
  }

  static async getBusinessCustomers(businessId) {
    const appointmentsSnapshot = await firestore()
      .collection('appointments')
      .where('businessId', '==', businessId)
      .get();

    const customerIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().customerId))];
    
    const customers = await Promise.all(
      customerIds.map(async (customerId) => {
        const userDoc = await firestore()
          .collection('users')
          .doc(customerId)
          .get();

        if (!userDoc.exists) return null;

        const customerAppointments = appointmentsSnapshot.docs
          .filter(doc => doc.data().customerId === customerId)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        return {
          id: customerId,
          ...userDoc.data(),
          appointments: customerAppointments
        };
      })
    );

    return customers.filter(customer => customer !== null);
  }

  // Business Authentication methods
  static async createUserWithEmailAndPassword(email, password) {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  }

  static async signInWithEmailAndPassword(email, password) {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return userCredential.user;
  }

  static async signOut() {
    await auth().signOut();
  }

  static getCurrentUser() {
    return auth().currentUser;
  }

  static async createBusinessProfile(businessId, businessData) {
    await firestore()
      .collection('businesses')
      .doc(businessId)
      .set(businessData);

    const user = this.getCurrentUser();
    if (user) {
      await user.updateProfile({
        displayName: businessData.name
      });
    }
  }

  static async getUserAppointments(userId) {
    try {
      const appointmentsSnapshot = await firestore()
        .collection('appointments')
        .where('customerId', '==', userId)
        .get();

      return appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user appointments:', error);
      throw error;
    }
  }

  static async getAppointmentsWithFullData(businessId) {
    try {
      const appointmentsSnapshot = await firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .get();

      if (appointmentsSnapshot.empty) {
        return [];
      }

      const appointments = [];
      
      for (const doc of appointmentsSnapshot.docs) {
        const appointment = {
          id: doc.id,
          ...doc.data()
        };

        // Get customer data if not denormalized
        if (!appointment.customerName) {
          try {
            const customerDoc = await firestore()
              .collection('users')
              .doc(appointment.customerId)
              .get();
            
            if (customerDoc.exists) {
              const customerData = customerDoc.data();
              appointment.customerName = customerData.name;
              appointment.customerPhone = customerData.phone || customerData.phoneNumber;
            }
          } catch (error) {
            console.error('Error fetching customer data:', error);
          }
        }

        // Get service data if not denormalized
        if (!appointment.serviceName) {
          try {
            const serviceDoc = await firestore()
              .collection('services')
              .doc(appointment.serviceId)
              .get();
            
            if (serviceDoc.exists) {
              const serviceData = serviceDoc.data();
              appointment.serviceName = serviceData.name;
              appointment.servicePrice = serviceData.price;
              appointment.serviceDuration = serviceData.duration;
            }
          } catch (error) {
            console.error('Error fetching service data:', error);
          }
        }

        // Add formatted date and time
        if (appointment.startTime) {
          const date = appointment.startTime.toDate();
          appointment.formattedDate = date.toLocaleDateString('he-IL');
          appointment.time = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        }

        appointments.push(appointment);
      }

      return appointments;
    } catch (error) {
      console.error('Error in getAppointmentsWithFullData:', error);
      throw error;
    }
  }

  static async cancelAppointment(appointmentId) {
    try {
      // Get the appointment data
      const appointmentDoc = await firestore()
        .collection('appointments')
        .doc(appointmentId)
        .get();

      if (!appointmentDoc.exists) {
        throw new Error('התור לא נמצא');
      }

      const appointmentData = appointmentDoc.data();
      
      // Get the business settings
      const businessDoc = await firestore()
        .collection('businesses')
        .doc(appointmentData.businessId)
        .get();

      if (!businessDoc.exists) {
        throw new Error('העסק לא נמצא');
      }

      const businessData = businessDoc.data();
      const { scheduleSettings } = businessData;

      // Check if cancellation is allowed by business settings
      if (!scheduleSettings.allowCancellation) {
        throw new Error('ביטול תורים אינו מורשה. אנא צור קשר עם העסק.');
      }

      // Check cancellation time limit
      const appointmentTime = appointmentData.startTime.toDate();
      const now = new Date();
      const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

      if (hoursUntilAppointment < scheduleSettings.cancellationTimeLimit) {
        throw new Error(`לא ניתן לבטל תור פחות מ-${scheduleSettings.cancellationTimeLimit} שעות לפני מועד התור`);
      }

      // Update appointment status to canceled
      await firestore()
        .collection('appointments')
        .doc(appointmentId)
        .update({
          status: 'canceled',
          canceledAt: firestore.FieldValue.serverTimestamp(),
          lastUpdated: firestore.FieldValue.serverTimestamp()
        });

      return true;
    } catch (error) {
      console.error('Error in cancelAppointment:', error);
      throw error;
    }
  }
}

export default FirebaseApi;
