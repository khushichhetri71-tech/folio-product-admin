import { api } from './axios';
import type { User } from './types';
export const login = async (username: string, password: string) =>
  (await api.post<User>('/auth/login', { username, password })).data;
export const logout = async () => {
  await api.post('/auth/logout');
};
