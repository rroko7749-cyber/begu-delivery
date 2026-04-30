import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://172.28.144.1:3000/api/v1';

  String? _token;

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    _token = token;
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    _token = null;
  }

  Map<String, String> _getHeaders({bool includeAuth = true}) {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (includeAuth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // Auth
  Future<Map<String, dynamic>> register({
    required String phone,
    required String password,
    String? name,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _getHeaders(includeAuth: false),
      body: jsonEncode({
        'phone': phone,
        'password': password,
        if (name != null) 'name': name,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await saveToken(data['access_token']);
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Ошибка регистрации');
    }
  }

  Future<Map<String, dynamic>> login({
    required String phone,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _getHeaders(includeAuth: false),
      body: jsonEncode({
        'phone': phone,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await saveToken(data['access_token']);
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Ошибка входа');
    }
  }

  Future<void> logout() async {
    try {
      await http.post(
        Uri.parse('$baseUrl/auth/logout'),
        headers: _getHeaders(),
      );
    } finally {
      await clearToken();
    }
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/profile'),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Ошибка загрузки профиля');
    }
  }

  // Orders
  Future<Map<String, dynamic>> createOrder({
    required Map<String, dynamic> pickupPoint,
    required Map<String, dynamic> deliveryPoint,
    String? comment,
    String? promoCode,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: _getHeaders(),
      body: jsonEncode({
        'pickup_address': pickupPoint['address'],
        'pickup_lat': pickupPoint['lat'],
        'pickup_lng': pickupPoint['lng'],
        'delivery_address': deliveryPoint['address'],
        'delivery_lat': deliveryPoint['lat'],
        'delivery_lng': deliveryPoint['lng'],
        if (comment != null) 'comment': comment,
        if (promoCode != null) 'promo_code': promoCode,
      }),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Ошибка создания заказа');
    }
  }

  Future<List<dynamic>> getOrders({String? status}) async {
    var url = '$baseUrl/orders';
    if (status != null) {
      url += '?status=$status';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Ошибка загрузки заказов');
    }
  }

  Future<Map<String, dynamic>> getOrder(String orderId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders/$orderId'),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Ошибка загрузки заказа');
    }
  }

  Future<void> cancelOrder(String orderId, String reason) async {
    final response = await http.post(
      Uri.parse('$baseUrl/order-actions/$orderId/cancel'),
      headers: _getHeaders(),
      body: jsonEncode({'reason': reason}),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Ошибка отмены заказа');
    }
  }

  Future<void> rateOrder(String orderId, int rating, String? comment) async {
    final response = await http.post(
      Uri.parse('$baseUrl/order-actions/$orderId/rate'),
      headers: _getHeaders(),
      body: jsonEncode({
        'rating': rating,
        if (comment != null) 'comment': comment,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Ошибка оценки заказа');
    }
  }

  // Promo codes
  Future<Map<String, dynamic>> applyPromoCode(String code, String orderId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/promo-codes/apply'),
      headers: _getHeaders(),
      body: jsonEncode({
        'code': code,
        'order_id': orderId,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Ошибка применения промокода');
    }
  }

  // Payments
  Future<Map<String, dynamic>> createPayment(String orderId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/payments'),
      headers: _getHeaders(),
      body: jsonEncode({'order_id': orderId}),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Ошибка создания платежа');
    }
  }
}
