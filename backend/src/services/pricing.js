const axios = require('axios');

const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getWeatherMultiplier = async () => {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: 'Moscow',
        appid: process.env.WEATHER_API_KEY,
      },
    });

    const weather = response.data.weather[0].main.toLowerCase();
    const temp = response.data.main.temp - 273.15;

    if (weather.includes('thunderstorm') || weather.includes('heavy rain')) return 1.5;
    if (weather.includes('snow')) return 1.4;
    if (weather.includes('rain')) return 1.3;
    if (temp < -20) return 1.3;

    return 1.0;
  } catch (error) {
    console.error('Weather API error:', error);
    return 1.0;
  }
};

const getTimeMultiplier = () => {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 6) return 1.0;
  if (hour >= 6 && hour < 9) return 1.8;
  if (hour >= 9 && hour < 12) return 1.3;
  if (hour >= 12 && hour < 14) return 1.5;
  if (hour >= 14 && hour < 17) return 1.2;
  if (hour >= 17 && hour < 20) return 2.0;
  if (hour >= 20 && hour < 23) return 1.3;
  return 1.1;
};

const getDayMultiplier = () => {
  const day = new Date().getDay();
  const hour = new Date().getHours();

  if (day === 5 && hour >= 18) return 1.2;
  if (day === 0 || day === 6) return 1.1;

  return 1.0;
};

const calculatePrice = async ({ points, weight_kg, urgency }) => {
  let totalDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dist = getDistance(
      points[i].location.lat,
      points[i].location.lng,
      points[i + 1].location.lat,
      points[i + 1].location.lng
    );
    totalDistance += dist;
  }

  let basePrice = 240;
  if (totalDistance > 2) {
    basePrice += (totalDistance - 2) * 40;
  }

  const extraPoints = points.length - 2;
  if (extraPoints > 0) {
    basePrice += extraPoints * 80;
  }

  if (weight_kg > 5 && weight_kg <= 10) basePrice += 50;
  else if (weight_kg > 10 && weight_kg <= 20) basePrice += 100;
  else if (weight_kg > 20 && weight_kg <= 30) basePrice += 200;
  else if (weight_kg > 30) basePrice += 300;

  const timeMultiplier = getTimeMultiplier();
  const dayMultiplier = getDayMultiplier();
  const weatherMultiplier = await getWeatherMultiplier();

  const demandMultiplier = 1.0;

  let urgencyMultiplier = 1.0;
  if (urgency === 'fast') urgencyMultiplier = 1.4;
  else if (urgency === 'express') urgencyMultiplier = 2.0;

  let finalPrice = basePrice * timeMultiplier * dayMultiplier * weatherMultiplier * demandMultiplier * urgencyMultiplier;

  const maxMultiplier = 3.0;
  if (finalPrice > basePrice * maxMultiplier) {
    finalPrice = basePrice * maxMultiplier;
  }

  finalPrice = Math.round(finalPrice);

  const commission = finalPrice * parseFloat(process.env.COMMISSION_RATE || 0.15);
  const courierEarnings = finalPrice - commission;

  return {
    base_price: Math.round(basePrice),
    final_price: finalPrice,
    commission: Math.round(commission),
    courier_earnings: Math.round(courierEarnings),
    factors: {
      distance_km: Math.round(totalDistance * 10) / 10,
      extra_points: extraPoints,
      weight_kg: weight_kg,
      time_multiplier: timeMultiplier,
      day_multiplier: dayMultiplier,
      weather_multiplier: weatherMultiplier,
      demand_multiplier: demandMultiplier,
      urgency_multiplier: urgencyMultiplier,
      urgency: urgency,
    },
  };
};

module.exports = {
  calculatePrice,
  getDistance,
};
