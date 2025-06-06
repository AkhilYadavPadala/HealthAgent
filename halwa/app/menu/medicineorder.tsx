import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  FlatList, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { api } from '../components/api';

const USER_ID = 1001; // Fetch medicines ordered for this user

const MedicineOrdersScreen: React.FC = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Fetch medicine names and replace `medid`
  const fetchMedicineNames = async (order) => {
    const updatedMedicines = await Promise.all(
      order.medicines.map(async (med) => {
        try {
          const response = await axios.get(`${api}/med/getmedname/${med.medid}`);
          return { ...med, name: response.data.name };
        } catch (error) {
          console.error(`Error fetching name for medid ${med.medid}:`, error);
          return { ...med, name: `Unknown Medicine (${med.medid})` };
        }
      })
    );
    return { ...order, medicines: updatedMedicines };
  };

  // ✅ Fetch orders and update medicine names
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${api}/med/orders/${USER_ID}`);
      const ordersWithNames = await Promise.all(response.data.map(fetchMedicineNames));
      setOrders(ordersWithNames);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Filter orders by medicine name
  const filteredOrders = orders.map(order => ({
    ...order,
    medicines: order.medicines.filter(med =>
      (med.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(order => order.medicines.length > 0);

  return (
    <View style={styles.container}>
      {/* 🔹 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>Medicine Orders</Text>
      </View>

      {/* 🔹 Grid Items (Order Delivered & Prescription) */}
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('OrderDelivered')}>
          <View style={styles.iconContainer}>
            <Ionicons name="bicycle-outline" size={40} color="#007bff" />
          </View>
          <Text style={styles.gridText}>Order Delivered</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={40} color="#007bff" />
          </View>
          <Text style={styles.gridText}>Prescription</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by Medicine Name"
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle-outline" size={16} color="#888" />
        </TouchableOpacity>
      </View>

      {/* 🔹 Section Title */}
      <Text style={styles.sectionTitle}>Your Orders</Text>

      {/* 🔹 Loading or No Orders */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 10 }} />
      ) : filteredOrders.length === 0 ? (
        <Text style={styles.noOrdersText}>No orders found.</Text>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.orderContainer}>
              {/* 🔹 Order Header */}
              <Text style={styles.orderHeader}>
                Order Status: <Text style={styles.statusText}>{item.status}</Text>
              </Text>
              <Text style={styles.orderDate}>
                Order Date: <Text style={styles.dateText}>{new Date(item.orderDate).toLocaleString()}</Text>
              </Text>

              {/* 🔹 Medicines List */}
              {item.medicines.map((med, index) => (
                <View key={index} style={styles.medicineItem}>
                  <Text style={styles.medicineName}>{med.name}</Text>
                  <Text style={styles.medicineText}>Quantity: {med.quantity}</Text>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 10 },
  title: { fontSize: 20, fontWeight: 'bold' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, height: 40 },
  clearButton: { padding: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  noOrdersText: { fontSize: 16, textAlign: 'center', marginTop: 10, color: '#666' },
  orderContainer: {
    backgroundColor: '#e8f4ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  orderHeader: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  orderDate: { fontSize: 14, color: '#333', marginBottom: 6 },
  medicineItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  medicineName: { fontSize: 14, fontWeight: 'bold', color: '#007bff' },
  medicineText: { fontSize: 12, color: '#333', marginTop: 2 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  gridItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  iconContainer: { marginBottom: 10 },
  gridText: { textAlign: 'center', fontSize: 16 ,fontFamily:'system'},
});

export default MedicineOrdersScreen;