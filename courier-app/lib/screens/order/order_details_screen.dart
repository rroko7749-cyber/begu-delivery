import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/order_provider.dart';

class OrderDetailsScreen extends StatefulWidget {
  const OrderDetailsScreen({super.key});

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Детали заказа'),
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
                if (status == 'accepted')
                  ElevatedButton(
                    onPressed: () async {
                      final success = await orderProvider.startDelivery(_orderId!);
                      if (mounted && success) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Доставка начата'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Text('Начать доставку'),
                  ),
                if (status == 'in_transit')
                  ElevatedButton(
                    onPressed: () async {
                      final success = await orderProvider.completeOrder(_orderId!);
                      if (mounted && success) {
                        Navigator.of(context).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Заказ завершён'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Text('Завершить доставку'),
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
              'Карта маршрута',
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
              'Откуда забрать',
              order['pickup_address'] ?? '',
            ),
            const SizedBox(height: 12),
            _buildDetailRow(
              Icons.flag,
              'Куда доставить',
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
                  'Ваш заработок',
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
                    color: Color(0xFF10B981),
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
      case 'accepted':
        return 'Принят';
      case 'in_transit':
        return 'В пути';
      case 'delivered':
        return 'Доставлен';
      default:
        return status;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'accepted':
        return Icons.check_circle;
      case 'in_transit':
        return Icons.local_shipping;
      case 'delivered':
        return Icons.done_all;
      default:
        return Icons.info;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'accepted':
        return Colors.blue;
      case 'in_transit':
        return Colors.purple;
      case 'delivered':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}
