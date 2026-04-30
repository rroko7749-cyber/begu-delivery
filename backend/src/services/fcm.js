const admin = require('firebase-admin');
const db = require('../config/database');

// Инициализация Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    // В продакшене здесь должен быть путь к service account JSON
    // Для разработки используем заглушку
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      firebaseInitialized = true;
      console.log('✅ Firebase initialized');
    } else {
      console.log('⚠️  Firebase not configured (FIREBASE_SERVICE_ACCOUNT not set)');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
};

// Отправить push-уведомление одному пользователю
const sendPushNotification = async (userId, notification) => {
  if (!firebaseInitialized) {
    console.log('Firebase not initialized, skipping push notification');
    return { success: false, reason: 'not_configured' };
  }

  try {
    // Получаем FCM токен пользователя из БД
    const result = await db.query(
      'SELECT fcm_token FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].fcm_token) {
      return { success: false, reason: 'no_token' };
    }

    const fcmToken = result.rows[0].fcm_token;

    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);

    return { success: true, messageId: response };
  } catch (error) {
    console.error('Send push notification error:', error);

    // Если токен невалидный - удаляем его
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      await db.query(
        'UPDATE users SET fcm_token = NULL WHERE id = $1',
        [userId]
      );
    }

    return { success: false, error: error.message };
  }
};

// Отправить push-уведомление нескольким пользователям
const sendPushNotificationToMultiple = async (userIds, notification) => {
  if (!firebaseInitialized) {
    console.log('Firebase not initialized, skipping push notifications');
    return { success: false, reason: 'not_configured' };
  }

  try {
    // Получаем FCM токены пользователей
    const result = await db.query(
      'SELECT id, fcm_token FROM users WHERE id = ANY($1) AND fcm_token IS NOT NULL',
      [userIds]
    );

    if (result.rows.length === 0) {
      return { success: false, reason: 'no_tokens' };
    }

    const tokens = result.rows.map(row => row.fcm_token);

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Удаляем невалидные токены
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await db.query(
          'UPDATE users SET fcm_token = NULL WHERE fcm_token = ANY($1)',
          [invalidTokens]
        );
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error('Send push notifications error:', error);
    return { success: false, error: error.message };
  }
};

// Отправить push по типу события
const sendEventPush = async (userId, eventType, data) => {
  const notifications = {
    new_order: {
      title: 'Новый заказ!',
      body: `Заказ #${data.order_number} ждёт вас`
    },
    order_accepted: {
      title: 'Заказ принят',
      body: `Курьер принял ваш заказ #${data.order_number}`
    },
    order_in_progress: {
      title: 'Курьер в пути',
      body: `Курьер забрал груз и направляется к вам`
    },
    order_completed: {
      title: 'Заказ выполнен!',
      body: `Заказ #${data.order_number} доставлен. Оцените работу курьера`
    },
    order_cancelled: {
      title: 'Заказ отменён',
      body: data.reason || 'Заказ был отменён'
    },
    new_message: {
      title: 'Новое сообщение',
      body: data.message || 'У вас новое сообщение'
    },
    price_increase_offer: {
      title: 'Повысьте цену',
      body: 'Курьеры не найдены. Повысьте цену для быстрого поиска'
    },
    payment_success: {
      title: 'Оплата прошла',
      body: `Оплачено ${data.amount}₽`
    },
    referral_bonus: {
      title: 'Реферальный бонус!',
      body: `Вы получили ${data.amount}₽`
    }
  };

  const notification = notifications[eventType];

  if (!notification) {
    console.warn(`Unknown event type: ${eventType}`);
    return { success: false, reason: 'unknown_event' };
  }

  return await sendPushNotification(userId, {
    title: notification.title,
    body: notification.body,
    data: { event_type: eventType, ...data }
  });
};

// Инициализируем при загрузке модуля
initializeFirebase();

module.exports = {
  sendPushNotification,
  sendPushNotificationToMultiple,
  sendEventPush
};
