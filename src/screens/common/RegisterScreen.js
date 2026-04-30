import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';

export default function RegisterScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const userType = route.params?.userType || 'client';

  const handleRegister = () => {
    if (!name || !phone || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    // TODO: Интеграция с Firebase Auth
    Alert.alert('Успех', 'Регистрация завершена!', [
      { text: 'OK', onPress: () => navigation.navigate('Login', { userType }) }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {userType === 'client' ? 'Регистрация клиента' : 'Регистрация курьера'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Имя"
        value={name}
        onChangeText={setName}
      />

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

      <TextInput
        style={styles.input}
        placeholder="Подтвердите пароль"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {userType === 'courier' && (
        <View style={styles.courierInfo}>
          <Text style={styles.infoText}>
            Для работы курьером потребуется:
          </Text>
          <Text style={styles.infoItem}>• Паспорт</Text>
          <Text style={styles.infoItem}>• Транспорт (авто/мото/велосипед/пешком)</Text>
          <Text style={styles.infoItem}>• Смартфон с GPS</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Зарегистрироваться</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate('Login', { userType })}
      >
        <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 20,
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
  courierInfo: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginVertical: 3,
  },
  button: {
    backgroundColor: '#34C759',
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
    marginBottom: 40,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
