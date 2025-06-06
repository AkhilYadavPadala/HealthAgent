import React, { useState } from 'react';
import { 
  SafeAreaView, ScrollView, View, Text, 
  TouchableOpacity, Image, StyleSheet 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const OrderStatus: React.FC = () => {
  const navigation = useNavigation();
  const days = ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'];

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [spendAmount, setSpendAmount] = useState<number>(768); // Default amount

  // Function to generate a random amount when clicking a day
  const handleDayClick = (index: number) => {
    setSelectedDay(index);
    const randomAmount = Math.floor(Math.random() * (1500 - 500 + 1)) + 500; // Between ₹500 - ₹1500
    setSpendAmount(randomAmount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={28} color="#007bff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Status</Text>
          <View style={{ flex: 1 }} /> 
          <TouchableOpacity>
            <Image 
              source={{ uri: 'https://via.placeholder.com/40' }} 
              style={styles.notificationIcon} 
            />
          </TouchableOpacity>
        </View>

        {/* Orders Section - 2x2 Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.orderCount}>02</Text>
            <Text style={styles.orderLabel}>New Orders</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.orderCount}>05</Text>
            <Text style={styles.orderLabel}>Ordered</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.orderCount}>03</Text>
            <Text style={styles.orderLabel}>Delivered</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.orderCount}>01</Text>
            <Text style={styles.orderLabel}>Cancelled</Text>
          </View>
        </View>

        {/* Days of the Week - Horizontal Row */}
        <View style={styles.weekContainer}>
          {days.map((day, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.weekItem, 
                selectedDay === index && styles.selectedDay
              ]}
              onPress={() => handleDayClick(index)}
            >
              <Text 
                style={[
                  styles.dayText, 
                  selectedDay === index && styles.selectedDayText
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings */}
        <View style={styles.earnings}>
          <Text style={styles.earningsTitle}>Amount Spend</Text>
          <Text style={styles.earningsValue}>₹{spendAmount}</Text>
          <Text style={styles.earningsChange}>(+8.5%)</Text>
        </View>

        {/* Manage Menu */}
        <View style={styles.manageMenu}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/100' }} 
            style={styles.menuImage} 
          />
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Manage Cart</Text>
            <Text style={styles.menuDescription}>
              Check the items available in your menu card
            </Text>
            <TouchableOpacity style={styles.addItemButton}>
              <Text style={styles.addItemButtonText}>Open Cart</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fc' },
  scrollView: { padding: 20, alignItems: 'center' },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%', marginBottom: 20 },
  backButton: { padding: 10, marginRight: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  notificationIcon: { width: 40, height: 40 },

  /* Orders in Grid */
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  gridItem: { 
    backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '48%', 
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 3, marginBottom: 10
  },
  orderCount: { fontSize: 22, fontWeight: 'bold', color: '#007bff' },
  orderLabel: { fontSize: 16, color: '#444', marginTop: 5 },

  /* Days of the Week - Horizontal */
  weekContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  weekItem: { backgroundColor: '#ddd', padding: 10, borderRadius: 5, alignItems: 'center', width: '13%' },
  dayText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  /* Selected Day */
  selectedDay: { backgroundColor: '#007bff' },
  selectedDayText: { color: '#fff' },

  earnings: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '100%', alignItems: 'center', shadowOpacity: 0.1, elevation: 3 },
  earningsTitle: { fontSize: 18, fontWeight: 'bold' },
  earningsValue: { fontSize: 24, fontWeight: 'bold', color: '#007bff', marginVertical: 5 },
  earningsChange: { fontSize: 16, color: 'green' },

  manageMenu: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 10, marginTop: 20, alignItems: 'center', shadowOpacity: 0.1, elevation: 3 },
  menuImage: { width: 100, height: 100, borderRadius: 10, marginRight: 15 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 18, fontWeight: 'bold' },
  menuDescription: { fontSize: 16, color: '#555', marginVertical: 5 },
  addItemButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  addItemButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default OrderStatus;
