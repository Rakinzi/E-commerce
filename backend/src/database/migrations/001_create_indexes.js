// Migration to create database indexes for better performance

module.exports = {
  async up(db, client) {
    console.log('Creating database indexes...');

    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });

    // Products collection indexes
    await db.collection('products').createIndex({ name: 'text', description: 'text' });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ price: 1 });
    await db.collection('products').createIndex({ vendor: 1 });
    await db.collection('products').createIndex({ isActive: 1 });
    await db.collection('products').createIndex({ sku: 1 }, { unique: true });
    await db.collection('products').createIndex({ 'rating.average': -1 });
    await db.collection('products').createIndex({ createdAt: -1 });
    await db.collection('products').createIndex({ tags: 1 });

    // Carts collection indexes
    await db.collection('carts').createIndex({ userId: 1 }, { unique: true });
    await db.collection('carts').createIndex({ status: 1 });
    await db.collection('carts').createIndex({ lastModified: 1 });

    // Orders collection indexes
    await db.collection('orders').createIndex({ userId: 1 });
    await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
    await db.collection('orders').createIndex({ orderStatus: 1 });
    await db.collection('orders').createIndex({ paymentStatus: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    await db.collection('orders').createIndex({ userId: 1, createdAt: -1 });

    // Logs collection indexes
    await db.collection('logs').createIndex({ timestamp: -1, level: 1 });
    await db.collection('logs').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('logs').createIndex({ action: 1, timestamp: -1 });
    await db.collection('logs').createIndex({ statusCode: 1, timestamp: -1 });
    
    // TTL index for logs (30 days)
    await db.collection('logs').createIndex(
      { timestamp: 1 }, 
      { expireAfterSeconds: 30 * 24 * 60 * 60 }
    );

    console.log('Database indexes created successfully');
  },

  async down(db, client) {
    console.log('Dropping database indexes...');

    // Drop custom indexes (keep _id indexes)
    const collections = ['users', 'products', 'carts', 'orders', 'logs'];
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      
      for (const index of indexes) {
        // Don't drop the _id index
        if (index.name !== '_id_') {
          await db.collection(collectionName).dropIndex(index.name);
        }
      }
    }

    console.log('Database indexes dropped successfully');
  }
};