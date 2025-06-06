import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Updated import
import * as ImagePicker from 'expo-image-picker'; // Expo Image Picker (use this if you're using Expo)

const Profile = () => {
  const [selectedState, setSelectedState] = useState('AP');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [isHandicapped, setIsHandicapped] = useState(false);
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150'); // Default image
  const [isModalVisible, setModalVisible] = useState(false);
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('30');
  const [email, setEmail] = useState('johndoe@example.com');

  const handleImageChange = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled) {
        setProfileImage(result.uri); // Set the selected image URI
      }
    } else {
      alert('Permission to access gallery is required!');
    }
  };

  const handleEdit = () => {
    setModalVisible(true); // Open modal when Edit is clicked
  };

  const handleSave = () => {
    console.log('Details Saved!');
    setModalVisible(false); // Close modal after saving
  };

  const states = [
    { label: 'Andhra Pradesh', value: 'AP' },
    { label: 'Telangana', value: 'TG' },
    { label: 'Maharashtra', value: 'MH' },
    { label: 'Karnataka', value: 'KA' },
    { label: 'Tamil Nadu', value: 'TN' },
    { label: 'West Bengal', value: 'WB' },
    { label: 'Kerala', value: 'KL' },
    { label: 'Uttar Pradesh', value: 'UP' },
    { label: 'Bihar', value: 'BR' },
    { label: 'Delhi', value: 'DL' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <Image
          source={{ uri: profileImage }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>John Doe</Text>
        <Text style={styles.profileProfession}>Software Engineer</Text>
        <TouchableOpacity style={styles.changeImageButton} onPress={handleImageChange}>
          <Text style={styles.changeImageText}>Change Image</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gender:</Text>
          <Text style={styles.detailValue}>{gender}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Age:</Text>
          <Text style={styles.detailValue}>{age}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>State:</Text>
          <Text style={styles.detailValue}>{selectedState}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Blood Group:</Text>
          <Text style={styles.detailValue}>{bloodGroup}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone Number:</Text>
          <Text style={styles.detailValue}>{phoneNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Height:</Text>
          <Text style={styles.detailValue}>{height}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight:</Text>
          <Text style={styles.detailValue}>{weight}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Physically Handicapped:</Text>
          <Text style={styles.detailValue}>{isHandicapped ? 'Yes' : 'No'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address:</Text>
          <Text style={styles.detailValue}>{address}</Text>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.editFormTitle}>Edit Your Details</Text>
            <ScrollView style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender:</Text>
                <TextInput
                  style={styles.input}
                  value={gender}
                  onChangeText={setGender}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age:</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email:</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>State:</Text>
                <Picker
                  selectedValue={selectedState}
                  onValueChange={(itemValue) => setSelectedState(itemValue)}
                  style={styles.picker}
                >
                  {states.map((state) => (
                    <Picker.Item key={state.value} label={state.label} value={state.value} />
                  ))}
                </Picker>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Blood Group:</Text>
                <TextInput
                  style={styles.input}
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number:</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Height:</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Weight:</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Physically Handicapped:</Text>
                <Switch
                  value={isHandicapped}
                  onValueChange={setIsHandicapped}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Address:</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  profileProfession: {
    fontSize: 16,
    color: '#888',
    marginBottom: 15,
  },
  changeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 20,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  detailsContainer: {
    flexGrow: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 16,
    color: '#777',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  editFormTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
  },
  picker: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#28a745',
    borderRadius: 20,
    width: '48%',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#ff4d4d',
    borderRadius: 20,
    width: '48%',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Profile;