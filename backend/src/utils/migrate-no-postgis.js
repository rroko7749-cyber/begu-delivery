const db = require('../config/database');

const createTables = async () => {
  const client = await db.pool.connect();

  try {
    console.log('Creating database schema (without PostGIS)...');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    // PostGIS будет добавлен позже

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) UNIQUE NOT NULL,
        phone_verified BOOLEAN DEFAULT FALSE,
        email VARCHAR(255),
        email_verified BOOLEAN DEFAULT FALSE,
        name VARCHAR(255),
        role VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        avatar_url TEXT,
        rating DECIMAL(3,2) DEFAULT 5.0,
        total_orders INTEGER DEFAULT 0,
        balance DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS couriers (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        transport_type VARCHAR(20),
        verification_status VARCHAR(20) DEFAULT 'pending',
        passport_photo_url TEXT,
        driver_license_url TEXT,
        vehicle_photo_url TEXT,
        work_zone JSONB,
        current_location_lat DECIMAL(10,8),
        current_location_lng DECIMAL(11,8),
        is_online BOOLEAN DEFAULT FALSE,
        is_busy BOOLEAN DEFAULT FALSE,
        completed_orders INTEGER DEFAULT 0,
        cancelled_orders INTEGER DEFAULT 0,
        total_earnings DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_couriers_online ON couriers(is_online);
      CREATE INDEX IF NOT EXISTS idx_couriers_location ON couriers(current_location_lat, current_location_lng);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(20) UNIQUE NOT NULL,
        client_id UUID NOT NULL REFERENCES users(id),
        courier_id UUID REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        base_price DECIMAL(10,2) NOT NULL,
        final_price DECIMAL(10,2) NOT NULL,
        client_bonus DECIMAL(10,2) DEFAULT 0,
        pricing_factors JSONB,
        payment_method VARCHAR(20),
        payment_status VARCHAR(20) DEFAULT 'pending',
        commission DECIMAL(10,2),
        courier_earnings DECIMAL(10,2),
        description TEXT,
        weight_kg DECIMAL(5,2),
        urgency VARCHAR(20) DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        picked_up_at TIMESTAMP,
        delivered_at TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        cancelled_by UUID REFERENCES users(id),
        cancellation_reason TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
      CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        sequence INTEGER NOT NULL,
        address TEXT NOT NULL,
        location_lat DECIMAL(10,8) NOT NULL,
        location_lng DECIMAL(11,8) NOT NULL,
        type VARCHAR(20) NOT NULL,
        contact_name VARCHAR(255),
        contact_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        arrived_at TIMESTAMP,
        completed_at TIMESTAMP,
        confirmation_code VARCHAR(6),
        confirmation_photo_url TEXT,
        notes TEXT
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_points_order ON order_points(order_id, sequence);
      CREATE INDEX IF NOT EXISTS idx_order_points_location ON order_points(location_lat, location_lng);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id),
        user_id UUID NOT NULL REFERENCES users(id),
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        payment_provider VARCHAR(50),
        provider_payment_id VARCHAR(255),
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        from_user_id UUID NOT NULL REFERENCES users(id),
        to_user_id UUID NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(order_id, from_user_id, to_user_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON ratings(to_user_id);
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_rating()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE users
        SET rating = (
          SELECT AVG(rating)
          FROM ratings
          WHERE to_user_id = NEW.to_user_id
        )
        WHERE id = NEW.to_user_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_rating ON ratings;
      CREATE TRIGGER trigger_update_rating
      AFTER INSERT ON ratings
      FOR EACH ROW
      EXECUTE FUNCTION update_user_rating();
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data JSONB,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
    `);

    console.log('✅ Database schema created successfully (without PostGIS)');
    console.log('⚠️  Геолокация работает через lat/lng колонки вместо PostGIS');
  } catch (error) {
    console.error('❌ Error creating schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
