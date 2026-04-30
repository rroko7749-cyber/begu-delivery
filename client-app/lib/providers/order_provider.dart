import 'package:flutter/material.dart';
import '../services/api_service.dart';

class OrderProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<dynamic> _orders = [];
  Map<String, dynamic>? _currentOrder;
  bool _isLoading = false;
  String? _error;

  List<dynamic> get orders => _orders;
  Map<String, dynamic>? get currentOrder => _currentOrder;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadOrders({String? status}) async {
    _isLoading = true;
    notifyListeners();

    try {
      _orders = await _apiService.getOrders(status: status);
      _error = null;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadOrder(String orderId) async {
    _isLoading = true;
    notifyListeners();

    try {
      _currentOrder = await _apiService.getOrder(orderId);
      _error = null;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createOrder({
    required Map<String, dynamic> pickupPoint,
    required Map<String, dynamic> deliveryPoint,
    String? comment,
    String? promoCode,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentOrder = await _apiService.createOrder(
        pickupPoint: pickupPoint,
        deliveryPoint: deliveryPoint,
        comment: comment,
        promoCode: promoCode,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> cancelOrder(String orderId, String reason) async {
    try {
      await _apiService.cancelOrder(orderId, reason);
      await loadOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> rateOrder(String orderId, int rating, String? comment) async {
    try {
      await _apiService.rateOrder(orderId, rating, comment);
      await loadOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
