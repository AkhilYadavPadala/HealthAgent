import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, TouchableOpacity, StyleSheet, 
  ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../components/api';

const USER_ID = 1001;  

interface Doctor {
  docid: number;
  name: string;
  specialist: string;
  exp: number;
  fee: number;
  image?: string;
}

const PopularDoc = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [likedDoctors, setLikedDoctors] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ✅ Fetch doctors & favorite doctors
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(api + `/doctors`);
      setDoctors(response.data);

      const favResponse = await axios.get(`${api}/doctors/fav/${USER_ID}`);
      const favoriteIds = new Set(favResponse.data.favoriteDoctors.map((doc: Doctor) => doc.docid));
      
      setLikedDoctors(
        response.data.reduce((acc: { [key: number]: boolean }, doc: Doctor) => {
          acc[doc.docid] = favoriteIds.has(doc.docid);
          return acc;
        }, {})
      );
    } catch (err) {
      setError('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle favorite status
  const toggleLike = async (docid: number) => {
    const isLiked = likedDoctors[docid];

    setLikedDoctors((prev) => ({ ...prev, [docid]: !prev[docid] }));

    if (isLiked) {
      axios.delete(`${api}/doctors/fav/${USER_ID}/${docid}`)
        .then(() => fetchDoctors())
        .catch(() => {
          setLikedDoctors((prev) => ({ ...prev, [docid]: isLiked }));
          Alert.alert("Error", "Failed to update favorites.");
        });
    } else {
      axios.post(`${api}/doctors/fav`, { userid: USER_ID, docid })
        .then(() => fetchDoctors())
        .catch(() => {
          setLikedDoctors((prev) => ({ ...prev, [docid]: isLiked }));
          Alert.alert("Error", "Failed to update favorites.");
        });
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Fetching top doctors...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Doctors</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {doctors.map((doctor) => (
          <View key={doctor.docid} style={styles.card}>
            {/* ✅ Ensure button is above all elements */}
            <TouchableOpacity 
              style={styles.likeButton} 
              onPress={() => toggleLike(doctor.docid)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Makes it easier to tap
            >
              <Ionicons 
                name={likedDoctors[doctor.docid] ? "heart" : "heart-outline"} 
                size={26} 
                color={likedDoctors[doctor.docid] ? "red" : "#555"} 
              />
            </TouchableOpacity>

            <Image 
              source={{ uri: doctor.image || 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg?semt=ais_hybrid' }} 
              style={styles.image} 
            />
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{doctor.name}</Text>
              <Text style={styles.specialist}>{doctor.specialist}</Text>
              <View style={styles.row}>
                <Ionicons name="calendar-outline" size={16} color="#555" style={styles.icon} />
                <Text style={styles.experience}>{doctor.exp} years experience</Text>
              </View>
              <View style={styles.row}>
                <Ionicons name="cash-outline" size={16} color="#28a745" style={styles.icon} />
                <Text style={styles.fee}> ₹{doctor.fee}</Text>
              </View>
              <TouchableOpacity 
                style={styles.appointmentButton} 
                onPress={() => navigation.navigate('Booking', { doctor })}>
                <Text style={styles.appointmentText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ✅ Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#007bff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#007bff',
    position: 'relative'
  },
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    zIndex: 5, // ✅ Ensures it's on top
    elevation: 10, // ✅ Ensures it's pressable
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#007bff',
  },
  infoContainer: {
    flex: 1,
  },
  appointmentButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  appointmentText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PopularDoc;
