const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

/**
 * POST /api/chatbot/chat
 * Body: { message: string, conversationHistory: array }
 */
router.post('/chat', chatbotController.chat);

/**
 * POST /api/chatbot/chat/stream
 * Body: { message: string, conversationHistory: array }
 * Response: Server-Sent Events (SSE)
 */
router.post('/chat/stream', chatbotController.chatStream);

/**
 * GET /api/chatbot/suggestions?query=
 * Query: { query: string }
 */
router.get('/suggestions', chatbotController.getSuggestions);

module.exports = router;