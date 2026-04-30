const { YooCheckout } = require('@a2seven/yoo-checkout');
require('dotenv').config();

// Инициализация клиента ЮKassa
const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

/**
 * Создать платёж для заказа
 * @param {Object} params - Параметры платежа
 * @returns {Object} Данные платежа с URL для оплаты
 */
const createOrderPayment = async ({ orderId, amount, description, returnUrl, metadata = {} }) => {
  try {
    const idempotenceKey = `order_${orderId}_${Date.now()}`;

    const payment = await checkout.createPayment({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || `${process.env.FRONTEND_URL}/orders/${orderId}`,
      },
      capture: true,
      description: description || `Оплата заказа`,
      metadata: {
        order_id: orderId,
        ...metadata,
      },
    }, idempotenceKey);

    return {
      payment_id: payment.id,
      status: payment.status,
      confirmation_url: payment.confirmation.confirmation_url,
      amount: parseFloat(payment.amount.value),
    };
  } catch (error) {
    console.error('Create payment error:', error);
    throw new Error('Ошибка создания платежа');
  }
};

/**
 * Создать платёж для депозита курьера
 * @param {Object} params - Параметры платежа
 * @returns {Object} Данные платежа с URL для оплаты
 */
const createDepositPayment = async ({ userId, amount = 5000, returnUrl }) => {
  try {
    const idempotenceKey = `deposit_${userId}_${Date.now()}`;

    const payment = await checkout.createPayment({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || `${process.env.FRONTEND_URL}/courier/verification`,
      },
      capture: true,
      description: 'Депозит курьера для работы с наличными заказами',
      metadata: {
        user_id: userId,
        type: 'deposit',
      },
    }, idempotenceKey);

    return {
      payment_id: payment.id,
      status: payment.status,
      confirmation_url: payment.confirmation.confirmation_url,
      amount: parseFloat(payment.amount.value),
    };
  } catch (error) {
    console.error('Create deposit payment error:', error);
    throw new Error('Ошибка создания платежа депозита');
  }
};

/**
 * Проверить статус платежа
 * @param {string} paymentId - ID платежа в ЮKassa
 * @returns {Object} Статус платежа
 */
const getPaymentStatus = async (paymentId) => {
  try {
    const payment = await checkout.getPayment(paymentId);

    return {
      payment_id: payment.id,
      status: payment.status,
      paid: payment.paid,
      amount: parseFloat(payment.amount.value),
      metadata: payment.metadata,
      created_at: payment.created_at,
    };
  } catch (error) {
    console.error('Get payment status error:', error);
    throw new Error('Ошибка получения статуса платежа');
  }
};

/**
 * Создать возврат средств
 * @param {Object} params - Параметры возврата
 * @returns {Object} Данные возврата
 */
const createRefund = async ({ paymentId, amount, reason }) => {
  try {
    const idempotenceKey = `refund_${paymentId}_${Date.now()}`;

    const refund = await checkout.createRefund({
      payment_id: paymentId,
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      description: reason || 'Возврат средств',
    }, idempotenceKey);

    return {
      refund_id: refund.id,
      status: refund.status,
      amount: parseFloat(refund.amount.value),
    };
  } catch (error) {
    console.error('Create refund error:', error);
    throw new Error('Ошибка создания возврата');
  }
};

/**
 * Создать выплату курьеру
 * @param {Object} params - Параметры выплаты
 * @returns {Object} Данные выплаты
 */
const createPayout = async ({ userId, amount, description, cardNumber }) => {
  try {
    const idempotenceKey = `payout_${userId}_${Date.now()}`;

    // ЮKassa требует отдельного договора для выплат
    // Пока используем упрощённую схему через баланс
    // В продакшене нужно настроить Payouts API

    // TODO: Интеграция с Payouts API
    // const payout = await checkout.createPayout({
    //   amount: {
    //     value: amount.toFixed(2),
    //     currency: 'RUB',
    //   },
    //   payout_destination_data: {
    //     type: 'bank_card',
    //     card: {
    //       number: cardNumber,
    //     },
    //   },
    //   description: description || 'Вывод заработка',
    //   metadata: {
    //     user_id: userId,
    //   },
    // }, idempotenceKey);

    return {
      payout_id: `payout_${Date.now()}`,
      status: 'pending',
      amount: amount,
      message: 'Выплата будет обработана в течение 1-3 рабочих дней',
    };
  } catch (error) {
    console.error('Create payout error:', error);
    throw new Error('Ошибка создания выплаты');
  }
};

/**
 * Обработать webhook от ЮKassa
 * @param {Object} notification - Уведомление от ЮKassa
 * @returns {Object} Результат обработки
 */
const handleWebhook = async (notification) => {
  try {
    const { type, object } = notification;

    if (type === 'payment.succeeded') {
      return {
        event: 'payment_succeeded',
        payment_id: object.id,
        amount: parseFloat(object.amount.value),
        metadata: object.metadata,
      };
    }

    if (type === 'payment.canceled') {
      return {
        event: 'payment_canceled',
        payment_id: object.id,
        metadata: object.metadata,
      };
    }

    if (type === 'refund.succeeded') {
      return {
        event: 'refund_succeeded',
        refund_id: object.id,
        payment_id: object.payment_id,
        amount: parseFloat(object.amount.value),
      };
    }

    return {
      event: 'unknown',
      type,
    };
  } catch (error) {
    console.error('Handle webhook error:', error);
    throw new Error('Ошибка обработки webhook');
  }
};

module.exports = {
  createOrderPayment,
  createDepositPayment,
  getPaymentStatus,
  createRefund,
  createPayout,
  handleWebhook,
};
