import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StyleSheet, Image 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../components/api';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

const SuccessScreen = ({ navigation }) => {
  const defaultGif = 'https://i.pinimg.com/originals/90/13/f7/9013f7b5eb6db0f41f4fd51d989491e7.gif';

  return (
    <View style={styles.successContainer}>
      <ExpoImage 
        source={{ uri: defaultGif }} 
        style={styles.animation} 
        contentFit="contain" 
      />
      <Text style={styles.successText}>Appointment Confirmed!</Text>
      <TouchableOpacity 
        style={styles.doneButton} 
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MyDoctors' }] })}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const BookingPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const doctor = route.params?.doctor;

  if (!doctor) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Doctor details not available</Text>
      </View>
    );
  }

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userid] = useState(1006);

  useEffect(() => {
    setShowSuccess(false);
    fetchAvailability(date.toISOString().split('T')[0]);
  }, [date, doctor]);

  const fetchAvailability = async (selectedDate) => {
    setLoading(true);
    try {
      const response = await axios.get(`${api}/appoint/availability?docid=${doctor.docid}&date=${selectedDate}`);
      setSlots(response.data.slots);
    } catch (err) {
      console.error('Error fetching slots', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (slot) => {
    if (slots?.[`slot${slot}`]?.length >= 4) {
      Toast.show({
        type: 'error',
        text1: "Today's slots are booked",
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
        topOffset: 50,
      });
      return;
    }
    
    try {
      await axios.post(`${api}/appoint/book`, {
        docid: doctor.docid,
        date: date.toISOString().split('T')[0],
        slot,
        userid,
      });
      setShowSuccess(true);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Booking Failed',
        text2: 'Please try again later. You can only book one slot per day',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
        topOffset: 50,
      });
    }
  };

  if (showSuccess) {
    return <SuccessScreen navigation={navigation} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Doctor</Text>
      </View>

      <View style={styles.headerContainer}>
        <Image 
          source={{ uri: doctor.image || 'https://www.shutterstock.com/image-vector/male-doctor-smiling-happy-face-600nw-2481032615.jpg' }} 
          style={styles.doctorImage} 
        />
        <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
        <Text style={styles.specialist}>{doctor.specialist}</Text>
        <Text style={styles.experience}>Experience: {doctor.experience} years</Text>
        <Text style={styles.fee}>Consultation Fee: ${doctor.fee}</Text>
      </View>

      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
        <Text style={styles.dateButtonText}>Select Date: {date.toDateString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker 
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) setDate(selectedDate);
            setShowPicker(false);
          }}
        />
      )}

      {loading && <ActivityIndicator size="large" color="#007bff" />}

      {slots && (
        <View style={styles.slotSection}>
          <Text style={styles.slotTitle}>Available Slots:</Text>
          <View style={styles.slotContainer}>
            {Object.entries(slots).map(([slotKey, users]) => {
              const slotNumber = parseInt(slotKey.replace('slot', ''), 10);
              const isFull = users.length >= 4;

              return (
                <TouchableOpacity
                  key={slotKey}
                  onPress={() => handleBooking(slotNumber)}
                  style={[
                    styles.slotButton, 
                    { backgroundColor: isFull ? '#ff4d4d' : '#28a745' }
                  ]}
                  disabled={isFull}
                >
                  <Text style={styles.slotText}>{`Slot ${slotNumber}`}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#007bff' },
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  doctorImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  doctorName: { fontSize: 22, fontWeight: 'bold', color: '#007bff' },
  specialist: { fontSize: 16, color: '#555' },
  experience: { fontSize: 16, color: '#777' },
  fee: { fontSize: 16, color: '#333', fontWeight: 'bold' },
  dateButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  dateButtonText: { color: '#fff', fontSize: 16 },
  slotSection: { alignItems: 'center' },
  slotTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  slotContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  slotButton: { padding: 10, borderRadius: 10, margin: 5, width: '40%', alignItems: 'center' },
  slotText: { color: '#fff', fontSize: 16 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  animation: { width: 150, height: 150 },
  successText: { fontSize: 20, fontWeight: 'bold', color: '#28a745', marginTop: 10 },
  doneButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 10, marginTop: 20 },
  doneButtonText: { color: '#fff', fontSize: 16 },
});

export default BookingPage;