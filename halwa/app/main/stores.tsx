import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  Button,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../components/api';
import Toast from 'react-native-toast-message';

type Product = {
  medid: number;
  name: string;
  image?: string;
  description?: string;
  type?: string;
  cost?: number;
  quantity?: number;
};

type Section = {
  title: string;
  items: Product[];
};

const Stores = () => {
  const navigation = useNavigation();
  const [cart, setCart] = useState<Product[]>([]);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isSectionModalVisible, setIsSectionModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSection, setSelectedSection] = useState<Product[] | null>(null);
  const [userid] = useState(1001);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(api + '/med');
      const groupedSections = response.data.reduce((acc: any, item: Product) => {
        let category = 'Medical';
        if (item.type === 'BabyCare') category = 'Baby Care';
        else if (item.type === 'Sanitary') category = 'Sanitary Products';
        else if (item.type === 'EnergyDrinks') category = 'Energy Drinks';

        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {});

      setSections(
        Object.keys(groupedSections).map((category) => ({
          title: category,
          items: groupedSections[category],
        }))
      );
    } catch (error) {
      console.error('Error fetching products:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch products',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: Product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.medid === item.medid);
      if (existingItemIndex !== -1) {
        return prevCart.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    setIsProductModalVisible(false);
  };

  const removeFromCart = (index: number) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      if (updatedCart[index].quantity! > 1) {
        updatedCart[index].quantity! -= 1;
      } else {
        updatedCart.splice(index, 1);
      }
      return updatedCart;
    });
  };

  const handleOrder = async () => {
    if (cart.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Your cart is empty!',
        position: 'bottom',
      });
      return;
    }

    const medicines = cart.map(item => ({
      medid: item.medid,
      quantity: item.quantity || 1,
    }));

    try {
      await axios.post(api + '/med/order', { userid, medicines });
      setCart([]);
      Toast.show({
        type: 'success',
        text1: 'Order placed successfully!',
        text2: 'Thank you for shopping with us.',
        position: 'bottom',
      });
      setIsCartModalVisible(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'There was an error placing the order. Please try again.',
        position: 'bottom',
      });
    }
  };

  const getPlaceholderImage = (title: string) => {
    switch (title) {
      case 'Medical':
        return 'https://t4.ftcdn.net/jpg/02/81/42/77/360_F_281427785_gfahY8bX4VYCGo6jlfO8St38wS9cJQop.jpg';
      case 'Baby Care':
        return 'https://static.wixstatic.com/media/34206f_d9a64093ae4245eb930fe84f7cc0e85b~mv2.png/v1/fill/w_480,h_480,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/34206f_d9a64093ae4245eb930fe84f7cc0e85b~mv2.png';
      case 'Energy Drinks':
        return 'https://wingreensworld.com/cdn/shop/files/energydrinkbeerbuzzpackof3.jpg?v=1724244779&width=450';
      default:
        return 'https://via.placeholder.com/120';
    }
  };

  const renderSection = (section: Section) => (
    <View style={styles.section} key={section.title}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedSection(section.items);
            setIsSectionModalVisible(true);
          }}
        >
          <Ionicons name="arrow-forward" size={24} color="blue" />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {section.items.slice(0, 3).map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.itemCard}
            onPress={() => {
              setSelectedProduct(item);
              setIsProductModalVisible(true);
            }}
          >
            <Image
              source={{ uri: item.image || getPlaceholderImage(section.title) }}
              style={styles.itemImage}
            />
            <Text style={styles.itemText}>{item.name || 'Unknown Product'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={28} color="#007bff" />
  </TouchableOpacity>
        <Text style={styles.heading}>Stores</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => setIsCartModalVisible(true)}>
          <Ionicons name="cart" size={28} color="black" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={sections}
          renderItem={({ item }) => renderSection(item)}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.sectionList}
        />
      )}

      <ProductModal
        isVisible={isProductModalVisible}
        product={selectedProduct}
        onClose={() => setIsProductModalVisible(false)}
        onAddToCart={addToCart}
      />

      <CartModal
        isVisible={isCartModalVisible}
        cart={cart}
        onClose={() => setIsCartModalVisible(false)}
        onRemove={removeFromCart}
        onAdd={addToCart}
        onOrder={handleOrder}
      />

      <SectionModal
        isVisible={isSectionModalVisible}
        section={selectedSection}
        onClose={() => setIsSectionModalVisible(false)}
        onProductPress={(item) => {
          setSelectedProduct(item);
          setIsProductModalVisible(true);
        }}
      />

      <Toast />
    </View>
  );
};

