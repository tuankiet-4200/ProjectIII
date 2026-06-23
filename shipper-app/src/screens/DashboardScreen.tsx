import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Linking, Platform, Modal, SafeAreaView } from 'react-native';
import { Phone, Map as MapIcon, Camera as CameraIcon, X } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { trackingService } from '../services/trackingService';
import { BASE_SOCKET_URL } from '../api';

export default function DashboardScreen({ route }: any) {
  const { setToken } = route.params;
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanId, setScanId] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gpsActive, setGpsActive] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setIsCameraOpen(false);
    setScanId(data);
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền Camera để quét mã.');
        return;
      }
    }
    setScanned(false);
    setIsCameraOpen(true);
  };

  const loadDeliveries = async () => {
    try {
      const data = await trackingService.getActiveDeliveries();
      setDeliveries(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load active deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();

    const newSocket = io(BASE_SOCKET_URL + '/gps-tracking', { transports: ['websocket'] });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to broadcast GPS.');
        return;
      }

      setGpsActive(true);
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (location) => {
          if (socket && deliveries.length > 0) {
            deliveries.forEach(d => {
              socket.emit('updateLocation', {
                shopOrderId: d.id,
                lat: location.coords.latitude,
                lng: location.coords.longitude,
              });
            });
          }
        }
      );
    };

    if (socket && deliveries.length > 0) {
      startWatching();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [socket, deliveries]);

  const handleAcceptOrder = async () => {
    if (!scanId.trim()) return;
    try {
      await trackingService.createEvent(scanId, {
        event_type: 'picked_up',
        location: 'Shipper Scan',
      });
      Alert.alert('Success', 'Order accepted successfully!');
      setScanId('');
      loadDeliveries();
    } catch (e: any) {
      Alert.alert('Failed', e.response?.data?.message || 'Failed to accept order.');
    }
  };

  const handleUpdateEvent = async (shopOrderId: string, eventType: string, location: string) => {
    if (eventType === 'delivered') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền Camera để chụp ảnh xác nhận.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
      });

      if (result.canceled || !result.assets[0].uri) return;

      setLoading(true);
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'pod.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('files', {
          uri,
          name: filename,
          type,
        } as any);

        const uploadRes = await fetch(`${BASE_SOCKET_URL}/api/uploads`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const uploadData = await uploadRes.json();
        const imageUrl = uploadData.urls[0];

        await trackingService.createEvent(shopOrderId, { event_type: eventType, location, proof_image: imageUrl });
        Alert.alert('Thành công', 'Đã giao hàng và lưu ảnh xác nhận!');
        loadDeliveries();
      } catch (e) {
        setLoading(false);
        Alert.alert('Lỗi', 'Tải ảnh thất bại hoặc lỗi máy chủ.');
      }
      return;
    }

    try {
      setLoading(true);
      await trackingService.createEvent(shopOrderId, { event_type: eventType, location });
      Alert.alert('Thành công', 'Cập nhật trạng thái thành công!');
      loadDeliveries();
    } catch (e) {
      setLoading(false);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('shipper_token');
    setToken(null);
  };

  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('Lỗi', 'Khách hàng không có số điện thoại.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleMap = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
    });
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shipper App</Text>
          <Text style={[styles.headerSubtitle, { color: gpsActive ? '#10b981' : '#3b82f6' }]}>
            {gpsActive ? '● GPS Active' : '● GPS Standby (No active deliveries)'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ padding: 15 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accept New Delivery</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Shop Order ID..."
              placeholderTextColor="#666"
              value={scanId}
              onChangeText={setScanId}
            />
            <TouchableOpacity style={styles.btnCamera} onPress={openCamera}>
              <CameraIcon size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccept} onPress={handleAcceptOrder}>
              <Text style={styles.btnText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Active Deliveries ({deliveries.length})</Text>

        {deliveries.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No active deliveries.</Text>
             <Text style={styles.emptyText}>Scan an order ID above to claim one.</Text>
          </View>
        ) : null}

        {deliveries.map(order => (
          <View key={order.id} style={styles.deliveryCard}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryId}>ID: {order.id.slice(0,8)}</Text>
              <Text style={styles.deliveryStatus}>{order.status}</Text>
            </View>
            <View style={styles.customerInfoContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{order.parent_order.user.full_name}</Text>
                <Text style={styles.customerAddress}>{order.parent_order.shipping_address}</Text>
              </View>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleCall(order.parent_order.user.phone)}>
                  <Phone size={18} color="#8b5cf6" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleMap(order.parent_order.shipping_address)}>
                  <MapIcon size={18} color="#10b981" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateEvent(order.id, 'arrived_at_hub', 'Sorting Hub')}>
                <Text style={styles.actionBtnText}>At Hub</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateEvent(order.id, 'delivering', 'On the way')}>
                <Text style={styles.actionBtnText}>Delivering</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleUpdateEvent(order.id, 'delivered', 'Front door')}>
                <Text style={styles.actionBtnText}>Delivered</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={isCameraOpen} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
              }}
            />
            <View style={{ position: 'absolute', top: 50, right: 20 }}>
              <TouchableOpacity onPress={() => setIsCameraOpen(false)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 }}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 10, overflow: 'hidden' }}>
                Đưa camera vào mã vạch/QR...
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0A10', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#333', backgroundColor: '#14121C' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  logoutBtn: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#1C1828', padding: 15, borderRadius: 15, marginBottom: 20 },
  cardTitle: { color: '#aaa', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: '#0B0A10', color: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  btnCamera: { backgroundColor: '#333', paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  btnAccept: { backgroundColor: '#8b5cf6', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { color: '#aaa', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', paddingHorizontal: 5 },
  emptyState: { padding: 30, backgroundColor: '#14121C', borderRadius: 15, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center' },
  deliveryCard: { backgroundColor: '#14121C', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  deliveryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  deliveryId: { color: '#888', fontSize: 12, fontFamily: 'monospace' },
  deliveryStatus: { color: '#c4b5fd', fontSize: 10, fontWeight: 'bold', backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  customerInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  customerName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  customerAddress: { color: '#aaa', fontSize: 13 },
  quickActions: { flexDirection: 'row', gap: 10, marginLeft: 10 },
  iconBtn: { backgroundColor: '#1C1828', padding: 10, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#333', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
