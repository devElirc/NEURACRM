import axios from "axios";

class AIService {
  async generateReply({
    conversationId,
    context,
    customerMessage,
    settings,
  }: {
    conversationId: string;
    context: string;
    customerMessage: string;
    settings: { tone: string; length: string };
  }) {
    try {
      const response = await axios.post("/api/ai/reply", {
        conversationId,
        context,
        customerMessage,
        settings,
      });

      return response.data; // { content: "...", meta: {...} }
    } catch (error: any) {
      console.error("❌ AIService.generateReply failed:", error);
      throw new Error(error.response?.data?.detail || "AI reply failed");
    }
  }
}

export const aiService = new AIService();
