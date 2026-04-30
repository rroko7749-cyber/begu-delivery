import 'package:flutter/material.dart';
import '../services/api_service.dart';

class OrderProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<dynamic> _availableOrders = [];
  List<dynamic> _myOrders = [];
  Map<String, dynamic>? _currentOrder;
  bool _isLoading = false;
  String? _error;

  List<dynamic> get availableOrders => _availableOrders;
  List<dynamic> get myOrders => _myOrders;
  Map<String, dynamic>? get currentOrder => _currentOrder;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAvailableOrders() async {
    _isLoading = true;
    notifyListeners();

    try {
      _availableOrders = await _apiService.getAvailableOrders();
      _error = null;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMyOrders() async {
    _isLoading = true;
    notifyListeners();

    try {
      _myOrders = await _apiService.getMyOrders();
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

  Future<bool> acceptOrder(String orderId) async {
    try {
      await _apiService.acceptOrder(orderId);
      await loadMyOrders();
      await loadAvailableOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> startDelivery(String orderId) async {
    try {
      await _apiService.startDelivery(orderId);
      await loadOrder(orderId);
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> completeOrder(String orderId) async {
    try {
      await _apiService.completeOrder(orderId);
      await loadMyOrders();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> cancelOrder(String orderId, String reason) async {
    try {
      await _apiService.cancelOrder(orderId, reason);
      await loadMyOrders();
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
