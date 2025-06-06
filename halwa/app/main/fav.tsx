import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity, 
  TextInput, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { api } from '../components/api';

const USER_ID = 1001;

interface Doctor {
  docid: number;
  name: string; 
  specialist: string;
  exp: string;
  fee: number;
  image?: string;
}

const FavDocPage: React.FC = () => {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Fetch favorite doctors
  const fetchFavoriteDoctors = async () => {
    try {
      const response = await axios.get(`${api}/doctors/fav/${USER_ID}`);
      setDoctors(response.data.favoriteDoctors);
    } catch (error) {
      console.error("Error fetching favorite doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Refresh the list every 5 seconds
  useEffect(() => {
    fetchFavoriteDoctors(); // Initial fetch

    const interval = setInterval(() => {
      fetchFavoriteDoctors();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval); // Cleanup when unmounted
  }, []);

  // ✅ Remove a doctor from favorites
  const removeFavorite = async (docid: number) => {
    try {
      await axios.delete(`${api}/doctors/fav/${USER_ID}/${docid}`);
      fetchFavoriteDoctors(); // Refresh the list immediately
      Toast.show({
        type: 'success',
        text1: 'Removed from favorites',
        position: 'bottom',
      });
    } catch (error) {
      console.error("Error removing favorite doctor:", error);
    }
  };

  // ✅ Filter doctors based on name or specialization
  const filteredDoctors = doctors.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateToDoctorBooking = (doctor: Doctor) => {
    navigation.navigate('Booking', { doctor });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 🔹 Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="#007bff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favourite Doctors</Text>
        </View>

        {/* 🔹 Search Input */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#007bff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialization..."
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
        </View>

        {/* 🔹 Show loading spinner while fetching data */}
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
        ) : filteredDoctors.length === 0 ? (
          <Text style={styles.noFavoritesText}>No favorite doctors found.</Text>
        ) : (
          <FlatList
            data={filteredDoctors}
            keyExtractor={(item) => item.docid.toString()}
            numColumns={2}
            renderItem={({ item }) => (
              <View style={styles.doctorContainer}>
                {/* 🔹 Remove favorite (Heart inside the box) */}
                <TouchableOpacity
                  style={styles.favoriteIconContainer}
                  onPress={() => removeFavorite(item.docid)}
                >
                  <AntDesign name="heart" size={24} color="red" />
                </TouchableOpacity>

                {/* 🔹 Doctor Details */}
                <TouchableOpacity onPress={() => navigateToDoctorBooking(item)}>
                  <Image 
                    source={{ uri: item.image || 'https://www.shutterstock.com/image-vector/male-doctor-smiling-happy-face-600nw-2481032615.jpg' }} 
                    style={styles.doctorImage} 
                  />
                  <Text style={styles.doctorName}>{item.name}</Text>
                  <Text style={styles.doctorSpecialist}>{item.specialist}</Text>

                  {/* 🔹 Left-aligned Fee & Experience */}
                  <View style={styles.infoContainer}>
                    <Text style={styles.doctorExp}>{item.exp} years experience</Text>
                    <Text style={styles.doctorFee}>₹{item.fee} Fee</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* ✅ Add Toast Component */}
      <Toast />
    </SafeAreaView>
  );
};

// ✅ Styling
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  noFavoritesText: { fontSize: 16, textAlign: 'center', marginTop: 20, color: '#666' },
  doctorContainer: {
    width: '46%',
    height: 250,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 16,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  favoriteIconContainer: {
    position: 'absolute',
    top: 8, // Moved inside the box
    right: 8, // Moved inside the box
    zIndex: 10, // Ensures it's above content
    backgroundColor: 'white', // Retains original style
    padding: 6,
    borderRadius: 20,
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  doctorName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#007bff' },
  doctorSpecialist: { fontSize: 12, color: '#666', textAlign: 'center' },
  infoContainer: {
    width: '100%',
    marginTop: 6,
    alignItems: 'flex-start',
  },
  doctorExp: { fontSize: 12, color: '#444', marginBottom: 2 },
  doctorFee: { fontSize: 14, fontWeight: 'bold', color: '#28a745' },
});

export default FavDocPage;
