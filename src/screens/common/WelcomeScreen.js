import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>📦</Text>
        <Text style={styles.title}>БегуДоставка</Text>
        <Text style={styles.subtitle}>Зарабатывай на доставках</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>💰</Text>
          <Text style={styles.featureText}>Комиссия всего 15%</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>⚡</Text>
          <Text style={styles.featureText}>Быстрые выплаты</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🗺️</Text>
          <Text style={styles.featureText}>Работай где удобно</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.clientButton]}
          onPress={() => navigation.navigate('Login', { userType: 'client' })}
        >
          <Text style={styles.buttonText}>Я клиент</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.courierButton]}
          onPress={() => navigation.navigate('Login', { userType: 'courier' })}
        >
          <Text style={styles.buttonText}>Я курьер</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>Регистрация</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  featureText: {
    fontSize: 18,
    color: '#333',
  },
  buttons: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  clientButton: {
    backgroundColor: '#007AFF',
  },
  courierButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  registerText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
