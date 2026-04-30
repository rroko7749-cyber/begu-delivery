import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function LoginScreen({ navigation, route }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const userType = route.params?.userType || 'client';

  const handleLogin = () => {
    if (!phone || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    // TODO: Интеграция с Firebase Auth
    // Пока просто переходим на главный экран
    if (userType === 'client') {
      navigation.navigate('ClientHome');
    } else {
      navigation.navigate('CourierHome');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {userType === 'client' ? 'Вход для клиента' : 'Вход для курьера'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Номер телефона"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Войти</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate('Register', { userType })}
      >
        <Text style={styles.linkText}>Нет аккаунта? Зарегистрироваться</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
