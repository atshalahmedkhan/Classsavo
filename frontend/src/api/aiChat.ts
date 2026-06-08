import client from './client';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const aiChatApi = {
  send: async (chapterId: number, message: string, history: ChatTurn[]) => {
    const { data } = await client.post<{ response: string }>('/courses/ai-chat/', {
      message,
      chapter_id: chapterId,
      history,
    });
    return data;
  },
};
