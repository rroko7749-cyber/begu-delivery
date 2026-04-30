import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/api_service.dart';

class LocationProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  Position? _currentPosition;
  bool _isTracking = false;
  bool _isLoading = false;
  String? _error;

  Position? get currentPosition => _currentPosition;
  bool get isTracking => _isTracking;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<bool> requestPermission() async {
    final status = await Permission.location.request();
    return status.isGranted;
  }

  Future<void> getCurrentLocation() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final hasPermission = await requestPermission();
      if (!hasPermission) {
        throw Exception('Необходимо разрешение на доступ к геолокации');
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      _error = null;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> startTracking() async {
    if (_isTracking) return;

    final hasPermission = await requestPermission();
    if (!hasPermission) {
      _error = 'Необходимо разрешение на доступ к геолокации';
      notifyListeners();
      return;
    }

    _isTracking = true;
    notifyListeners();

    // Обновление локации каждые 10 секунд
    Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((Position position) async {
      _currentPosition = position;
      notifyListeners();

      // Отправка локации на сервер
      try {
        await _apiService.updateLocation(
          position.latitude,
          position.longitude,
        );
      } catch (e) {
        // Игнорируем ошибки отправки локации
      }
    });
  }

  void stopTracking() {
    _isTracking = false;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
