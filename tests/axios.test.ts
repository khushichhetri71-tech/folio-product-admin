import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { ApiError, createApi } from '../src/lib/axios';
describe('shared Axios client', () => {
  it('attaches a bearer token to upstream requests', async () => {
    const api = createApi('https://dummyjson.com', () => 'test-token');
    api.defaults.adapter = async (config) => {
      expect(config.headers.Authorization).toBe('Bearer test-token');
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    };
    expect((await api.get('/products')).data.ok).toBe(true);
  });
  it('normalizes network errors', async () => {
    const api = createApi('/api');
    api.defaults.adapter = async () => {
      throw new AxiosError('Network Error', 'ERR_NETWORK');
    };
    await expect(api.get('/products')).rejects.toThrow('Unable to connect');
  });
  it('preserves a not found status', async () => {
    const api = createApi('/api');
    api.defaults.adapter = async (config) => {
      throw new AxiosError(
        'not found',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: { message: 'Product not found' },
          status: 404,
          statusText: 'Not found',
          headers: new AxiosHeaders(),
          config,
        },
      );
    };
    await expect(api.get('/products/999')).rejects.toMatchObject({
      status: 404,
      message: 'Product not found',
      name: ApiError.name,
    });
  });
});
