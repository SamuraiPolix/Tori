import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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

const BusinessStats = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('day');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    day: { revenue: 0, newCustomers: 0, appointments: 0, canceledAppointments: 0, pageViews: 0 },
    week: { revenue: 0, newCustomers: 0, appointments: 0, canceledAppointments: 0, pageViews: 0 },
    month: { revenue: 0, newCustomers: 0, appointments: 0, canceledAppointments: 0, pageViews: 0 }
  });
  const [chartData, setChartData] = useState({
    day: { labels: [], datasets: [{ data: [] }] },
    week: { labels: [], datasets: [{ data: [] }] },
    month: { labels: [], datasets: [{ data: [] }] }
  });
  
  const { businessId } = route.params;

  useEffect(() => {
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
        return { start, end: now };
      case 'month':
        start.setMonth(now.getMonth() - 1);
        return { start, end: now };
      default:
        return { start: now, end: now };
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const { start, end } = getDateRange(activeTab);

      // Fetch appointments
      const appointmentsQuery = firestore()
        .collection('appointments')
        .where('businessId', '==', businessId)
        .where('date', '>=', start)
        .where('date', '<=', end);

      const appointmentsSnap = await appointmentsQuery.get();
      const appointments = appointmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate statistics
      const revenue = appointments
        .filter(app => app.status === 'completed')
        .reduce((sum, app) => sum + (app.price || 0), 0);

      const uniqueCustomers = new Set(appointments.map(app => app.customerId)).size;
      const totalAppointments = appointments.length;
      const canceledAppointments = appointments.filter(app => app.status === 'canceled').length;

      // Generate chart data
      const chartLabels = [];
      const revenueData = [];

      if (activeTab === 'day') {
        for (let i = 0; i < 24; i++) {
          chartLabels.push(`${i}:00`);
          const hourRevenue = appointments
            .filter(app => new Date(app.date).getHours() === i && app.status === 'completed')
            .reduce((sum, app) => sum + (app.price || 0), 0);
          revenueData.push(hourRevenue);
        }
      } else if (activeTab === 'week') {
        const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          chartLabels.push(days[date.getDay()]);
          const dayRevenue = appointments
            .filter(app => {
              const appDate = new Date(app.date);
              return appDate.getDate() === date.getDate() && 
                     appDate.getMonth() === date.getMonth() &&
                     app.status === 'completed';
            })
            .reduce((sum, app) => sum + (app.price || 0), 0);
          revenueData.push(dayRevenue);
        }
      } else {
        // Month view
        for (let i = 30; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          chartLabels.push(date.getDate().toString());
          const dayRevenue = appointments
            .filter(app => {
              const appDate = new Date(app.date);
              return appDate.getDate() === date.getDate() && 
                     appDate.getMonth() === date.getMonth() &&
                     app.status === 'completed';
            })
            .reduce((sum, app) => sum + (app.price || 0), 0);
          revenueData.push(dayRevenue);
        }
      }

      setStats(prev => ({
        ...prev,
        [activeTab]: {
          revenue,
          newCustomers: uniqueCustomers,
          appointments: totalAppointments,
          canceledAppointments,
          pageViews: Math.floor(totalAppointments * 1.5) // Estimated metric
        }
      }));

      setChartData(prev => ({
        ...prev,
        [activeTab]: {
          labels: chartLabels,
          datasets: [{ data: revenueData }]
        }
      }));

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>סטטיסטיקות העסק</Text>
      </View>

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
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60, // פדינג נוסף עבור המצלמה
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontFamily: FontFamily.rubikMedium,
    color: '#1e293b',
    textAlign: 'center',
    marginRight: 24, // לאזן את הכפתור חזרה
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#ffffff',
    marginBottom: 10,
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
