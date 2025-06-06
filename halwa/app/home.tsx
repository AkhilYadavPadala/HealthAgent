import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Image,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [searchText, setSearchText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const parallaxAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(parallaxAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const popularDoctors = [
    { name: 'Dr. Archana Singh', speciality: 'Orthopedic Surgeon', rating: 37, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVNOKUiWLaZcingTPdF60ReM4hJ1-txGxmTw&s' },
    { name: 'Dr. Namratha', speciality: 'Dentist', rating: 30, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVNOKUiWLaZcingTPdF60ReM4hJ1-txGxmTw&s' },
    { name: 'Dr. JayShah', speciality: 'ENT', rating: 30, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVNOKUiWLaZcingTPdF60ReM4hJ1-txGxmTw&s' },
    { name: 'Dr. Vamsi', speciality: 'Nose', rating: 30, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVNOKUiWLaZcingTPdF60ReM4hJ1-txGxmTw&s' },
    { name: 'Dr. Menon', speciality: 'Hair', rating: 30, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVNOKUiWLaZcingTPdF60ReM4hJ1-txGxmTw&s' },
  ];

  const featuredDoctors = [
    { name: 'Dr. Pavan', speciality: 'Cardiologist', rating: 29, image: 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg?semt=ais_hybrid' },
    { name: 'Dr. Murthy', speciality: 'Neurologist', rating: 35, image: 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg?semt=ais_hybrid' },
    { name: 'Dr. Mahendra', speciality: 'Neurologist', rating: 35, image: 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg?semt=ais_hybrid' },
    { name: 'Dr. Akhil', speciality: 'Neurologist', rating: 35, image: 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg?semt=ais_hybrid' },
    { name: 'Dr. Vishnu', speciality: 'Neurologist', rating: 35, image: 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg?semt=ais_hybrid' },
  ];

  const renderDoctor = ({ item, index }) => {
    const bounceTransform = bounceAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, -15, 0],
    });

    const parallaxTransform = parallaxAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [index % 2 === 0 ? -50 : 50, 0],
    });

    return (
      <Animated.View
        style={[
          styles.doctorCard,
          {
            transform: [{ translateY: bounceTransform }, { translateX: parallaxTransform }],
            opacity: fadeAnim,
          },
        ]}
      >
        {item.image && <Image source={{ uri: item.image }} style={styles.doctorImage} />}
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.doctorSpeciality}>{item.speciality}</Text>
        <Text style={styles.doctorRating}>⭐ {item.rating}</Text>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: '#E3F2FD' }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi Mortal!</Text>
      </View>
      <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
        <Text style={styles.findDoctor}>Find Your Doctor</Text>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search for doctors..."
            placeholderTextColor="#888"
            onChangeText={setSearchText}
            value={searchText}
          />
        </View>
      </Animated.View>
      <Animated.View style={[styles.sectionHeader, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionTitle}>Popular Doctors</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </Animated.View>
      <FlatList
        data={popularDoctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
      <Animated.View style={[styles.sectionHeader, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionTitle}>Featured Doctors</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </Animated.View>
      <FlatList
        data={featuredDoctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  findDoctor: {
    fontSize: 20,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    height: 45,
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#007BFF',
    fontSize: 14,
    fontWeight: '500',
  },
  doctorCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginRight: 12,
    width: 160,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  doctorName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  doctorSpeciality: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
    marginVertical: 4,
  },
  doctorRating: {
    fontSize: 14,
    color: '#28A745',
  },
});

export default HomeScreen;