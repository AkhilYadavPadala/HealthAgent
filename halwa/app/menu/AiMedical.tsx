import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';

interface Message {
  sender: 'user' | 'llm';
  text: string;
}

interface UploadFile {
  uri: string;
  name?: string;
  type?: string;
}

const App = () => {
  const [pdfFile, setPdfFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerResult | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (file: UploadFile, type: 'pdf' | 'image') => {
    if (!file || !file.uri) {
      Alert.alert('Error', 'Please select a valid file');
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name || `document.${type === 'pdf' ? 'pdf' : 'jpg'}`,
      type: file.type || (type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
    } as any);

    try {
      const endpoint = `http://192.168.29.15:5001/${type === 'pdf' ? 'upload' : 'upload_image'}`;
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadSuccess(true);
      Alert.alert('Success', response.data.message);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file');
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }
  
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: question },
    ]);
  
    try {
      let response;
      if (imageFile && !imageFile.canceled && imageFile.assets?.[0]) {
        // If an image is uploaded, send the image data along with the question
        const file = imageFile.assets[0];
        const base64Image = await convertImageToBase64(file.uri);
        response = await axios.post('http://192.168.29.15:5001/ask_image', {
          question,
          image_base64: base64Image,
        });
      } else {
        // For PDF or text-based questions
        response = await axios.post('http://192.168.29.15:5001/ask', { question });
      }
  
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'llm', text: response.data.answer },
      ]);
    } catch (error) {
      console.error('Ask error:', error);
      Alert.alert('Error', 'Failed to get answer');
    } finally {
      setQuestion('');
    }
  };
  
  // Helper function to convert image URI to base64
  const convertImageToBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(',')[1]); // Extract base64 data
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  

  const pickFile = async () => {
    try {
      // Let the user choose between PDF and image
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow any file type
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileType = file.mimeType;

        if (fileType === 'application/pdf') {
          // Handle PDF
          setPdfFile(result);
          setImageFile(null);
          handleFileUpload(
            {
              uri: file.uri,
              name: file.name,
              type: file.mimeType,
            },
            'pdf'
          );
        } else if (fileType.startsWith('image/')) {
          // Handle Image
          setImageFile(result);
          setPdfFile(null);
          handleFileUpload(
            {
              uri: file.uri,
              name: file.name,
              type: file.mimeType,
            },
            'image'
          );
        } else {
          Alert.alert('Error', 'Unsupported file type. Please select a PDF or image.');
        }
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const getFileName = () => {
    if (pdfFile && !pdfFile.canceled && pdfFile.assets?.[0]) {
      return `Selected PDF: ${pdfFile.assets[0].name}`;
    }
    if (imageFile && !imageFile.canceled && imageFile.assets?.[0]) {
      return `Selected Image: ${imageFile.assets[0].fileName}`;
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.chatContainer}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.sender === 'user' ? styles.userBubble : styles.llmBubble,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.sender === 'user' && styles.userMessageText,
            ]}>
              {message.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.uploadSection}>
        <Text style={styles.title}>Upload a File</Text>
        {getFileName() && (
          <Text style={styles.fileName}>{getFileName()}</Text>
        )}

        {uploading && <ActivityIndicator style={styles.loader} />}
        {uploadSuccess && <Text style={styles.successText}>File uploaded successfully!</Text>}
        {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}
      </View>

      <View style={styles.inputSection}>
        <TouchableOpacity onPress={pickFile} style={styles.clipButton}>
          <FontAwesome name="paperclip" size={24} color="#007bff" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Enter your question"
          value={question}
          onChangeText={setQuestion}
        />
        <TouchableOpacity onPress={handleAskQuestion} style={styles.askButton}>
          <Text style={styles.askButtonText}>Ask</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  chatContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  llmBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
  },
  messageText: {
    color: '#000',
  },
  userMessageText: {
    color: '#fff',
  },
  uploadSection: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  fileName: {
    marginBottom: 10,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 10,
  },
  successText: {
    color: 'green',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  clipButton: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  askButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  askButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default App;