import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Импорт экранов
import WelcomeScreen from '../screens/common/WelcomeScreen';
import LoginScreen from '../screens/common/LoginScreen';
import RegisterScreen from '../screens/common/RegisterScreen';

// Клиентские экраны
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import CreateOrderScreen from '../screens/client/CreateOrderScreen';
import TrackOrderScreen from '../screens/client/TrackOrderScreen';

// Курьерские экраны
import CourierHomeScreen from '../screens/courier/CourierHomeScreen';
import AvailableOrdersScreen from '../screens/courier/AvailableOrdersScreen';
import ActiveDeliveryScreen from '../screens/courier/ActiveDeliveryScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        {/* Общие экраны */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Вход' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Регистрация' }}
        />

        {/* Клиентские экраны */}
        <Stack.Screen
          name="ClientHome"
          component={ClientHomeScreen}
          options={{ title: 'Главная', headerLeft: null }}
        />
        <Stack.Screen
          name="CreateOrder"
          component={CreateOrderScreen}
          options={{ title: 'Создать заказ' }}
        />
        <Stack.Screen
          name="TrackOrder"
          component={TrackOrderScreen}
          options={{ title: 'Отслеживание' }}
        />

        {/* Курьерские экраны */}
        <Stack.Screen
          name="CourierHome"
          component={CourierHomeScreen}
          options={{ title: 'Главная', headerLeft: null }}
        />
        <Stack.Screen
          name="AvailableOrders"
          component={AvailableOrdersScreen}
          options={{ title: 'Доступные заказы' }}
        />
        <Stack.Screen
          name="ActiveDelivery"
          component={ActiveDeliveryScreen}
          options={{ title: 'Активная доставка' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
