const axios = require('axios');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

/**
 * Tạo embedding vector từ text sử dụng Ollama
 */
async function createEmbedding(text) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: EMBEDDING_MODEL,
      prompt: text,
    });

    return response.data.embedding;
  } catch (error) {
    console.error('Error creating embedding:', error.message);
    throw error;
  }
}

/**
 * Tạo text mô tả sản phẩm để embedding
 */
function createProductDescription(product) {
  const parts = [
    product.name,
    product.brand,
    product.gender === 'male' ? 'nước hoa nam' : 
    product.gender === 'female' ? 'nước hoa nữ' : 'nước hoa unisex',
    product.description || '',
  ];
  
  return parts.filter(Boolean).join('. ');
}

module.exports = {
  createEmbedding,
  createProductDescription,
};