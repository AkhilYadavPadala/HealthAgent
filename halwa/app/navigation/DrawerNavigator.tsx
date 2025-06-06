import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, View, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import BottomTabNavigator from './BottomTabNavigator';
import Fav from '../main/fav';
import Stores from '../main/stores';
import MyDoctors from '../menu/docters';
import MedicalRecords from '../menu/MedicalRecords';
import MedicalOrders from '../menu/medicineorder';
import Booking from '../menu/booking';
import Profile from '../main/profile';
import OrderStatus from '../menu/orderstatus';
import OrderDelivered from '../menu/orderdelivered';
import AiMedical from '../menu/AiMedical';
import myappointment from '../menu/myappointment';

const Drawer = createDrawerNavigator();
const scaleAnim = new Animated.Value(1);

const MenuButton = ({ navigation }) => (
  <TouchableOpacity
    onPress={() => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      navigation.toggleDrawer();
    }}
    style={styles.menuButton}
  >
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Ionicons name="menu" size={30} color="black" />
    </Animated.View>
  </TouchableOpacity>
);

const ProfileButton = ({ navigation }) => (
  <TouchableOpacity
    style={styles.profileButton}
    onPress={() => navigation.navigate('Profile')}
  >
    <Ionicons name="person-circle" size={40} color="black" />
  </TouchableOpacity>
);

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerLeft: () => <MenuButton navigation={navigation} />,
        headerRight: () => <ProfileButton navigation={navigation} />,
        headerTitleAlign: 'center',
        headerTitle: 'Health Plus+',
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.3)',
        sceneContainerStyle: { backgroundColor: 'transparent' },
        drawerStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          width: 240,
        },
      })}
    >
      <Drawer.Screen 
        name="Home" 
        component={BottomTabNavigator} 
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="AiMedical" 
        component={AiMedical} 
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="pulse-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="MyDoctors" 
        component={MyDoctors} 
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="medkit-outline" size={size} color={color} />,
        }}
      />
      
      <Drawer.Screen 
       name="MyAppointment" 
      component={myappointment} 
      options={{
    drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
      }}
      />
      
      <Drawer.Screen 
        name="MedicalRecords" 
        component={MedicalRecords} 
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="MedicalOrders" 
        component={MedicalOrders} 
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="Stores" 
        component={Stores} 
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="Favorites" 
        component={Fav} 
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={Profile} 
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      
      {/* <Drawer.Screen 
        name="Booking" 
        component={Booking} 
        options={{ drawerItemStyle: { display: 'none' } }} 
      />
      <Drawer.Screen 
        name="OrderStatus" 
        component={OrderStatus} 
        options={{ drawerItemStyle: { display: 'none' } }} 
      />
      <Drawer.Screen 
        name="OrderDelivered" 
        component={OrderDelivered} 
        options={{ drawerItemStyle: { display: 'none' } }} 
      /> */}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  menuButton: { marginLeft: 15 },
  profileButton: { marginRight: 15 },
});

export default DrawerNavigator;
