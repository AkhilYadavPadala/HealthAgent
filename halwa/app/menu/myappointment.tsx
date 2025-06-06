import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Modal } from 'react-native';
import { Card, Text, Button, Avatar } from 'react-native-paper';
import axios from 'axios';
import { api } from '../components/api';

const MyAppointment = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  useEffect(() => {
    axios.get(api + '/appoint')
      .then(response => {
        setAppointments(response.data);
      })
      .catch(error => {
        console.error("Error fetching appointments:", error);
      });
  }, []);

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={styles.card} onPress={() => handleViewDetails(item)}>
      <Card.Title
        title={`${item.doctor_name}`}
        subtitle={`Time: ${item.appointment_time}`}
        left={(props) => <Avatar.Icon {...props} icon="calendar" />}
        titleStyle={{ color: '#000', fontSize: 18, fontWeight: 'bold' }} // Dark title
        subtitleStyle={{ color: '#333', fontSize: 16 }} // Darker subtitle
      />
      <Card.Content>
        <Text style={styles.status}>Status: {item.status}</Text>
      </Card.Content>
    </Card>
  );
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Appointments</Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id.$oid}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Appointment Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAppointment && (
              <>
                <Text style={styles.modalTitle}>Appointment Details</Text>
                <Text style={styles.modalText}>👨‍⚕️ Doctor: <Text style={styles.boldText}>{selectedAppointment.doctor_name}</Text></Text>
                <Text style={styles.modalText}>⏰ Time Slot: <Text style={styles.boldText}>{selectedAppointment.appointment_time}</Text></Text>
                <Text style={styles.modalText}>📅 Status: <Text style={styles.boldText}>{selectedAppointment.status}</Text></Text>
                <Text style={styles.modalText}>
  Time: {selectedAppointment.timestamp 
    ? new Date(selectedAppointment.timestamp.$date || selectedAppointment.timestamp)
        .toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : "N/A"}
</Text>


                <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.modalButton}>
                  Close
                </Button>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF', // Changed to pure white for better contrast
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000', // Dark text
  },
  card: {
    marginBottom: 12,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: '#FFF',
  },
  status: {
    fontSize: 18, // Increased font size
    fontWeight: 'bold', // Bold text for visibility
    color: '#333', // Darker color
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22, // Larger title for better readability
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000', // Dark text
  },
  modalText: {
    fontSize: 18,
    marginBottom: 6,
    color: '#000', // Dark text for better visibility
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000', // Ensuring contrast
  },
  modalButton: {
    marginTop: 15,
    width: '100%',
  },
});

export default MyAppointment;
