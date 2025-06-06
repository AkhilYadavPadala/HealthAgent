import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { api } from '../components/api';

const USER_ID = 1001; // ✅ Change this to logged-in user ID

const OrderScreen: React.FC = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch only completed orders
  const fetchCompletedOrders = async () => {
    try {
      const response = await axios.get(`${api}/med/orders/done/${USER_ID}`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching completed orders:", error);
      setOrders([]); // Set empty array if no completed orders exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  return (
    <LinearGradient colors={['#f7f8fc', '#eef1f7']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Completed Orders</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : orders.length === 0 ? (
          <Text style={styles.noOrdersText}>No completed orders found.</Text>
        ) : (
          <View style={styles.pastOrdersCard}>
            <Text style={styles.orderTitle}>Past Orders</Text>

            {orders.map((order, index) => (
              <View key={index} style={styles.orderBox}>
                <Text style={styles.orderDate}>
                  <Ionicons name="calendar-outline" size={16} color="#555" />{' '}
                  {new Date(order.orderDate).toLocaleDateString()}
                </Text>

                {order.medicines.map((med, medIndex) => (
                  <View key={medIndex} style={styles.medicineBox}>
                    <Image source={{ uri: med.image || 'https://via.placeholder.com/80' }} style={styles.medicineImage} />
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>💊 {med.name || `Unknown (${med.medid})`}</Text>
                      <Text style={styles.medicineDetail}><Text style={styles.boldText}>Quantity:</Text> {med.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { padding: 20, alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 10 },

  pastOrdersCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  orderTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#222' },

  orderBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  orderDate: { fontSize: 16, color: '#555', fontWeight: 'bold', marginBottom: 8 },

  medicineBox: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  medicineImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  medicineInfo: { flex: 1 },
  medicineName: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#007bff' },
  medicineDetail: { fontSize: 14, color: '#444' },
  boldText: { fontWeight: 'bold', color: '#222' },

  noOrdersText: { fontSize: 18, color: '#777', textAlign: 'center', marginTop: 20 },
});

export default OrderScreen;