import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly AI_SERVICE_URL =
    process.env.AI_SERVICE_URL || 'http://localhost:8000';

  async getRecommendations(userId: string, q?: string) {
    try {
      const url = new URL(
        `${this.AI_SERVICE_URL}/recommendations/${userId || 'guest'}`,
      );
      if (q) url.searchParams.append('q', q);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`AI Service responded with status: ${response.status}`);
      }
      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch recommendations from AI Service: ${error.message}`,
      );
      return []; // Trả về mảng rỗng nếu AI service sập (fallback an toàn)
    }
  }
}
