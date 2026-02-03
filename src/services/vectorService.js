const { qdrantClient, COLLECTION_NAME } = require('../config/qdrant');
const { createEmbedding } = require('./embeddingService');

/**
 * Tạo collection trong Qdrant
 */
async function createCollection() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (exists) {
      console.log(`Collection ${COLLECTION_NAME} already exists`);
      return;
    }

    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 768, // nomic-embed-text dimension
        distance: 'Cosine',
      },
    });

    console.log(`Collection ${COLLECTION_NAME} created successfully`);
  } catch (error) {
    console.error('Error creating collection:', error.message);
    throw error;
  }
}

/**
 * Index một sản phẩm vào Qdrant
 */
async function indexProduct(product) {
  try {
    const description = createProductDescription(product);
    const embedding = await createEmbedding(description);

    await qdrantClient.upsert(COLLECTION_NAME, {
      points: [
        {
          id: product.id,
          vector: embedding,
          payload: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            gender: product.gender,
            price: parseFloat(product.price),
            description: product.description,
            category_id: product.category_id,
            images: product.images,
          },
        },
      ],
    });

    console.log(`Indexed product: ${product.name}`);
  } catch (error) {
    console.error(`Error indexing product ${product.id}:`, error.message);
    throw error;
  }
}

/**
 * Index nhiều sản phẩm cùng lúc
 */
async function indexProducts(products) {
  const { createProductDescription } = require('./embeddingService');
  
  const points = await Promise.all(
    products.map(async (product) => {
      const description = createProductDescription(product);
      const embedding = await createEmbedding(description);

      return {
        id: product.id,
        vector: embedding,
        payload: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          gender: product.gender,
          price: parseFloat(product.price),
          description: product.description,
          category_id: product.category_id,
          images: product.images,
        },
      };
    })
  );

  await qdrantClient.upsert(COLLECTION_NAME, {
    points,
  });

  console.log(`Indexed ${products.length} products`);
}

/**
 * Tìm kiếm sản phẩm tương tự
 */
async function searchProducts(query, limit = 5) {
  try {
    const queryEmbedding = await createEmbedding(query);

    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    });

    return searchResult.map(result => ({
      ...result.payload,
      score: result.score,
    }));
  } catch (error) {
    console.error('Error searching products:', error.message);
    throw error;
  }
}

/**
 * Xóa collection
 */
async function deleteCollection() {
  try {
    await qdrantClient.deleteCollection(COLLECTION_NAME);
    console.log(`Collection ${COLLECTION_NAME} deleted`);
  } catch (error) {
    console.error('Error deleting collection:', error.message);
    throw error;
  }
}

module.exports = {
  createCollection,
  indexProduct,
  indexProducts,
  searchProducts,
  deleteCollection,
};