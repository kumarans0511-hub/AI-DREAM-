export const api = {
  /**
   * Send a message to the chat endpoint and get AI response and memory extraction.
   * @param {string} message The user message
   */
  async chat(message) {
    try {
      const response = await fetch(`/chat?message=${encodeURIComponent(message)}`);
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('API Error (chat):', error);
      throw error;
    }
  },

  /**
   * Get memories based on a search query.
   * @param {string} query The search query string
   */
  async getMemories(query = '') {
    try {
      const response = await fetch(`/memories?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch memories');
      return await response.json();
    } catch (error) {
      console.error('API Error (getMemories):', error);
      throw error;
    }
  },

  /**
   * Get all memories from the database.
   */
  async getAllMemories() {
    try {
      const response = await fetch('/memories/all');
      if (!response.ok) throw new Error('Failed to fetch all memories');
      return await response.json();
    } catch (error) {
      console.error('API Error (getAllMemories):', error);
      throw error;
    }
  },

  /**
   * Get the current status of the background Dream cycle.
   */
  async getDreamStatus() {
    try {
      const response = await fetch('/dream/status');
      if (!response.ok) throw new Error('Failed to fetch dream status');
      return await response.json();
    } catch (error) {
      console.error('API Error (getDreamStatus):', error);
      throw error;
    }
  },

  /**
   * Manually trigger a Dream cycle.
   */
  async triggerDream() {
    try {
      const response = await fetch('/dream/trigger', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to trigger dream');
      return await response.json();
    } catch (error) {
      console.error('API Error (triggerDream):', error);
      throw error;
    }
  }
};
