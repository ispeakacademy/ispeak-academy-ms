import type { PaginatedResponse } from '@/types/clients';
import type { AudiencePreviewResult, BulkSendResult, Communication, CreateTemplateDto, MessageTemplate, PreviewAudienceDto, QueryCommunicationsDto, SendBulkMessageDto, SendMessageDto, UpdateTemplateDto } from '@/types/communications';
import apiClient from '.';

export const sendMessage = async (data: SendMessageDto): Promise<Communication> => {
  const response = await apiClient.post('/communications/send', data);
  return response.data.data;
};

export const getCommunications = async (query?: QueryCommunicationsDto): Promise<PaginatedResponse<Communication>> => {
  const response = await apiClient.get('/communications', { params: query });
  return response.data?.data;
};

export const getInbox = async (page = 1, limit = 20): Promise<PaginatedResponse<Communication>> => {
  const response = await apiClient.get('/communications/inbox', { params: { page, limit } });
  return response.data?.data;
};

export const getCommunication = async (id: string): Promise<Communication> => {
  const response = await apiClient.get(`/communications/${id}`);
  return response.data.data;
};

export const replyToMessage = async (id: string, body: string): Promise<Communication> => {
  const response = await apiClient.post(`/communications/${id}/reply`, { body });
  return response.data.data;
};

export const getTemplates = async (): Promise<MessageTemplate[]> => {
  const response = await apiClient.get('/templates');
  return response.data.data;
};

export const getTemplate = async (id: string): Promise<MessageTemplate> => {
  const response = await apiClient.get(`/templates/${id}`);
  return response.data.data;
};

export const createTemplate = async (data: CreateTemplateDto): Promise<MessageTemplate> => {
  const response = await apiClient.post('/templates', data);
  return response.data.data;
};

export const updateTemplate = async (id: string, data: UpdateTemplateDto): Promise<MessageTemplate> => {
  const response = await apiClient.patch(`/templates/${id}`, data);
  return response.data.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/templates/${id}`);
};

export const sendBulkMessage = async (data: SendBulkMessageDto): Promise<BulkSendResult> => {
  const response = await apiClient.post('/communications/send-bulk', data);
  return response.data.data;
};

export const previewAudience = async (data: PreviewAudienceDto): Promise<AudiencePreviewResult> => {
  const response = await apiClient.post('/communications/preview-audience', data);
  return response.data.data;
};

const communicationsApi = {
  sendMessage,
  getCommunications,
  getInbox,
  getCommunication,
  replyToMessage,
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendBulkMessage,
  previewAudience,
};

export default communicationsApi;
