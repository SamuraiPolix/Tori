import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeUserData = async (userData) => {
  try {
    const userInfo = {
      uid: userData.uid,
      name: userData.name || userData.displayName,
      email: userData.email,
      phoneNumber: userData.phoneNumber || null,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem('userData', JSON.stringify(userInfo));
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem('userData');
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};
