import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

export default function LoginScreen({ route }: any) {
  const { setToken } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.access_token;
      if (token) {
        await AsyncStorage.setItem('shipper_token', token);
        setToken(token);
      }
    } catch (e: any) {
      Alert.alert('Login Failed', e.response?.data?.message || 'Please check your email and password.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SwiftTrack Shipper</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <Text style={styles.note}>
        *Đăng nhập bằng tài khoản Shipper đã tạo trên Admin Panel
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0B0A10' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 40, textAlign: 'center' },
  input: { backgroundColor: '#1C1828', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#8b5cf6', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  note: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 20 }
});
