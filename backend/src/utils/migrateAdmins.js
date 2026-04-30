const db = require('../config/database');
const bcrypt = require('bcrypt');

const createAdminTable = async () => {
  const client = await db.pool.connect();

  try {
    console.log('Creating/updating admins table...');

    // Создаём таблицу если её нет
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        email VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      );
    `);

    // Добавляем колонку role если её нет
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='admins' AND column_name='role') THEN
          ALTER TABLE admins ADD COLUMN role VARCHAR(20) DEFAULT 'admin';
        END IF;
      END $$;
    `);

    // Добавляем колонку created_by если её нет
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='admins' AND column_name='created_by') THEN
          ALTER TABLE admins ADD COLUMN created_by UUID REFERENCES admins(id);
        END IF;
      END $$;
    `);

    // Создаём индексы
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
      CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
    `);

    // Обновляем существующего админа до super_admin
    await client.query(`
      UPDATE admins SET role = 'super_admin' WHERE role = 'admin' OR role IS NULL
    `);

    // Проверяем, есть ли уже суперадмин
    const existingAdmin = await client.query('SELECT id FROM admins WHERE role = $1 LIMIT 1', ['super_admin']);

    if (existingAdmin.rows.length === 0) {
      // Создаём дефолтного суперадмина: admin / admin123
      const passwordHash = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO admins (username, password_hash, full_name, email, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', passwordHash, 'Суперадминистратор', 'admin@begudelivery.ru', 'super_admin']);

      console.log('✅ Default super admin created: username=admin, password=admin123, role=super_admin');
    } else {
      console.log('✅ Super admin already exists, upgraded existing admin to super_admin');
    }

    console.log('✅ Admins table ready');
  } catch (error) {
    console.error('Error creating admins table:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { createAdminTable };
