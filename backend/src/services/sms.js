const axios = require('axios');
require('dotenv').config();

const sendSMS = async (phone, message) => {
  try {
    const response = await axios.get('https://sms.ru/sms/send', {
      params: {
        api_id: process.env.SMS_API_KEY,
        to: phone,
        msg: message,
        json: 1,
      },
    });

    if (response.data.status === 'OK') {
      console.log(`✅ SMS sent to ${phone}`);
      return true;
    } else {
      console.error('SMS send failed:', response.data);
      throw new Error('SMS send failed');
    }
  } catch (error) {
    console.error('SMS service error:', error);
    throw error;
  }
};

module.exports = {
  sendSMS,
};
