const db = require('../config/database');

async function addCourierLocationFields() {
  try {
    console.log('Adding location fields to couriers table...');

    // Проверяем существует ли таблица couriers
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'couriers'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Couriers table does not exist, skipping location fields migration');
      return;
    }

    // Добавляем поля для координат
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='couriers' AND column_name='latitude') THEN
          ALTER TABLE couriers ADD COLUMN latitude DECIMAL(10, 8);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='couriers' AND column_name='longitude') THEN
          ALTER TABLE couriers ADD COLUMN longitude DECIMAL(11, 8);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='couriers' AND column_name='last_location_update') THEN
          ALTER TABLE couriers ADD COLUMN last_location_update TIMESTAMP;
        END IF;
      END $$;
    `);

    console.log('✅ Location fields added successfully');
  } catch (error) {
    console.error('⚠️  Error adding location fields:', error.message);
    // Не бросаем ошибку, чтобы сервер мог запуститься
  }
}

module.exports = { addCourierLocationFields };
