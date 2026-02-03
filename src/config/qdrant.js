const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'perfume_products';

module.exports = {
  qdrantClient,
  COLLECTION_NAME,
};