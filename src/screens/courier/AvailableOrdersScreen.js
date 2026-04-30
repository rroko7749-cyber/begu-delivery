import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';

export default function AvailableOrdersScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);

  // Пример доступных заказов
  const [orders, setOrders] = useState([
    {
      id: 1,
      from: 'ул. Ленина, 10',
      to: 'пр. Мира, 25',
      distance: '3.2 км',
      price: 250,
      description: 'Документы',
      time: '5 мин назад',
    },
    {
      id: 2,
      from: 'ТЦ Галерея',
      to: 'ул. Пушкина, 15',
      distance: '1.8 км',
      price: 180,
      description: 'Посылка небольшая',
      time: '12 мин назад',
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Загрузка заказов из Firebase
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcceptOrder = (order) => {
    // TODO: Принять заказ в Firebase
    navigation.navigate('ActiveDelivery', { orderId: order.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Заказы рядом с вами</Text>
        <Text style={styles.headerSubtitle}>Выберите подходящий</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Нет доступных заказов</Text>
            <Text style={styles.emptySubtext}>Потяните вниз чтобы обновить</Text>
          </View>
        ) : (
          orders.map(order => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>{order.price} ₽</Text>
                </View>
                <Text style={styles.timeText}>{order.time}</Text>
              </View>

              <View style={styles.orderRoute}>
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>📍</Text>
                  <Text style={styles.routeText}>{order.from}</Text>
                </View>
                <Text style={styles.routeArrow}>↓</Text>
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>🎯</Text>
                  <Text style={styles.routeText}>{order.to}</Text>
                </View>
              </View>

              <View style={styles.orderInfo}>
                <Text style={styles.infoItem}>📏 {order.distance}</Text>
                <Text style={styles.infoItem}>📦 {order.description}</Text>
              </View>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptOrder(order)}
              >
                <Text style={styles.acceptButtonText}>Принять заказ</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  orderCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceTag: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  orderRoute: {
    marginBottom: 15,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  routeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  routeText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  routeArrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 10,
    marginVertical: 3,
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
