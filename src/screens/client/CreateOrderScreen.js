import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

export default function CreateOrderScreen({ navigation }) {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  const handleCreateOrder = () => {
    if (!fromAddress || !toAddress) {
      Alert.alert('Ошибка', 'Укажите адреса отправления и доставки');
      return;
    }

    // TODO: Создание заказа в Firebase
    Alert.alert(
      'Заказ создан!',
      'Ищем курьера...',
      [{ text: 'OK', onPress: () => navigation.navigate('ClientHome') }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Откуда забрать? 📍</Text>
        <TextInput
          style={styles.input}
          placeholder="Адрес отправления"
          value={fromAddress}
          onChangeText={setFromAddress}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Куда доставить? 🎯</Text>
        <TextInput
          style={styles.input}
          placeholder="Адрес доставки"
          value={toAddress}
          onChangeText={setToAddress}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Описание груза</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Что нужно доставить? (размер, вес, особенности)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Предложить цену (необязательно)</Text>
        <TextInput
          style={styles.input}
          placeholder="Сумма в рублях"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Text style={styles.hint}>
          Оставьте пустым - курьеры предложат свою цену
        </Text>
      </View>

      <View style={styles.priceInfo}>
        <Text style={styles.priceInfoTitle}>Примерная стоимость:</Text>
        <Text style={styles.priceInfoText}>
          • До 5 км: 150-300 ₽
        </Text>
        <Text style={styles.priceInfoText}>
          • 5-10 км: 300-500 ₽
        </Text>
        <Text style={styles.priceInfoText}>
          • Более 10 км: от 500 ₽
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreateOrder}>
        <Text style={styles.buttonText}>Создать заказ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  priceInfo: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  priceInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  priceInfoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 3,
  },
  button: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
