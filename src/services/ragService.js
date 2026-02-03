const axios = require('axios');
const { searchProducts } = require('./vectorService');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const LLM_MODEL = process.env.LLM_MODEL || 'llama3.2:3b';

/**
 * Format sản phẩm thành context cho LLM
 */
function formatProductsContext(products) {
  return products.map((product, index) => {
    return `${index + 1}. **${product.name}** (ID: ${product.id})
   - Thương hiệu: ${product.brand}
   - Giới tính: ${product.gender === 'male' ? 'Nam' : product.gender === 'female' ? 'Nữ' : 'Unisex'}
   - Giá: ${formatPrice(product.price)} VNĐ
   - Mô tả: ${product.description || 'Không có mô tả'}
   - Điểm tương đồng: ${(product.score * 100).toFixed(1)}%`;
  }).join('\n\n');
}

/**
 * Format giá tiền
 */
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

/**
 * Tạo system prompt cho chatbot
 */

/**
 * Tạo system prompt chặt chẽ hơn về Intent (Mục đích)
 */
function createSystemPrompt() {
  return `BẠN LÀ: Nhân viên tư vấn tận tâm, thân thiện của "GlowUp" - Shop chuyên về các sản phẩm Skincare và Chăm sóc da.

NHIỆM VỤ CHÍNH:
1. Tư vấn sản phẩm dựa trên danh sách được cung cấp.
2. Hướng dẫn kiến thức chăm sóc da (skincare routine) cơ bản.
3. Giữ thái độ lịch sự, chuyên nghiệp nhưng gần gũi (xưng "em" hoặc "GlowUp", gọi khách là "bạn" hoặc "quý khách").

QUY TẮC XỬ LÝ CÂU HỎI (QUAN TRỌNG):

- TRƯỜNG HỢP 1: Khách chào hỏi (Hi, Hello, Xin chào...)
  -> Trả lời: Chào khách, giới thiệu mình là nhân viên GlowUp và hỏi khách cần tìm sản phẩm gì.

- TRƯỜNG HỢP 2: Khách hỏi về sản phẩm/skincare
  -> Trả lời: Dựa vào [CONTEXT SẢN PHẨM] bên dưới để tư vấn. Chỉ chọn sản phẩm có trong danh sách.
  -> QUAN TRỌNG: KHÔNG ĐƯỢC nhắc ID sản phẩm trong câu trả lời. Chỉ nhắc tên sản phẩm.

- TRƯỜNG HỢP 3: Khách hỏi NGOÀI LỀ (Tình cảm, Chính trị, Code, Toán, Đời tư, câu hỏi vô nghĩa...)
  -> TỪ CHỐI TRẢ LỜI.
  -> Mẫu câu từ chối: "Dạ, em là nhân viên tư vấn của GlowUp nên chỉ rành về mỹ phẩm và chăm sóc da thôi ạ. Để tránh tư vấn sai sót, mình hỏi em về chuyện làm đẹp nhé! ^^"

OUTPUT FORMAT (JSON ONLY):
{
    "speech": "Câu trả lời của bạn (ngắn gọn dưới 40 từ, KHÔNG nhắc ID)",
    "selected_ids": [1, 2] // Danh sách ID sản phẩm phù hợp. Nếu chào hỏi hoặc từ chối thì để rỗng []
}

CONTEXT SẢN PHẨM HIỆN CÓ:
{products_context}
`;
}

/**
 * Chat với RAG (Có xử lý ngưỡng tin cậy & Lọc chủ đề)
 */
