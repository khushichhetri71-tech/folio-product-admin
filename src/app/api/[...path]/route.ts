import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ApiError, createApi, errorMessage } from '@/lib/axios';
import { getSession, SESSION_COOKIE } from '@/lib/server-auth';
import { loginSchema, productSchema } from '@/lib/validation';
export const dynamic = 'force-dynamic';
async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join('/'),
    method = request.method;
  if (method !== 'GET' && request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  try {
    if (path === 'auth/logout' && method === 'POST') {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    if (path === 'auth/login' && method === 'POST') {
      const parsed = loginSchema.safeParse(await request.json());
      if (!parsed.success)
        return NextResponse.json({ message: 'Enter a username and password.' }, { status: 400 });
      const client = createApi('https://dummyjson.com');
      let data;
      try {
        ({ data } = await client.post('/auth/login', { ...parsed.data, expiresInMins: 60 }));
      } catch (error) {
        if (error instanceof ApiError && [400, 401].includes(error.status))
          return NextResponse.json(
            { message: 'Incorrect username or password. Please try again.' },
            { status: 401 },
          );
        throw error;
      }
      const response = NextResponse.json({
        id: data.id,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        image: data.image,
      });
      response.cookies.set(SESSION_COOKIE, data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      });
      return response;
    }
    const allowed =
      method === 'GET'
        ? /^(auth\/me|products(?:\/(?:\d+|search|categories|category\/[a-z0-9-]+))?)$/.test(path)
        : method === 'POST'
          ? path === 'products/add'
          : (method === 'PUT' || method === 'DELETE') && /^products\/\d+$/.test(path);
    if (!allowed) return NextResponse.json({ message: 'Endpoint not found.' }, { status: 404 });
    const session = await getSession();
    if (!session)
      return NextResponse.json({ message: 'Please sign in to continue.' }, { status: 401 });
    if (path === 'auth/me') return NextResponse.json(session.user);
    const client = createApi('https://dummyjson.com', () => session.token);
    let body;
    if (method === 'POST' || method === 'PUT') {
      const parsed = productSchema.safeParse(await request.json());
      if (!parsed.success)
        return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
      body = parsed.data;
    }
    const params: Record<string, string> = {};
    for (const key of ['limit', 'skip', 'q', 'sortBy', 'order', 'delay']) {
      const value = request.nextUrl.searchParams.get(key);
      if (value !== null) params[key] = value;
    }
    const { data } = await client.request({ url: `/${path}`, method, data: body, params });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status =
      error instanceof ApiError ? error.status || 502 : error instanceof SyntaxError ? 400 : 500;
    if (status === 401) (await cookies()).delete(SESSION_COOKIE);
    return NextResponse.json({ message: errorMessage(error) }, { status });
  }
}
export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
