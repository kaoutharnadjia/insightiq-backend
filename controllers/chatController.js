const chatService = require('../services/chatService');
const vectorService = require('../services/vectorService');

const chatController = {
  /**
   * Handle chat messages
   */
  handleChat: async (req, res) => {
    const { message, erpType } = req.body;

    if (!message || !erpType) {
      return res.status(400).json({ error: 'Message and ERP Type are required' });
    }

    try {
      const response = await chatService.chat(message, erpType);
      res.json({ response });
    } catch (error) {
      console.error('Chat controller error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  },

  /**
   * Trigger data indexing for an ERP
   */
  indexData: async (req, res) => {
    const { erpType } = req.body;

    if (!erpType) {
      return res.status(400).json({ error: 'ERP Type is required' });
    }

    try {
      const result = await vectorService.indexERPData(erpType);
      res.json(result);
    } catch (error) {
      console.error('Indexing controller error:', error);
      res.status(500).json({ error: 'Failed to index data' });
    }
  }
};

module.exports = chatController;