async function chatWithRAG(userMessage, conversationHistory = []) {
  try {
    // 1. Tìm kiếm sản phẩm
    const relevantProducts = await searchProducts(userMessage, 10);
    
    // --- LOGIC PHÂN LOẠI MỨC ĐỘ TIN CẬY ---
    
    const topScore = relevantProducts.length > 0 ? relevantProducts[0].score : 0;
    
    let productsContext = "";
    let useProductContext = false;

    // NGƯỠNG LỌC (Threshold): 0.40
    // Nếu điểm tìm kiếm thấp hơn 0.4 -> Câu hỏi không khớp với bất kỳ sản phẩm nào
    // -> Có thể là chào hỏi xã giao HOẶC câu hỏi ngoài lề (off-topic)
    if (topScore < 0.40) { 
        productsContext = "Không tìm thấy sản phẩm nào khớp với từ khóa."; 
        useProductContext = false;
    } 
    else {
        productsContext = formatProductsContext(relevantProducts);
        useProductContext = true;
    }

    // 2. Tạo messages gửi cho LLM
    const finalSystemPrompt = createSystemPrompt().replace('{products_context}', productsContext);

    const messages = [
      {
        role: 'system',
        content: finalSystemPrompt,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // 3. Gọi Ollama API (JSON mode bắt buộc)
    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: LLM_MODEL,
      messages,
      stream: false,
      format: 'json', 
      options: {
        temperature: 0.3 // Giảm sự sáng tạo để AI tuân thủ luật từ chối tốt hơn
      }
    });

    // 4. Parse kết quả JSON
    let aiData;
    try {
        aiData = JSON.parse(response.data.message.content);
    } catch (e) {
        // Fallback phòng trường hợp lỗi JSON
        aiData = { speech: "Dạ GlowUp đang bị lỗi kết nối một chút, bạn hỏi lại giúp em nha!", selected_ids: [] };
    }

    // 5. Lọc lại danh sách sản phẩm cuối cùng
    let finalSuggestions = [];
    
    // Chỉ map sản phẩm khi LLM thực sự chọn ID và Context hợp lệ
    if (useProductContext && aiData.selected_ids && aiData.selected_ids.length > 0) {
        finalSuggestions = relevantProducts
            .filter(p => aiData.selected_ids.includes(p.id))
            .map(p => ({
                id: p.id,
                name: p.name,
                score: p.score,
                price: p.price,
                images: p.images,
                brand: p.brand
            }));
    }

    return {
      message: aiData.speech,
      suggestedProducts: finalSuggestions 
    };

  } catch (error) {
    console.error('Error in chatWithRAG:', error.message);
    throw error;
  }
}

/**
 * Extract product IDs từ AI response
 */
function extractProductIds(text) {
  const idPattern = /\[ID:\s*(\d+)\]/g;
  const ids = [];
  let match;

  while ((match = idPattern.exec(text)) !== null) {
    ids.push(parseInt(match[1]));
  }

  return [...new Set(ids)]; // Remove duplicates
}

/**
 * Chat với streaming (cho real-time response)
 */
async function chatWithRAGStream(userMessage, conversationHistory = [], onChunk) {
  try {
    const relevantProducts = await searchProducts(userMessage, 5);
    const productsContext = relevantProducts.length > 0
      ? `\n\nCÁC SẢN PHẨM LIÊN QUAN:\n${formatProductsContext(relevantProducts)}`
      : '\n\nKhông tìm thấy sản phẩm phù hợp trong database.';

    const messages = [
      {
        role: 'system',
        content: createSystemPrompt() + productsContext,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: LLM_MODEL,
        messages,
        stream: true,
      },
      {
        responseType: 'stream',
      }
    );

    let fullResponse = '';

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        
        lines.forEach((line) => {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullResponse += parsed.message.content;
              if (onChunk) onChunk(parsed.message.content);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });
      });

      response.data.on('end', () => {
        const productIds = extractProductIds(fullResponse);
        resolve({
          response: fullResponse,
          productIds,
          relevantProducts: relevantProducts.slice(0, 3),
        });
      });

      response.data.on('error', reject);
    });
  } catch (error) {
    console.error('Error in chatWithRAGStream:', error.message);
    throw error;
  }
}

module.exports = {
  chatWithRAG,
  chatWithRAGStream,
  extractProductIds,
};