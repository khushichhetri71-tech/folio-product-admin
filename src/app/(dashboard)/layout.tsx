import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-auth';
import { ApiError } from '@/lib/axios';
import { Shell } from '@/components/shell';
import { WorkspaceProvider } from '@/components/workspace-provider';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getSession();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login?expired=1');
    throw error;
  }
  if (!session) redirect('/login');
  return (
    <WorkspaceProvider user={session.user}>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