const ProductModal = ({ isVisible, product, onClose, onAddToCart }: any) => (
  <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Image
          source={{ uri: product?.image || 'https://t4.ftcdn.net/jpg/02/81/42/77/360_F_281427785_gfahY8bX4VYCGo6jlfO8St38wS9cJQop.jpg' }}
          style={styles.popupImage}
        />
        <Text style={styles.popupName}>{product?.name}</Text>
        <Text style={styles.popupDescription}>{product?.description}</Text>
        <Text style={styles.popupPrice}>₹{product?.cost}</Text>
        <View style={styles.modalButtons}>
          <Button title="Close" onPress={onClose} color="red" />
          <Button title="Add to Cart" onPress={() => onAddToCart(product)} />
        </View>
      </View>
    </View>
  </Modal>
);

const CartModal = ({ isVisible, cart, onClose, onRemove, onAdd, onOrder }: any) => (
  <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
    <View style={styles.modalContainer}>
      <View style={styles.cartModalContent}>
        <Text style={styles.modalTitle}>Your Cart</Text>
        <ScrollView style={styles.cartItemsContainer}>
          {cart.map((item: Product, index: number) => (
            <View key={index} style={styles.cartRow}>
              <Text style={styles.cartItem}>{item.name} - ₹{item.cost} (x{item.quantity})</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity onPress={() => onRemove(index)}>
                  <Ionicons name="remove-circle" size={24} color="red" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => onAdd(item)}>
                  <Ionicons name="add-circle" size={24} color="green" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {cart.length === 0 && <Text style={styles.emptyCartText}>Your cart is empty.</Text>}
        </ScrollView>
        <View style={styles.cartSummary}>
          <Text style={styles.summaryText}>Total Items: {cart.reduce((acc: number, item: Product) => acc + (item.quantity || 1), 0)}</Text>
          <Text style={styles.summaryText}>Total Price: ₹{cart.reduce((acc: number, item: Product) => acc + (item.cost || 0) * (item.quantity || 1), 0)}</Text>
        </View>
        <View style={styles.cartButtons}>
          <Button title="Close" onPress={onClose} color="red" />
          <Button title="Order Now" onPress={onOrder} />
        </View>
      </View>
    </View>
  </Modal>
);

const SectionModal = ({ isVisible, section, onClose, onProductPress }: any) => (
  <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
    <View style={styles.modalContainer}>
      <View style={styles.sectionModalContent}>
        <Text style={styles.modalTitle}>All Items</Text>
        <ScrollView style={styles.sectionItemsContainer}>
          {section?.map((item: Product, index: number) => (
            <TouchableOpacity key={index} style={styles.sectionItem} onPress={() => onProductPress(item)}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/120' }}
                style={styles.sectionItemImage}
              />
              <Text style={styles.sectionItemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Close" onPress={onClose} color="red" />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#f9f9f9'},
  heading: { fontSize: 24, fontWeight: 'bold', color: '#333',marginLeft:40 },
  cartButton: { flexDirection: 'row', alignItems: 'center' },
  cartBadge: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 6,
    marginBottom: 10,
    marginLeft: -10,
  },
  cartBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  section: { marginBottom: 20, paddingHorizontal: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  itemCard: { marginRight: 10, width: 120, alignItems: 'center' },
  itemImage: { width: 100, height: 100, borderRadius: 10 },
  itemText: { textAlign: 'center', fontSize: 14, marginTop: 5, color: '#555' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { backgroundColor: 'white', width: '90%', padding: 20, borderRadius: 10 },
  cartModalContent: { backgroundColor: 'white', width: '90%', padding: 20, borderRadius: 10, maxHeight: '80%' },
  sectionModalContent: { backgroundColor: 'white', width: '90%', padding: 20, borderRadius: 10, maxHeight: '80%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  cartItem: { fontSize: 16, color: '#555' },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  quantityText: { marginHorizontal: 10, fontSize: 16 },
  cartSummary: { marginVertical: 10, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 10 },
  summaryText: { fontSize: 16, color: '#333' },
  cartButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  emptyCartText: { textAlign: 'center', fontSize: 16, color: '#555' },
  popupImage: { width: 120, height: 120, borderRadius: 10, alignSelf: 'center' },
  popupName: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 10, color: '#333' },
  popupDescription: { textAlign: 'center', marginVertical: 10, color: '#555' },
  popupPrice: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#333' },
  sectionItemsContainer: { marginBottom: 10 },
  sectionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionItemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
  sectionItemText: { fontSize: 16, color: '#333' },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 3,
    top: 10,
    zIndex: 10,
    },
});

export default Stores;