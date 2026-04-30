import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TrackOrderScreen({ route, navigation }) {
  const { orderId } = route.params;

  // TODO: Загрузка данных заказа из Firebase
  const order = {
    id: orderId,
    from: 'ул. Ленина, 10',
    to: 'пр. Мира, 25',
    status: 'В пути',
    courier: {
      name: 'Иван',
      phone: '+7 900 123-45-67',
      rating: 4.8,
    },
    price: 350,
  };

  return (
    <View style={styles.container}>
      {/* TODO: Добавить карту с маршрутом */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️</Text>
        <Text style={styles.mapSubtext}>Карта с маршрутом</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Маршрут</Text>
          <Text style={styles.address}>📍 {order.from}</Text>
          <Text style={styles.arrow}>↓</Text>
          <Text style={styles.address}>🎯 {order.to}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Курьер</Text>
          <View style={styles.courierInfo}>
            <View>
              <Text style={styles.courierName}>{order.courier.name}</Text>
              <Text style={styles.courierRating}>⭐ {order.courier.rating}</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callButtonText}>📞 Позвонить</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Стоимость</Text>
          <Text style={styles.price}>{order.price} ₽</Text>
        </View>

        <TouchableOpacity style={styles.chatButton}>
          <Text style={styles.chatButtonText}>💬 Написать курьеру</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            // TODO: Отмена заказа
            navigation.goBack();
          }}
        >
          <Text style={styles.cancelButtonText}>Отменить заказ</Text>
        </TouchableOpacity>
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
    backgroundColor: '#34C759',
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
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
    marginVertical: 4,
  },
  courierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  courierRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
