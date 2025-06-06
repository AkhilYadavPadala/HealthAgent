import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
} from "react-native";
import { io, Socket } from "socket.io-client";
import Icon from "react-native-vector-icons/MaterialIcons";
// Import Expo Audio and FileSystem modules
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const SOCKET_URL = "http://192.168.29.15:5000"; // Update as needed

// Message interface for chat messages
interface Message {
  sender: "User" | "Agent";
  text: string;
  id: number;
  agent?: string;
}

// Doctor interface for appointment flow
interface Doctor {
  name: string;
  specialty: string;
  location: string;
  available_slots: string[];
}

/* -------------------------------------------
   Animated Components
-------------------------------------------- */
// Animated option button for health problems & other buttons
const AnimatedOptionButton = ({
  text,
  onPress,
  delay = 0,
  style,
}: {
  text: string;
  onPress: () => void;
  delay?: number;
  style?: any;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity style={[styles.optionButton, style]} onPress={onPress}>
        <Text style={styles.buttonText}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated checkbox for symptoms and severity options
const AnimatedCheckbox = ({
  children,
  onPress,
  delay = 0,
}: {
  children: React.ReactNode;
  onPress: () => void;
  delay?: number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    </Animated.View>
  );
};

export default function App() {
  // Common chat states
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Message[]>([
    { id: 0, sender: "Agent", text: "Please select your health problem:" },
  ]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const messageIdCounter = useRef(1);

  // Health query states (1st frontend)
  const [selectedHealthProblem, setSelectedHealthProblem] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [queryString, setQueryString] = useState<string>(""); // Holds the query text
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [querySubmitted, setQuerySubmitted] = useState(false);
  const [appointmentClicked, setAppointmentClicked] = useState(false);
  const [showDoctorSelection, setShowDoctorSelection] = useState(false);

  // For custom symptom (Other) input modal
  const [showCustomSymptomModal, setShowCustomSymptomModal] = useState(false);
  const [customSymptom, setCustomSymptom] = useState("");

  // Doctor/appointment states (2nd frontend)
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showOtherHealthProblems, setShowOtherHealthProblems] = useState(false);
  // Optional: Animation state for send button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Define an ordered list of health problems
  const primaryHealthProblems = [
    "Allergy",
    "Back Pain",
    "Common Cold",
    "Fever",
    "Headache",
    "Stomach Ache",
  ];

  const secondaryHealthProblems = [
    "Flu",
    "Migraine",
    "Diabetes",
    "Anxiety",
    "Depression"
  ]

  useEffect(() => {
    const ws = io(SOCKET_URL, { transports: ["websocket"] });

    ws.on("connect", () => console.log("Connected to WebSocket"));

    ws.on("message", (data: any) => {
      const newMessageId = messageIdCounter.current++;
      // Try to parse data.content as JSON (to detect doctors list)
      let parsedContent;
      try {
        parsedContent = JSON.parse(data.content);
      } catch (error) {
        parsedContent = null;
      }
      // If parsed content is an array, assume it is a list of doctors.
      if (Array.isArray(parsedContent)) {
        setDoctors(parsedContent);
        setShowDoctorSelection(true);
        setIsTyping(false);
        return;
      }
      // Appointment confirmation handling:
      if (data.content.toLowerCase().includes("appointment confirmed")) {
        setDoctors([]);
        setSelectedDoctor(null);
      }
      // Otherwise, add the message to the chat.
      setChat((prevChat) => [
        ...prevChat,
        {
          sender: data.sender === "User" ? "User" : "Agent",
          text: data.content,
          id: newMessageId,
          agent: data.agent,
        },
      ]);
      setIsTyping(false);
    });

    ws.on("doctors_list", (data: { doctors: Doctor[] }) => {
      setDoctors(data.doctors);
      setShowDoctorSelection(true);
    });

    ws.on("error", (error: any) => {
      console.error("WebSocket Error:", error);
    });

    ws.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    setSocket(ws);
    return () => ws.disconnect();
  }, []);

  // Send a message over the socket and add to chat
  const sendMessage = (msg: string) => {
    if (!socket) return;
    const newMessageId = messageIdCounter.current++;
    setChat((prevChat) => [
      ...prevChat,
      { sender: "User", text: msg, id: newMessageId },
    ]);
    socket.emit("message", { message: msg });
  };

  // Audio Recording functions using Expo Audio & FileSystem
  const startRecording = async () => {
    try {
      console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    console.log("Stopping recording..");
    setIsRecording(false);
    if (recording) {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log("Recording stopped and stored at", uri);

      // Read the audio file as base64
      if (uri) {
        const audioData = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (socket) {
          setIsTyping(true);
          socket.emit("audio", { audio: audioData, type: "audio" });
        }
      }
    }
    setRecording(null);
  };

  // Health problem selection handler
  const handleHealthProblemSelection = (problem: string) => {
    setSelectedHealthProblem(problem);
    setSymptoms(getSymptomsForProblem(problem));
    setSelectedSymptoms([]);
    setSelectedSeverity(null);
    setQueryString(`I am facing ${problem} with symptoms like`);
  };

  // Toggle symptom checkbox
  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Handler for adding a custom symptom from the modal
  const addCustomSymptom = () => {
    if (!customSymptom.trim()) {
      Alert.alert("Please enter a symptom");
      return;
    }
    if (!selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
    }
    setCustomSymptom("");
    setShowCustomSymptomModal(false);
  };

  // Submit the symptoms and severity to form the query string
  const handleSubmit = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert("Please select at least one symptom");
      return;
    }
    if (!selectedSeverity) {
      Alert.alert("Please select a severity");
      return;
    }

    let severityText = "";
    switch (selectedSeverity.toLowerCase()) {
      case "mild":
        severityText = "mildly";
        break;
      case "moderate":
        severityText = "moderately";
        break;
      case "severe":
        severityText = "severely";
        break;
      default:
        severityText = selectedSeverity;
    }

    const updatedQueryString = `${queryString} ${selectedSymptoms.join(
      ", "
    )} ${severityText}`;
    setQueryString(updatedQueryString);
    sendMessage(updatedQueryString);
    setQuerySubmitted(true);
    setSymptoms([]);
    setSelectedSymptoms([]);
    setSelectedSeverity(null);
  };

  // Return a list of symptoms for the chosen health problem
  const getSymptomsForProblem = (problem: string) => {
    switch (problem) {
      case "Common Cold":
        return [
          "Body Aches",
          "Cough",
          "Dry Cough",
          "Fatigue",
          "Loss of Appetite",
          "Low Energy",
          "Mild Chills",
          "Mild Fever",
          "Mild Headache",
          "Nasal Congestion",
          "Postnasal Drip",
          "Runny Nose",
          "Sore Throat",
          "Sneezing",
          "Watery Eyes",
        ];
      case "Fever":
        return [
          "Chills",
          "Confusion",
          "Dizziness",
          "High Temperature",
          "Headache",
          "Joint Pain",
          "Loss of Appetite",
          "Muscle Aches",
          "Nausea",
          "Rapid Heartbeat",
          "Shivering",
          "Sweating",
          "Weakness",
          "Dehydration",
          "Vomiting",
        ];
      case "Headache":
        return [
          "Aura",
          "Blurred Vision",
          "Concentration Difficulties",
          "Dizziness",
          "Fatigue",
          "Irritability",
          "Neck Stiffness",
          "Pressure Behind Eyes",
          "Pulsating Pain",
          "Scalp Tenderness",
          "Sensitivity to Light",
          "Difficulty Concentrating",
          "Sinus Pressure",
          "Throbbing Pain",
          "Tightness Around Forehead",
        ];
      case "Stomach Ache":
        return [
          "Abdominal Pain",
          "Acid Reflux",
          "Bloating",
          "Constipation",
          "Cramping",
          "Diarrhea",
          "Dizziness",
          "Gas",
          "Heartburn",
          "Indigestion",
          "Loss of Appetite",
          "Nausea",
          "Stomach Cramps",
          "Vomiting",
        ];
      case "Allergy":
        return [
          "Cough",
          "Fatigue",
          "Hives",
          "Itchy Eyes",
          "Itchy Skin",
          "Itchy Throat",
          "Loss of Appetite",
          "Nasal Congestion",
          "Runny Nose",
          "Shortness of Breath",
          "Skin Rash",
          "Sneezing",
          "Swelling",
          "Watery Eyes",
          "Sinus Pressure",
        ];
      case "Flu":
        return [
          "Body Aches",
          "Chills",
          "Dizziness",
          "Dry Cough",
          "Fatigue",
          "Headache",
          "High Fever",
          "Loss of Appetite",
          "Muscle Aches",
          "Nausea",
          "Runny Nose",
          "Shivering",
          "Sore Throat",
          "Sweating",
          "Weakness",
        ];
      case "Migraine":
        return [
          "Aura",
          "Blurred Vision",
          "Concentration Difficulties",
          "Dizziness",
          "Fatigue",
          "Irritability",
          "Neck Stiffness",
          "Pulsating Pain",
          "Severe Throbbing Pain",
          "Sensitivity to Light",
          "Sensitivity to Sound",
          "Tingling Sensations",
          "Difficulty Speaking",
          "Vomiting",
          "Nausea",
        ];
      case "Back Pain":
        return [
          "Dull Ache",
          "Lower Back Pain",
          "Morning Stiffness",
          "Muscle Spasms",
          "Numbness",
          "Pain when Bending",
          "Pain when Lifting",
          "Poor Posture",
          "Radiating Pain",
          "Sharp Pain",
          "Stiffness",
          "Tingling",
          "Tight Muscles",
          "Difficulty Standing",
          "Pain when Lifting",
        ];
      case "Diabetes":
        return [
          "Blurred Vision",
          "Excessive Thirst",
          "Frequent Urination",
          "Fatigue",
          "Slow Healing",
          "Tingling in Hands/Feet",
          "Unexplained Weight Loss"
        ];
      case "Anxiety":
        return [
          "Restlessness",
          "Rapid Heartbeat",
          "Sweating",
          "Trembling",
          "Difficulty Concentrating",
          "Sleep Problems",
          "Panic Attacks"
        ];
        case "Depression":
          return [
            "Persistent Sadness",
            "Loss of Interest",
            "Appetite Changes",
            "Sleep Disturbances",
            "Fatigue",
            "Feelings of Worthlessness",
            "Difficulty Concentrating"
          ];
      default:
        return [];
    }
  };

  // Doctor selection handler (from 2nd frontend)
  const handleDoctorSelection = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  // Slot selection handler (from 2nd frontend)
  const handleSlotSelection = (doctorName: string, slot: string) => {
    if (socket) {
      socket.emit("message", {
        message: `Book appointment with Dr. ${doctorName} at ${slot}`,
      });
    }
    setSelectedDoctor(null);
  };

  // When the user clicks the "Bhimavaram" button,
  // send the message and show the doctor selection UI.
  const handleBhimavaram = () => {
    sendMessage("Bhimavaram");
    setShowDoctorSelection(true);
  };

  // Back to main menu resets all states
  const handleBackToMainMenu = () => {
    setSelectedHealthProblem(null);
    setSymptoms([]);
    setSelectedSymptoms([]);
    setSelectedSeverity(null);
    setQueryString("");
    setQuerySubmitted(false);
    setAppointmentClicked(false);
    setShowDoctorSelection(false);
    setSelectedDoctor(null);
    setDoctors([]);
    setMessage("");
    setChat([
      { id: 0, sender: "Agent", text: "Please select your health problem:" },
    ]);
    setShowOtherHealthProblems(false);
  };

  // Animation for send button (optional)
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Sort symptoms alphabetically before displaying
  const sortedSymptoms = symptoms.slice().sort((a, b) => a.localeCompare(b));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chatContainer}>
        {chat.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}

        {/* Health problem selection UI */}
        {!selectedHealthProblem && !querySubmitted && (
          <View style={styles.buttonContainer}>
            {primaryHealthProblems.map((problem, index) => (
              <AnimatedOptionButton
                key={problem}
                text={problem}
                delay={index * 100}
                onPress={() => handleHealthProblemSelection(problem)}
              />
            ))}
            <AnimatedOptionButton
              text="Others"
              delay={primaryHealthProblems.length * 100}
              onPress={() => setShowOtherHealthProblems(!showOtherHealthProblems)}
              style={{ backgroundColor: "#FF8C00" }}
    />

    {showOtherHealthProblems && secondaryHealthProblems.map((problem, index) => (
      <AnimatedOptionButton
        key={problem}
        text={problem}
        delay={index * 100}
        onPress={() => handleHealthProblemSelection(problem)}
      />
    ))}
          </View>
        )}

        {/* Symptom & Severity selection UI */}
        {selectedHealthProblem && !querySubmitted && (
          <View style={styles.checkboxSection}>
            <Text style={styles.sectionTitle}>Select Symptoms:</Text>
            <View style={styles.symptomContainer}>
              {sortedSymptoms.map((symptom, index) => (
                <AnimatedCheckbox
                  key={symptom}
                  delay={index * 50}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <View style={styles.checkboxContainer}>
                    <Icon
                      name={
                        selectedSymptoms.includes(symptom)
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={24}
                      color="#000"
                    />
                    <Text style={styles.checkboxLabel}>{symptom}</Text>
                  </View>
                </AnimatedCheckbox>
              ))}
              {/* "Other" option button */}
              <AnimatedOptionButton
                text="Other"
                delay={sortedSymptoms.length * 50}
                onPress={() => setShowCustomSymptomModal(true)}
                style={{ backgroundColor: "#FF8C00" }}
              />
            </View>

            <Text style={styles.sectionTitle}>Select Severity:</Text>
            <View style={styles.symptomContainer}>
              {["Mild", "Moderate", "Severe"].map((option, index) => (
                <AnimatedCheckbox
                  key={option}
                  delay={index * 50}
                  onPress={() => setSelectedSeverity(option)}
                >
                  <View style={styles.checkboxContainer}>
                    <Icon
                      name={
                        selectedSeverity === option
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={24}
                      color="#000"
                    />
                    <Text style={styles.checkboxLabel}>{option}</Text>
                  </View>
                </AnimatedCheckbox>
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* After submission: show Book Appointment button */}
        {querySubmitted && !appointmentClicked && !showDoctorSelection && (
          <View style={styles.buttonContainer}>
            <AnimatedOptionButton
              text="Book Appointment"
              onPress={() => setAppointmentClicked(true)}
              delay={100}
            />
          </View>
        )}

        {/* After Book Appointment is clicked: show Bhimavaram button */}
        {querySubmitted && appointmentClicked && !showDoctorSelection && (
          <View style={styles.buttonContainer}>
            <AnimatedOptionButton
              text="Bhimavaram"
              onPress={handleBhimavaram}
              delay={100}
            />
          </View>
        )}

        {/* Doctor selection UI */}
        {showDoctorSelection && (
          <>
            {doctors.length > 0 && !selectedDoctor && (
              <View style={styles.doctorsContainer}>
                <Text style={styles.doctorsTitle}>Available Doctors:</Text>
                {doctors.map((doctor, index) => (
                  <AnimatedOptionButton
                    key={doctor.name}
                    text={doctor.name}
                    onPress={() => handleDoctorSelection(doctor)}
                    delay={index * 100}
                  />
                ))}
              </View>
            )}

            {selectedDoctor && (
              <View style={styles.slotsContainer}>
                <Text style={styles.slotsTitle}>
                  Available Slots for {selectedDoctor.name}:
                </Text>
                {selectedDoctor.available_slots &&
                selectedDoctor.available_slots.length > 0 ? (
                  selectedDoctor.available_slots.map((slot, index) => (
                    <AnimatedOptionButton
                      key={index}
                      text={slot}
                      onPress={() =>
                        handleSlotSelection(selectedDoctor.name, slot)
                      }
                      delay={index * 100}
                    />
                  ))
                ) : (
                  <Text style={styles.noSlotsText}>No available slots</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Back to Main Menu */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: "#FF6347" }]}
          onPress={handleBackToMainMenu}
        >
          <Text style={styles.buttonText}>Back to Main Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Manual message input with audio functionality */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
            <Icon
              name={isRecording ? "stop" : "mic"}
              size={20}
              color={isRecording ? "red" : "#888"}
              style={styles.micIcon}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
          />
        </View>
        <TouchableOpacity
          onPress={() => {
            animateButton();
            sendMessage(message);
            setMessage("");
            setIsTyping(true);
          }}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[styles.sendButton, { transform: [{ scale: scaleAnim }] }]}
          >
            <Icon name="arrow-forward" size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Modal for custom symptom input */}
      <Modal
        visible={showCustomSymptomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomSymptomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter your symptom</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Custom symptom..."
              value={customSymptom}
              onChangeText={setCustomSymptom}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={addCustomSymptom}>
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#FF6347" }]}
                onPress={() => setShowCustomSymptomModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const MessageItem = ({ message }: { message: Message }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (message.sender === "Agent") {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [fadeAnim, slideAnim, message.sender]);

  return (
    <Animated.View
      style={[
        styles.messageBox,
        message.sender === "User" ? styles.userBox : styles.botBox,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {message.sender === "Agent" && (
        <Text style={styles.sender}>
          {message.agent && `(${message.agent})`}:
        </Text>
      )}
      {message.text.split("\n").map((line, index) => (
        <Text key={index} style={styles.messageText}>
          {line}
        </Text>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f7fa",
    padding: 20,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  messageBox: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 8,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 40,
  },
  userBox: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
  },
  botBox: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  sender: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    flex: 1,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 10,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 10,
  },
  optionButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomButtonsContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  checkboxSection: {
    marginVertical: 15,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  symptomContainer: {
    marginVertical: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 15,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  doctorsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  slotsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  slotsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  noSlotsText: {
    fontStyle: "italic",
    color: "#555",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  modalInput: {
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
});

