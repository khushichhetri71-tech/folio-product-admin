import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { createApi } from './axios';
import type { User } from './types';
export const SESSION_COOKIE = 'folio_session';
export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const client = createApi('https://dummyjson.com', () => token);
  const { data } = await client.get<User>('/auth/me');
  const { id, username, firstName, lastName, email, image } = data;
  return { user: { id, username, firstName, lastName, email, image }, token };
});
