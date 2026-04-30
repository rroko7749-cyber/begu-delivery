const db = require('../config/database');

const createNotificationsTable = async () => {
  const client = await db.pool.connect();

  try {
    console.log('Creating notifications table...');

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

    console.log('✅ Notifications table created successfully');
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  createNotificationsTable()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createNotificationsTable };
