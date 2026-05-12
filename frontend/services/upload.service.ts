import api from '../lib/axios';

export const uploadService = {
  uploadMultiple: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Convert relative URLs to absolute URLs using the backend URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
    return response.data.urls.map((url: string) => `${baseUrl}${url}`);
  },
};
