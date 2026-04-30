const db = require('../config/database');
const { getDistance } = require('./pricing');

/**
 * Найти доступных курьеров для заказа
 * @param {Object} order - Заказ с точками
 * @param {number} radiusKm - Радиус поиска в км
 * @returns {Array} Массив курьеров с расстоянием
 */
const findAvailableCouriers = async (order, radiusKm = 5) => {
  try {
    // Получаем первую точку заказа (откуда забрать)
    const firstPointResult = await db.query(
      'SELECT *, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM order_points WHERE order_id = $1 AND type = $2 ORDER BY sequence LIMIT 1',
      [order.id, 'pickup']
    );

    if (firstPointResult.rows.length === 0) {
      throw new Error('Точка отправления не найдена');
    }

    const firstPoint = firstPointResult.rows[0];

    // Определяем минимальный тип транспорта
    const transportTypes = {
      foot: ['foot', 'bicycle', 'motorcycle', 'car'],
      bicycle: ['bicycle', 'motorcycle', 'car'],
      motorcycle: ['motorcycle', 'car'],
      car: ['car']
    };

    // Определяем нужный транспорт по весу и расстоянию
    let requiredTransport = 'foot';
    if (order.weight_kg > 10) {
      requiredTransport = 'car';
    } else if (order.weight_kg > 5) {
      requiredTransport = 'motorcycle';
    }

    const allowedTransports = transportTypes[requiredTransport] || ['foot', 'bicycle', 'motorcycle', 'car'];

    // Ищем курьеров в радиусе
    const couriersResult = await db.query(
      `SELECT
        c.user_id,
        c.transport_type,
        c.current_location,
        u.name,
        u.phone,
        u.rating,
        u.total_orders,
        c.completed_orders,
        c.cancelled_orders,
        ST_X(c.current_location::geometry) as lng,
        ST_Y(c.current_location::geometry) as lat
      FROM couriers c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.is_online = true
        AND c.is_busy = false
        AND c.verification_status = 'verified'
        AND u.status = 'active'
        AND u.rating >= 4.0
        AND c.transport_type = ANY($1)
        AND c.current_location IS NOT NULL
        AND ST_DWithin(
          c.current_location,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          $4
        )
      ORDER BY u.rating DESC, c.completed_orders DESC
      LIMIT 10`,
      [
        allowedTransports,
        firstPoint.lng,
        firstPoint.lat,
        radiusKm * 1000 // метры
      ]
    );

    // Рассчитываем расстояние для каждого курьера
    const couriers = couriersResult.rows.map(courier => {
      const distance = getDistance(
        courier.lat,
        courier.lng,
        firstPoint.lat,
        firstPoint.lng
      );

      return {
        user_id: courier.user_id,
        name: courier.name,
        phone: courier.phone,
        rating: parseFloat(courier.rating),
        total_orders: courier.total_orders,
        completed_orders: courier.completed_orders,
        cancelled_orders: courier.cancelled_orders,
        transport_type: courier.transport_type,
        distance_km: Math.round(distance * 10) / 10,
        location: {
          lat: courier.lat,
          lng: courier.lng
        }
      };
    });

    // Сортируем по расстоянию
    couriers.sort((a, b) => a.distance_km - b.distance_km);

    return couriers;
  } catch (error) {
    console.error('Find couriers error:', error);
    throw error;
  }
};

/**
 * Уведомить курьеров о новом заказе
 * @param {Array} couriers - Массив курьеров
 * @param {Object} order - Заказ
 */
const notifyCouriers = async (couriers, order) => {
  try {
    // TODO: Интеграция с Firebase Cloud Messaging (FCM)
    // Пока просто логируем
    console.log(`📢 Уведомление ${couriers.length} курьерам о заказе #${order.order_number}`);

    for (const courier of couriers) {
      console.log(`  → ${courier.name} (${courier.distance_km} км, рейтинг ${courier.rating})`);

      // Сохраняем уведомление в БД для истории
      await db.query(
        `INSERT INTO notifications (user_id, type, title, body, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          courier.user_id,
          'new_order',
          'Новый заказ рядом с вами!',
          `Заказ #${order.order_number} на ${order.final_price}₽ (${courier.distance_km} км от вас)`,
          JSON.stringify({
            order_id: order.id,
            order_number: order.order_number,
            distance_km: courier.distance_km,
            price: order.final_price,
            courier_earnings: order.courier_earnings
          })
        ]
      );
    }

    return couriers.length;
  } catch (error) {
    console.error('Notify couriers error:', error);
    throw error;
  }
};

