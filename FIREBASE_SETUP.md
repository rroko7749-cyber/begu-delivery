# Инструкция по настройке Firebase

## Шаг 1: Создать проект Firebase

1. Зайди на https://console.firebase.google.com
2. Нажми "Добавить проект"
3. Введи название: "DeliveryPro"
4. Отключи Google Analytics (не нужен для MVP)
5. Создай проект

## Шаг 2: Добавить приложение

1. В консоли Firebase выбери "Добавить приложение"
2. Выбери Android (значок Android)
3. Введи package name: `com.deliverypro`
4. Скачай `google-services.json`
5. Положи файл в `android/app/`

## Шаг 3: Настроить Authentication

1. В меню слева выбери "Authentication"
2. Нажми "Начать"
3. Включи "Телефон" (Phone)
4. Сохрани

## Шаг 4: Настроить Firestore Database

1. В меню слева выбери "Firestore Database"
2. Нажми "Создать базу данных"
3. Выбери "Начать в тестовом режиме"
4. Выбери регион: `europe-west` (ближайший к России)
5. Создай

## Шаг 5: Создать коллекции

Создай следующие коллекции в Firestore:

### users
```
{
  uid: string,
  name: string,
  phone: string,
  type: "client" | "courier",
  rating: number,
  createdAt: timestamp
}
```

### orders
```
{
  id: string,
  clientId: string,
  courierId: string | null,
  fromAddress: string,
  toAddress: string,
  description: string,
  price: number,
  status: "pending" | "accepted" | "pickup" | "delivering" | "completed" | "cancelled",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### earnings
```
{
  courierId: string,
  orderId: string,
  amount: number,
  commission: number,
  date: timestamp
}
```

## Шаг 6: Скопировать конфигурацию

1. В настройках проекта найди "Конфигурация SDK"
2. Скопируй данные `firebaseConfig`
3. Вставь в файл `src/services/firebase.js`

## Шаг 7: Настроить правила безопасности

В Firestore Database → Rules вставь:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пользователи могут читать и писать только свои данные
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Заказы
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.clientId == request.auth.uid || 
         resource.data.courierId == request.auth.uid);
    }
    
    // Заработок курьеров
    match /earnings/{earningId} {
      allow read: if request.auth != null && 
        resource.data.courierId == request.auth.uid;
    }
  }
}
```

## Готово!

Теперь Firebase настроен и готов к использованию.
