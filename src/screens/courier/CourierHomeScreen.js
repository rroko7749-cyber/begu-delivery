import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';

export default function CourierHomeScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Привет, курьер! 🚀</Text>
          <Text style={styles.subtitle}>Готов к работе?</Text>
        </View>
        <View style={styles.onlineToggle}>
          <Text style={styles.onlineLabel}>
            {isOnline ? 'В сети' : 'Не в сети'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#ccc', true: '#34C759' }}
          />
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayEarnings} ₽</Text>
          <Text style={styles.statLabel}>Заработано сегодня</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayOrders}</Text>
          <Text style={styles.statLabel}>Заказов выполнено</Text>
        </View>
      </View>

      {isOnline ? (
        <TouchableOpacity
          style={styles.ordersButton}
          onPress={() => navigation.navigate('AvailableOrders')}
        >
          <Text style={styles.ordersIcon}>📦</Text>
          <View style={styles.ordersInfo}>
            <Text style={styles.ordersTitle}>Доступные заказы</Text>
            <Text style={styles.ordersSubtitle}>Найти заказы рядом</Text>
          </View>
          <Text style={styles.ordersArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.offlineCard}>
          <Text style={styles.offlineIcon}>😴</Text>
          <Text style={styles.offlineText}>
            Включите статус "В сети" чтобы получать заказы
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Быстрые действия</Text>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>💰</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>История заработка</Text>
            <Text style={styles.actionSubtitle}>Все выплаты и заказы</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>⭐</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Мой рейтинг</Text>
            <Text style={styles.actionSubtitle}>5.0 (0 отзывов)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📊</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Статистика</Text>
            <Text style={styles.actionSubtitle}>Аналитика работы</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>💡 Совет дня</Text>
        <Text style={styles.tipsText}>
          Работайте в часы пик (12-14, 18-20) чтобы получать больше заказов
        </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  onlineToggle: {
    alignItems: 'center',
  },
  onlineLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  stats: {
    flexDirection: 'row',
    padding: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#34C759',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  ordersButton: {
    backgroundColor: '#34C759',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ordersIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  ordersInfo: {
    flex: 1,
  },
  ordersTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  ordersSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 3,
  },
  ordersArrow: {
    color: '#fff',
    fontSize: 32,
  },
  offlineCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  offlineIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  offlineText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  tips: {
    backgroundColor: '#FFF3CD',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
