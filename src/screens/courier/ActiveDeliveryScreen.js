import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function ActiveDeliveryScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [status, setStatus] = useState('pickup'); // pickup, delivering, completed

  // TODO: Загрузка данных заказа из Firebase
  const order = {
    id: orderId,
    from: 'ул. Ленина, 10',
    to: 'пр. Мира, 25',
    distance: '3.2 км',
    price: 250,
    description: 'Документы',
    client: {
      name: 'Анна',
      phone: '+7 900 123-45-67',
    },
  };

  const handleStatusChange = () => {
    if (status === 'pickup') {
      setStatus('delivering');
      Alert.alert('Отлично!', 'Теперь доставьте груз по адресу');
    } else if (status === 'delivering') {
      setStatus('completed');
      Alert.alert(
        'Заказ выполнен!',
        `Вы заработали ${order.price * 0.85} ₽`,
        [{ text: 'OK', onPress: () => navigation.navigate('CourierHome') }]
      );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pickup':
        return 'Забрать груз';
      case 'delivering':
        return 'Доставить груз';
      case 'completed':
        return 'Завершено';
      default:
        return '';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'pickup':
        return 'Груз забран';
      case 'delivering':
        return 'Груз доставлен';
      default:
        return 'Готово';
    }
  };

  return (
    <View style={styles.container}>
      {/* TODO: Добавить карту с навигацией */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️</Text>
        <Text style={styles.mapSubtext}>Навигация к точке</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Маршрут</Text>
          <View style={styles.address}>
            <Text style={styles.addressIcon}>
              {status === 'pickup' ? '📍' : '✅'}
            </Text>
            <Text style={styles.addressText}>{order.from}</Text>
          </View>
          <Text style={styles.arrow}>↓</Text>
          <View style={styles.address}>
            <Text style={styles.addressIcon}>
              {status === 'completed' ? '✅' : '🎯'}
            </Text>
            <Text style={styles.addressText}>{order.to}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Клиент</Text>
          <View style={styles.clientInfo}>
            <View>
              <Text style={styles.clientName}>{order.client.name}</Text>
              <Text style={styles.clientPhone}>{order.client.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callButtonText}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Детали</Text>
          <Text style={styles.detail}>📦 {order.description}</Text>
          <Text style={styles.detail}>📏 {order.distance}</Text>
        </View>

        <View style={styles.earnings}>
          <Text style={styles.earningsLabel}>Вы получите:</Text>
          <Text style={styles.earningsValue}>{order.price * 0.85} ₽</Text>
          <Text style={styles.earningsHint}>
            (комиссия 15%: {order.price * 0.15} ₽)
          </Text>
        </View>

        {status !== 'completed' && (
          <>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleStatusChange}
            >
              <Text style={styles.completeButtonText}>{getButtonText()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                // TODO: Открыть чат
              }}
            >
              <Text style={styles.chatButtonText}>💬 Написать клиенту</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Alert.alert(
                  'Отменить заказ?',
                  'Это повлияет на ваш рейтинг',
                  [
                    { text: 'Нет', style: 'cancel' },
                    {
                      text: 'Да, отменить',
                      style: 'destructive',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.cancelButtonText}>Отменить заказ</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 64,
  },
  mapSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  info: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
  },
  statusBadge: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  addressIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 10,
    marginVertical: 4,
  },
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#34C759',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 24,
  },
  detail: {
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
  },
  earnings: {
    backgroundColor: '#F0FFF4',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759',
    marginVertical: 5,
  },
  earningsHint: {
    fontSize: 12,
    color: '#999',
  },
  completeButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
});
