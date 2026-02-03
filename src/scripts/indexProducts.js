const sql = require('mssql');
const { createCollection, indexProducts } = require('../services/vectorService');
require('dotenv').config();

const dbConfig = {
  user: process.env.USER,           
  password: process.env.PASSWORD,   
  server: process.env.SERVER,       
  database: process.env.DATABASE,   
  options: {
    encrypt: false,                 
    trustServerCertificate: true,
  },
};

async function indexAllProducts() {
  let pool;

  try {
    console.log(' Starting product indexing...');

    // 1. Tạo collection trong Qdrant
    console.log(' Creating Qdrant collection...');
    await createCollection();

    // 2. Kết nối database
    console.log(' Connecting to database...');
    pool = await sql.connect(dbConfig);

    // 3. Lấy tất cả sản phẩm
    console.log(' Fetching products from database...');
    const result = await pool.request().query(`
      SELECT 
        p.id,
        p.name,
        p.brand,
        p.gender,
        p.price,
        p.description,
        p.category_id,
        p.images,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.quantity > 0
    `);

    const products = result.recordset;
    console.log(` Found ${products.length} products`);

    if (products.length === 0) {
      console.log('  No products found to index');
      return;
    }

    // 4. Index sản phẩm theo batch (10 sản phẩm mỗi lần để tránh quá tải)
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(` Indexing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}...`);
      
      await indexProducts(batch);
      
      // Delay nhẹ giữa các batch
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(' All products indexed successfully!');
  } catch (error) {
    console.error(' Error indexing products:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log(' Database connection closed');
    }
  }
}

// Chạy script
if (require.main === module) {
  indexAllProducts()
    .then(() => {
      console.log(' Indexing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Indexing failed:', error);
      process.exit(1);
    });
}

module.exports = { indexAllProducts };