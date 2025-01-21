import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Color } from '../../styles/GlobalStyles';
import BusinessSidebar from '../../components/BusinessSidebar';

const TABS = [
  { id: 'day', label: 'יום' },
  { id: 'week', label: 'שבוע' },
  { id: 'month', label: 'חודש' },
];

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: () => '#64748b',
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#2563eb',
  },
  propsForLabels: {
    fontFamily: FontFamily.rubikRegular,
  },
};

const BusinessStats = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('day');
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [businessData, setBusinessData] = useState({});
  const [stats, setStats] = useState({
    day: { revenue: 0, newCustomers: 0, appointments: 0, canceledAppointments: 0, completedAppointments: 0 },
    week: { revenue: 0, newCustomers: 0, appointments: 0, canceledAppointments: 0, completedAppointments: 0 },
    month: { revenue: 0, newCustomers: 0, appointments: 0, canceledAppointments: 0, completedAppointments: 0 }
  });
  const [chartData, setChartData] = useState({
    day: { labels: [], datasets: [{ data: [] }] },
    week: { labels: [], datasets: [{ data: [] }] },
    month: { labels: [], datasets: [{ data: [] }] }
  });

  useEffect(() => {
    fetchBusinessData();
    fetchStats();
  }, [activeTab]);

  const getDateRange = (period) => {
    const now = new Date();
    const start = new Date();
    
    switch(period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case 'week':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case 'month':
        start.setMonth(now.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      default:
        return { start: now, end: now };
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const businessId = auth().currentUser.uid;
      const { start, end } = getDateRange(activeTab);

      console.log('Fetching stats for business:', businessId);
      console.log('Date range:', {
        start: start.toISOString(),
        end: end.toISOString()
      });

      if (!businessId) {
        console.error('No businessId provided');
        return;
      }

      // Fetch appointments first
      const appointmentsRef = firestore().collection('appointments');
      const appointmentsSnap = await appointmentsRef.get();
      const appointments = [];

      // Filter appointments by businessId and date range in memory
      for (const doc of appointmentsSnap.docs) {
        const appointmentData = doc.data();
        
        // Skip if not for this business
        if (appointmentData.businessId !== businessId) {
          continue;
        }

        // Convert Firestore timestamp to Date
        const appointmentDate = appointmentData.startTime ? 
          new Date(appointmentData.startTime.seconds * 1000) : null;

        // Skip if date is not in range
        if (!appointmentDate || appointmentDate < start || appointmentDate > end) {
          continue;
        }

        appointments.push({
          id: doc.id,
          ...appointmentData,
          date: appointmentDate
        });
      }

      // Now fetch the business data to get service prices
      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .get();

      if (!businessDoc.exists) {
        console.error('Business document not found');
        return;
      }

      const businessData = businessDoc.data();
      const services = businessData.services || [];

      console.log('Services:', services);

      // Update appointments with service prices
      appointments.forEach(appointment => {
        const service = services.find(s => s.id === appointment.serviceId);
        if (service) {
          appointment.servicePrice = service.price;
          appointment.serviceName = service.name;
        }
      });

      console.log('Appointments with prices:', appointments.map(app => ({
        id: app.id,
        serviceId: app.serviceId,
        servicePrice: app.servicePrice,
        serviceName: app.serviceName,
        status: app.status,
        date: app.date?.toLocaleString()
      })));

      // Calculate statistics
      const revenue = appointments
        .filter(app => app.status === 'completed')
        .reduce((sum, app) => sum + (app.servicePrice || 0), 0);

      const uniqueCustomers = new Set(appointments.map(app => app.customerId)).size;
      const totalAppointments = appointments.length;
      const canceledAppointments = appointments.filter(app => app.status === 'canceled').length;

      // Generate chart data
      const chartLabels = [];
      const appointmentsData = [];

      if (activeTab === 'day') {
        // יצירת מערך של 24 שעות עם ערך התחלתי 0
        const hourlyData = new Array(24).fill(0);
        
        // מיון התורים לפי שעות
        appointments.forEach(app => {
          if (app.date) {
            const hour = app.date.getHours();
            hourlyData[hour]++;
          }
        });

        // הוספת רק שעות שיש בהן פעילות או שעות קרובות
        let hasActivity = false;
        let firstActivityHour = 23;
        let lastActivityHour = 0;

        // מציאת טווח השעות עם פעילות
        hourlyData.forEach((value, hour) => {
          if (value > 0) {
            hasActivity = true;
            firstActivityHour = Math.min(firstActivityHour, hour);
            lastActivityHour = Math.max(lastActivityHour, hour);
          }
        });

        // אם אין פעילות, נציג את השעות הנוכחיות
        if (!hasActivity) {
          const currentHour = new Date().getHours();
          firstActivityHour = Math.max(0, currentHour - 2);
          lastActivityHour = Math.min(23, currentHour + 2);
        }

        // הוספת שעה לפני ואחרי טווח הפעילות
        firstActivityHour = Math.max(0, firstActivityHour - 1);
        lastActivityHour = Math.min(23, lastActivityHour + 1);

        // יצירת התוויות והנתונים לגרף
        for (let hour = firstActivityHour; hour <= lastActivityHour; hour++) {
          const formattedHour = hour.toString().padStart(2, '0');
          chartLabels.push(`${formattedHour}:00`);
          appointmentsData.push(hourlyData[hour]);
        }
      } else if (activeTab === 'week') {
        const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
        const dailyData = new Array(7).fill(0);

        // מיון התורים לפי ימים
        appointments.forEach(app => {
          if (app.date) {
            const dayIndex = app.date.getDay();
            dailyData[dayIndex]++;
          }
        });

        // הוספת כל הימים לגרף
        for (let i = 0; i < 7; i++) {
          chartLabels.push(days[i]);
          appointmentsData.push(dailyData[i]);
        }
      } else {
        // Month view
        const daysInMonth = 31;
        const dailyData = new Array(daysInMonth).fill(0);

        // מיון התורים לפי ימים בחודש
        appointments.forEach(app => {
          if (app.date) {
            const dayOfMonth = app.date.getDate() - 1; // 0-based index
            if (dayOfMonth < daysInMonth) {
              dailyData[dayOfMonth]++;
            }
          }
        });

        // הוספת כל הימים לגרף
        for (let i = 0; i < daysInMonth; i++) {
          chartLabels.push((i + 1).toString());
          appointmentsData.push(dailyData[i]);
        }
      }

      console.log(`Stats for ${activeTab}:`, {
        totalAppointments,
        completedAppointments: appointments.filter(app => app.status === 'completed').length,
        canceledAppointments,
        uniqueCustomers
      });

      setStats(prev => ({
        ...prev,
        [activeTab]: {
          revenue: revenue,
          newCustomers: uniqueCustomers,
          appointments: totalAppointments,
          canceledAppointments,
          completedAppointments: appointments.filter(app => app.status === 'completed').length
        }
      }));

      setChartData(prev => ({
        ...prev,
        [activeTab]: {
          labels: chartLabels,
          datasets: [{ 
            data: appointmentsData,
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
          }]
        }
      }));

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinessData = async () => {
    try {
      const businessId = auth().currentUser.uid;
      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .get();

      if (businessDoc.exists) {
        setBusinessData(businessDoc.data());
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <View style={[styles.card, { borderColor: color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <BusinessSidebar
        isVisible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        businessData={businessData}
        currentScreen="BusinessStats"
      />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Color.primaryColorAmaranthPurple} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>סטטיסטיקות</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSidebar(true)}
          >
            <Ionicons name="menu-outline" size={24} color={Color.primaryColorAmaranthPurple} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scrollView}>
        

        {/* טאבים */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* גרף פעילות */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>פעילות {TABS.find(t => t.id === activeTab).label}</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : (
            <LineChart
              data={chartData[activeTab]}
              width={Dimensions.get('window').width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withVerticalLines={false}
              withHorizontalLines={true}
              withDots={true}
              withShadow={false}
              withScrollableDot={false}
              withInnerLines={false}
              fromZero={true}
            />
          )}
        </View>

        {/* כרטיסי סטטיסטיקה */}
        <View style={styles.cardsContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : (
            <>
              <StatCard
                title="הכנסות"
                value={`₪${stats[activeTab].revenue.toLocaleString()}`}
                icon="cash-outline"
                color="#2563eb"
              />
              <StatCard
                title="תורים שנקבעו"
                value={stats[activeTab].appointments}
                icon="calendar-outline"
                color="#7c3aed"
              />
              <StatCard
                title="לקוחות חדשים"
                value={stats[activeTab].newCustomers}
                icon="people-outline"
                color="#059669"
              />
              <StatCard
                title="תורים שבוטלו"
                value={stats[activeTab].canceledAppointments}
                icon="close-circle-outline"
                color="#dc2626"
              />
              <StatCard
                title="חשיפות"
                value={stats[activeTab].pageViews}
                icon="eye-outline"
                color="#0891b2"
              />
              <StatCard
                title="תורים שהסתיימו"
                value={stats[activeTab].completedAppointments}
                icon="checkmark-circle-outline"
                color="#34c759"
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamily.rubikMedium,
    color: Color.primaryColorAmaranthPurple,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 16,
    fontFamily: FontFamily.rubikRegular,
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
    fontFamily: FontFamily.rubikMedium,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
    paddingHorizontal: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: FontFamily.rubikMedium,
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  card: {
    width: '31%', // שלוש קוביות בשורה
    backgroundColor: '#ffffff',
    padding: 12,
    margin: '1%',
    borderRadius: 12,
    elevation: 2,
    borderRightWidth: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12, // הקטנת גודל הטקסט
    fontFamily: FontFamily.rubikRegular,
    color: '#64748b',
  },
  cardValue: {
    fontSize: 16, // הקטנת גודל הטקסט
    fontFamily: FontFamily.rubikMedium,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 10, // הקטנת גודל הטקסט
    fontFamily: FontFamily.rubikRegular,
    color: '#94a3b8',
  },
});

export default BusinessStats;
