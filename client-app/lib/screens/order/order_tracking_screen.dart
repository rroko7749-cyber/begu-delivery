import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/order_provider.dart';

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  String? _orderId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_orderId == null) {
      _orderId = ModalRoute.of(context)?.settings.arguments as String?;
      if (_orderId != null) {
        _loadOrder();
      }
    }
  }

  Future<void> _loadOrder() async {
    final orderProvider = Provider.of<OrderProvider>(context, listen: false);
    await orderProvider.loadOrder(_orderId!);
  }

  Future<void> _cancelOrder() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Отменить заказ?'),
        content: const Text('Вы уверены, что хотите отменить этот заказ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Нет'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Да', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final orderProvider = Provider.of<OrderProvider>(context, listen: false);
      final success = await orderProvider.cancelOrder(_orderId!, 'Отменён клиентом');

      if (mounted) {
        if (success) {
          Navigator.of(context).pop();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(orderProvider.error ?? 'Ошибка отмены заказа'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Отслеживание заказа'),
      ),
      body: Consumer<OrderProvider>(
        builder: (context, orderProvider, child) {
          if (orderProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final order = orderProvider.currentOrder;
          if (order == null) {
            return const Center(child: Text('Заказ не найден'));
          }

          final status = order['status'] ?? '';
          final canCancel = status == 'pending' || status == 'accepted';

          return RefreshIndicator(
            onRefresh: _loadOrder,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildStatusCard(order),
                const SizedBox(height: 16),
                _buildMapPlaceholder(),
                const SizedBox(height: 16),
                _buildDetailsCard(order),
                const SizedBox(height: 16),
                if (canCancel)
                  OutlinedButton(
                    onPressed: _cancelOrder,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Text('Отменить заказ'),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusCard(Map<String, dynamic> order) {
    final status = order['status'] ?? '';
    final statusText = _getStatusText(status);
    final statusColor = _getStatusColor(status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getStatusIcon(status),
                size: 40,
                color: statusColor,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              statusText,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: statusColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _getStatusDescription(status),
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMapPlaceholder() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map, size: 60, color: Colors.grey[400]),
            const SizedBox(height: 8),
            Text(
              'Карта отслеживания',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsCard(Map<String, dynamic> order) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Детали заказа',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildDetailRow(
              Icons.location_on,
              'Откуда',
              order['pickup_address'] ?? '',
            ),
            const SizedBox(height: 12),
            _buildDetailRow(
              Icons.flag,
              'Куда',
              order['delivery_address'] ?? '',
            ),
            if (order['comment'] != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                Icons.comment,
                'Комментарий',
                order['comment'],
              ),
            ],
            const Divider(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Стоимость',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '${order['price'] ?? 0} ₽',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF6366F1),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return 'Ожидает курьера';
      case 'accepted':
        return 'Курьер найден';
      case 'in_transit':
        return 'В пути';
      case 'delivered':
        return 'Доставлено';
      case 'cancelled':
        return 'Отменён';
      default:
        return status;
    }
  }

  String _getStatusDescription(String status) {
    switch (status) {
      case 'pending':
        return 'Ищем ближайшего курьера';
      case 'accepted':
        return 'Курьер едет к точке отправления';
      case 'in_transit':
        return 'Курьер везёт ваш заказ';
      case 'delivered':
        return 'Заказ успешно доставлен';
      case 'cancelled':
        return 'Заказ был отменён';
      default:
        return '';
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.search;
      case 'accepted':
        return Icons.person;
      case 'in_transit':
        return Icons.local_shipping;
      case 'delivered':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'accepted':
        return Colors.blue;
      case 'in_transit':
        return Colors.purple;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