/**
 * Запустить автоматический поиск курьера для заказа
 * @param {string} orderId - ID заказа
 */
const startCourierSearch = async (orderId) => {
  try {
    // Получаем заказ
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Заказ не найден');
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
      throw new Error('Заказ уже в обработке');
    }

    // Обновляем статус заказа
    await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['searching_courier', orderId]
    );

    console.log(`🔍 Начат поиск курьера для заказа #${order.order_number}`);

    // Ищем курьеров в радиусе 5 км
    let couriers = await findAvailableCouriers(order, 5);

    // Если не нашли - расширяем до 10 км
    if (couriers.length === 0) {
      console.log('⚠️ Курьеры не найдены в радиусе 5 км, расширяем до 10 км');
      couriers = await findAvailableCouriers(order, 10);
    }

    if (couriers.length === 0) {
      console.log('❌ Курьеры не найдены в радиусе 10 км');
      return { found: false, count: 0 };
    }

    // Уведомляем курьеров
    const notifiedCount = await notifyCouriers(couriers, order);

    // Запускаем таймеры
    scheduleOrderTimers(orderId);

    return {
      found: true,
      count: notifiedCount,
      couriers: couriers.map(c => ({
        user_id: c.user_id,
        name: c.name,
        distance_km: c.distance_km,
        rating: c.rating
      }))
    };
  } catch (error) {
    console.error('Start courier search error:', error);
    throw error;
  }
};

/**
 * Запланировать таймеры для заказа
 * @param {string} orderId - ID заказа
 */
const scheduleOrderTimers = (orderId) => {
  // Таймер 5 минут: предложить повысить цену
  setTimeout(async () => {
    try {
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) return;

      const order = orderResult.rows[0];

      // Если заказ всё ещё ищет курьера
      if (order.status === 'searching_courier') {
        console.log(`⏰ 5 минут прошло для заказа #${order.order_number} - предлагаем повысить цену`);

        // TODO: Отправить push клиенту с предложением повысить цену
        await db.query(
          `INSERT INTO notifications (user_id, type, title, body, data, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            order.client_id,
            'price_increase_offer',
            'Курьер ещё не найден',
            'Хотите повысить цену заказа, чтобы привлечь больше курьеров?',
            JSON.stringify({
              order_id: order.id,
              order_number: order.order_number,
              current_price: order.final_price,
              suggested_price: Math.round(order.final_price * 1.2)
            })
          ]
        );
      }
    } catch (error) {
      console.error('5-minute timer error:', error);
    }
  }, 5 * 60 * 1000); // 5 минут

  // Таймер 10 минут: автоотмена
  setTimeout(async () => {
    try {
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) return;

      const order = orderResult.rows[0];

      // Если заказ всё ещё ищет курьера
      if (order.status === 'searching_courier') {
        console.log(`⏰ 10 минут прошло для заказа #${order.order_number} - автоотмена`);

        const client = await db.pool.connect();

        try {
          await client.query('BEGIN');

          // Отменяем заказ
          await client.query(
            `UPDATE orders SET
              status = $1,
              cancelled_at = NOW(),
              cancellation_reason = $2,
              updated_at = NOW()
             WHERE id = $3`,
            ['cancelled', 'Курьер не найден в течение 10 минут', orderId]
          );

          // Возвращаем деньги клиенту (если оплачено картой)
          if (order.payment_method === 'card' && order.payment_status === 'completed') {
            await client.query(
              `INSERT INTO payments (user_id, order_id, type, amount, method, status, description, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
              [
                order.client_id,
                order.id,
                'refund',
                order.final_price,
                'card',
                'pending',
                'Возврат средств - курьер не найден'
              ]
            );

            // TODO: Интеграция с ЮKassa для возврата
          }

          // Уведомляем клиента
          await client.query(
            `INSERT INTO notifications (user_id, type, title, body, data, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              order.client_id,
              'order_cancelled',
              'Заказ отменён',
              'К сожалению, мы не смогли найти курьера для вашего заказа. Средства будут возвращены.',
              JSON.stringify({
                order_id: order.id,
                order_number: order.order_number,
                refund_amount: order.final_price
              })
            ]
          );

          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    } catch (error) {
      console.error('10-minute timer error:', error);
    }
  }, 10 * 60 * 1000); // 10 минут
};

module.exports = {
  findAvailableCouriers,
  notifyCouriers,
  startCourierSearch,
  scheduleOrderTimers
};
