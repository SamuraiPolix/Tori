import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontFamily } from '../../styles/GlobalStyles';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

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
  const { businessData } = route.params;

  // נתוני דוגמה - יש להחליף בנתונים אמיתיים מהשרת
  const mockData = {
    day: {
      revenue: 1200,
      newCustomers: 5,
      appointments: 8,
      canceledAppointments: 1,
      pageViews: 45,
      returnCustomers: 3,
      avgServiceTime: 45,
      servicesCount: 12,
      topServices: ['תספורת', 'צבע', 'החלקה'],
      chartData: {
        labels: ['9:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
        datasets: [
          {
            data: [3, 5, 8, 6, 4, 2],
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      },
    },
    week: {
      revenue: 7500,
      newCustomers: 28,
      appointments: 45,
      canceledAppointments: 4,
      pageViews: 280,
      returnCustomers: 15,
      avgServiceTime: 42,
      servicesCount: 12,
      topServices: ['תספורת', 'צבע', 'החלקה'],
      chartData: {
        labels: ['א', 'ב', 'ג', 'ד', 'ה', 'ו'],
        datasets: [
          {
            data: [15, 18, 22, 19, 25, 12],
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      },
    },
    month: {
      revenue: 32000,
      newCustomers: 95,
      appointments: 180,
      canceledAppointments: 12,
      pageViews: 1200,
      returnCustomers: 65,
      avgServiceTime: 44,
      servicesCount: 12,
      topServices: ['תספורת', 'צבע', 'החלקה'],
      chartData: {
        labels: ['שבוע 1', 'שבוע 2', 'שבוע 3', 'שבוע 4'],
        datasets: [
          {
            data: [65, 78, 82, 75],
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      },
    },
  };

  const currentData = mockData[activeTab];

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
        <LineChart
          data={currentData.chartData}
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
      </View>

      {/* כרטיסי סטטיסטיקה */}
      <View style={styles.cardsContainer}>
        <StatCard
          title="הכנסות"
          value={`₪${currentData.revenue.toLocaleString()}`}
          icon="cash-outline"
          color="#2563eb"
        />
        <StatCard
          title="תורים שנקבעו"
          value={currentData.appointments}
          icon="calendar-outline"
          color="#7c3aed"
        />
        <StatCard
          title="לקוחות חדשים"
          value={currentData.newCustomers}
          icon="people-outline"
          color="#059669"
        />
        <StatCard
          title="תורים שבוטלו"
          value={currentData.canceledAppointments}
          icon="close-circle-outline"
          color="#dc2626"
        />
        <StatCard
          title="חשיפות"
          value={currentData.pageViews}
          icon="eye-outline"
          color="#0891b2"
        />
        <StatCard
          title="לקוחות חוזרים"
          value={currentData.returnCustomers}
          icon="repeat-outline"
          color="#ea580c"
        />
        <StatCard
          title="זמן תור ממוצע"
          value={`${currentData.avgServiceTime}'`}
          icon="time-outline"
          color="#4f46e5"
        />
        <StatCard
          title="מספר שירותים"
          value={currentData.servicesCount}
          icon="list-outline"
          color="#475569"
        />
        <StatCard
          title="שירותים מובילים"
          value={currentData.topServices[0]}
          subtitle={`${currentData.topServices[1]}, ${currentData.topServices[2]}`}
          icon="star-outline"
          color="#d97706"
        />
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
