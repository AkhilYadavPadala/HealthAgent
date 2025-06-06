import React, { useState, useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import Home from '../home';
import Chatbot from '../main/chatbot';

const Tab = createBottomTabNavigator();

const EmptyComponent = () => null;

const SOSConfirmationPopup = ({ visible, onConfirm, onCancel }) => {
  const [timer, setTimer] = useState(6); // Start at 6 seconds
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTimer(6); // Reset timer 
      timerRef.current = setInterval(() => {
        Vibration.vibrate(500);
        setTimer((prevTimer) => (prevTimer > 1 ? prevTimer - 1 : 0));
      }, 1000);
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [visible]);

  useEffect(() => {
    if (timer === 0 && visible) {
      clearInterval(timerRef.current);
      onConfirm();
    }
  }, [timer, visible, onConfirm]); // Add onConfirm to dependency array

  const handleCancel = () => {
    clearInterval(timerRef.current);
    onCancel();
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.confirmationContainer}>
        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationText}>Send SOS Alert?</Text>
          <Text style={styles.timerText}>Auto-sending in {timer} seconds...</Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SOSSentOverlay = ({ visible, onClose }) => {
  const [sound, setSound] = useState(null);

  useEffect(() => {
    let soundInstance;
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sos_alert.mp3') 
      );
      soundInstance = sound;
      setSound(sound);
    };

    if (visible) {
      loadSound();
    }

    return () => {
      if (soundInstance) {
        soundInstance.unloadAsync();
      }
    };
  }, [visible]);

  useEffect(() => {
    if (visible && sound) {
      Vibration.vibrate([500, 1000, 500, 1000, 500, 1000]);
      sound.playAsync();
    }
  }, [visible, sound]);

  const handleClose = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    onClose();
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlayContainer}>
        <Text style={styles.overlayText}>🚨 SOS Sent! 🚨</Text>
        <TouchableOpacity onPress={handleClose} style={styles.overlayCloseButton}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const BottomTabNavigator = () => {
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const handleSOSPress = () => {
    setIsConfirmationVisible(true);
  };

  const handleConfirm = () => {
    setIsConfirmationVisible(false);
    setIsOverlayVisible(true);
  };

  const handleCancel = () => {
    setIsConfirmationVisible(false);
  };

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Chatbot') {
              iconName = 'chatbubble';
            } else { // SOS
              iconName = 'alert-circle';
            }
            return <Ionicons name={iconName} size={size} color={route.name === 'SOS' ? 'red' : color} />;
          },
          tabBarActiveTintColor: 'blue',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: styles.tabBarStyle,
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen
          name="SOS"
          component={EmptyComponent}
          options={{
            tabBarButton: () => (
              <TouchableOpacity style={styles.sosTabButtonContainer} onPress={handleSOSPress}>
                <View style={styles.sosButton}>
                  <Text style={styles.sosButtonText}>SOS</Text>
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="Chatbot" component={Chatbot} />
      </Tab.Navigator>

      <SOSConfirmationPopup
        visible={isConfirmationVisible}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <SOSSentOverlay visible={isOverlayVisible} onClose={handleCloseOverlay} />
    </>
  );
};

// 🎨 Styles
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, // Increased padding
    paddingVertical: 15,   // Increased padding
    backgroundColor: '#FFFFFF', // White background
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE', // Light gray border
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeIcon: {
    backgroundColor: '#4CAF50', // Green icon background (example)
    borderRadius: 8,         // Slightly less rounded
    width: 32,              // Larger icon
    height: 32,             // Larger icon
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  homeText: {
    fontSize: 18,            // Slightly larger text
    fontWeight: '500',
    color: '#333333',       // Darker text color
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherServicesText: {
    fontSize: 16,
    color: '#555555',       // Gray color
    marginRight: 15,
  },
  seeAllButton: {
    backgroundColor: '#2196F3', // Blue button background
    borderRadius: 5,           // Rounded corners for button
    paddingVertical: 8,       // Button padding
    paddingHorizontal: 12,      // Button padding
  },
  seeAllText: {
    color: 'white',           // White text on button
    fontSize: 14,
    fontWeight: '500',
  },

  // ... (rest of your styles: sosTabButtonContainer, sosButton, etc.)
  tabBarStyle: {
    height: 80,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE', // Light gray border
    position: 'relative',
  },
  sosTabButtonContainer: {
    position: 'absolute',
    top: -30,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',  // Add shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,        // For Android shadow
  },
  sosButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF0000', // Red SOS button
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
   // ... (confirmation and overlay styles)
   confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  confirmationBox: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,  // Slightly less rounded
    alignItems: 'center',
    elevation: 5, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmationText: {
    fontSize: 20,         // Slightly smaller
    fontWeight: '600',    // Slightly less bold
    marginBottom: 10,
    color: '#333',
  },
  timerText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#FF0000', // Red cancel button
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.7)', // Slightly less opaque
  },
  overlayText: {
    fontSize: 28,  // Slightly smaller
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20, // Added margin
  },
  overlayCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
    borderRadius: 20, // Rounded close button
    padding: 10,
  },
});
export default BottomTabNavigator;