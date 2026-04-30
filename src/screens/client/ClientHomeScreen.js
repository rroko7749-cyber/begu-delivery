import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function ClientHomeScreen({ navigation }) {
  const [activeOrders, setActiveOrders] = useState([
    // Пример активного заказа
    // { id: 1, from: 'ул. Ленина, 10', to: 'пр. Мира, 25', status: 'В пути', courier: 'Иван' }
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Привет! 👋</Text>
        <Text style={styles.subtitle}>Куда доставить?</Text>
      </View>

      <TouchableOpacity
        style={styles.createOrderButton}
        onPress={() => navigation.navigate('CreateOrder')}
      >
        <Text style={styles.createOrderIcon}>📦</Text>
        <Text style={styles.createOrderText}>Создать заказ</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Активные заказы</Text>
        {activeOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Нет активных заказов</Text>
          </View>
        ) : (
          <ScrollView>
            {activeOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('TrackOrder', { orderId: order.id })}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderRoute}>
                    {order.from} → {order.to}
                  </Text>
                  <Text style={styles.orderStatus}>{order.status}</Text>
                  <Text style={styles.orderCourier}>Курьер: {order.courier}</Text>
                </View>
                <Text style={styles.orderArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Всего заказов</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0 ₽</Text>
          <Text style={styles.statLabel}>Потрачено</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  createOrderButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 25,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createOrderIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  createOrderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 10,
  },
  orderInfo: {
    flex: 1,
  },
  orderRoute: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  orderStatus: {
    fontSize: 14,
    color: '#34C759',
    marginBottom: 3,
  },
  orderCourier: {
    fontSize: 12,
    color: '#666',
  },
  orderArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});
