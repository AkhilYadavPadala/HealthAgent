import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const AddRecordsScreen: React.FC = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [recordFor, setRecordFor] = useState('');
  const [recordType, setRecordType] = useState('Report');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = [...selectedImages];
    updatedImages.splice(index, 1);
    setSelectedImages(updatedImages);
  };

  const uploadToDrive = async () => {
    // Validate fields before uploading
    if (!recordFor || selectedImages.length === 0) {
      ToastAndroid.showWithGravity(
        'Please fill all fields and add images',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      return;
    }

    // Simulate the upload process
    ToastAndroid.showWithGravity(
      'Record uploaded successfully!',
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    );
  };

  const isFormValid = recordFor && selectedImages.length > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Records</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Record for</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={recordFor}
            placeholder="Enter name"
            onChangeText={setRecordFor}
          />
          {recordFor.length > 0 && (
            <Ionicons name="checkmark-circle" size={20} color="green" style={styles.correctIcon} />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type of record</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentButton, recordType === 'Report' && styles.activeSegmentButton]}
            onPress={() => setRecordType('Report')}
          >
            <Text style={[styles.segmentButtonText, recordType === 'Report' && styles.activeSegmentButtonText]}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, recordType === 'Prescription' && styles.activeSegmentButton]}
            onPress={() => setRecordType('Prescription')}
          >
            <Text style={[styles.segmentButtonText, recordType === 'Prescription' && styles.activeSegmentButtonText]}>Prescription</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, recordType === 'Invoice' && styles.activeSegmentButton]}
            onPress={() => setRecordType('Invoice')}
          >
            <Text style={[styles.segmentButtonText, recordType === 'Invoice' && styles.activeSegmentButtonText]}>Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add more images</Text>
        <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
          <Ionicons name="add-circle-outline" size={40} color="black" />
        </TouchableOpacity>
        <View style={styles.imagePreviewContainer}>
          {selectedImages.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                <Ionicons name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.uploadButton, !isFormValid && styles.disabledButton]}
        onPress={uploadToDrive}
        disabled={!isFormValid}
      >
        <Text style={styles.uploadButtonText}>Upload record</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  input: { flex: 1 },
  correctIcon: { marginLeft: 10 },
  segmentedControl: { flexDirection: 'row', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden' },
  segmentButton: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#fff' },
  activeSegmentButton: { backgroundColor: '#007bff' },
  segmentButtonText: { color: 'black' },
  activeSegmentButtonText: { color: 'white' },
  addImageButton: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 15, alignItems: 'center', marginBottom: 10 },
  imagePreviewContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  imageWrapper: { position: 'relative', marginRight: 10 },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: -5, right: -5 },
  uploadButton: { backgroundColor: '#007bff', borderRadius: 8, padding: 15, alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  uploadButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default AddRecordsScreen;
