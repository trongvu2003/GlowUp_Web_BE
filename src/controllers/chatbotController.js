const { chatWithRAG, chatWithRAGStream } = require('../services/ragService');
const { searchProducts } = require('../services/vectorService'); 
/**
 * Chat endpoint (non-streaming)
 * Trả về JSON sạch sẽ: message (lời thoại) và suggestedProducts (dữ liệu)
 */ 
async function chat(req, res) {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Gọi service (Service đã được sửa để trả về { message, suggestedProducts })
    const result = await chatWithRAG(message, conversationHistory);

    // Trả về đúng format bạn yêu cầu
    res.json({
      success: true,
      data: {
        message: result.message,           // Lời thoại ngắn gọn của AI
        suggestedProducts: result.suggestedProducts // Danh sách sản phẩm đã lọc
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu',
      error: error.message,
    });
  }
}

/**
 * Chat endpoint with streaming
 * Lưu ý: Nếu dùng mode JSON ở Service, streaming text sẽ khó hiển thị mượt.
 * Hàm này giữ lại logic cũ nhưng update tên biến trả về khi done.
 */
async function chatStream(req, res) {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await chatWithRAGStream(
      message,
      conversationHistory,
      (chunk) => {
        // Gửi từng phần text (nếu service hỗ trợ stream text)
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }
    );

    // Khi hoàn tất, gửi danh sách sản phẩm (đồng bộ tên biến với hàm chat thường)
    res.write(`data: ${JSON.stringify({ 
      type: 'done', 
      suggestedProducts: result.suggestedProducts || result.relevantProducts, // Fallback nếu service chưa đổi tên
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Chat stream error:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error.message 
    })}\n\n`);
    res.end();
  }
}

/**
 * Get suggested products based on query
 */
async function getSuggestions(req, res) {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Query is required',
      });
    }

    const products = await searchProducts(query, 10);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy gợi ý',
      error: error.message,
    });
  }
}

module.exports = {
  chat,
  chatStream,
  getSuggestions,
};