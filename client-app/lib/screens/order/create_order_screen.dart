import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/location_provider.dart';

class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({super.key});

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _pickupAddressController = TextEditingController();
  final _deliveryAddressController = TextEditingController();
  final _commentController = TextEditingController();
  final _promoCodeController = TextEditingController();

  Map<String, dynamic>? _pickupPoint;
  Map<String, dynamic>? _deliveryPoint;
  double? _estimatedPrice;

  @override
  void dispose() {
    _pickupAddressController.dispose();
    _deliveryAddressController.dispose();
    _commentController.dispose();
    _promoCodeController.dispose();
    super.dispose();
  }

  Future<void> _selectPickupLocation() async {
    // В реальном приложении здесь будет карта с выбором точки
    // Для примера используем текущую локацию
    final locationProvider = Provider.of<LocationProvider>(context, listen: false);
    await locationProvider.getCurrentLocation();

    if (locationProvider.currentPosition != null) {
      setState(() {
        _pickupPoint = {
          'lat': locationProvider.currentPosition!.latitude,
          'lng': locationProvider.currentPosition!.longitude,
          'address': _pickupAddressController.text,
        };
      });
      _calculatePrice();
    }
  }

  Future<void> _selectDeliveryLocation() async {
    // В реальном приложении здесь будет карта с выбором точки
    final locationProvider = Provider.of<LocationProvider>(context, listen: false);
    await locationProvider.getCurrentLocation();

    if (locationProvider.currentPosition != null) {
      setState(() {
        _deliveryPoint = {
          'lat': locationProvider.currentPosition!.latitude + 0.01,
          'lng': locationProvider.currentPosition!.longitude + 0.01,
          'address': _deliveryAddressController.text,
        };
      });
      _calculatePrice();
    }
  }

  void _calculatePrice() {
    if (_pickupPoint != null && _deliveryPoint != null) {
      // Простой расчет цены на основе расстояния
      final distance = _calculateDistance(
        _pickupPoint!['lat'],
        _pickupPoint!['lng'],
        _deliveryPoint!['lat'],
        _deliveryPoint!['lng'],
      );
      setState(() {
        _estimatedPrice = 150 + (distance * 50);
      });
    }
  }

  double _calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    // Упрощенный расчет расстояния
    final dx = lat2 - lat1;
    final dy = lng2 - lng1;
    return (dx * dx + dy * dy) * 100;
  }

  Future<void> _createOrder() async {
    if (!_formKey.currentState!.validate()) return;

    if (_pickupPoint == null || _deliveryPoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Выберите точки на карте'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final orderProvider = Provider.of<OrderProvider>(context, listen: false);
    final success = await orderProvider.createOrder(
      pickupPoint: _pickupPoint!,
      deliveryPoint: _deliveryPoint!,
      comment: _commentController.text.isEmpty ? null : _commentController.text,
      promoCode: _promoCodeController.text.isEmpty ? null : _promoCodeController.text,
    );

    if (mounted) {
      if (success) {
        Navigator.of(context).pop();
        Navigator.of(context).pushNamed(
          '/order-tracking',
          arguments: orderProvider.currentOrder!['id'],
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(orderProvider.error ?? 'Ошибка создания заказа'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Новый заказ'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Откуда забрать',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _pickupAddressController,
              decoration: const InputDecoration(
                labelText: 'Адрес отправления',
                prefixIcon: Icon(Icons.location_on),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Введите адрес';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _selectPickupLocation,
              icon: const Icon(Icons.map),
              label: const Text('Выбрать на карте'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[100],
                foregroundColor: Colors.black87,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Куда доставить',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _deliveryAddressController,
              decoration: const InputDecoration(
                labelText: 'Адрес доставки',
                prefixIcon: Icon(Icons.flag),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Введите адрес';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _selectDeliveryLocation,
              icon: const Icon(Icons.map),
              label: const Text('Выбрать на карте'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[100],
                foregroundColor: Colors.black87,
              ),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _commentController,
              decoration: const InputDecoration(
                labelText: 'Комментарий (необязательно)',
                prefixIcon: Icon(Icons.comment),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _promoCodeController,
              decoration: const InputDecoration(
                labelText: 'Промокод (необязательно)',
                prefixIcon: Icon(Icons.discount),
              ),
            ),
            if (_estimatedPrice != null) ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Примерная стоимость:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${_estimatedPrice!.toStringAsFixed(0)} ₽',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF6366F1),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            Consumer<OrderProvider>(
              builder: (context, orderProvider, child) {
                return ElevatedButton(
                  onPressed: orderProvider.isLoading ? null : _createOrder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 56),
                  ),
                  child: orderProvider.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Создать заказ',
                          style: TextStyle(fontSize: 16),
                        ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
