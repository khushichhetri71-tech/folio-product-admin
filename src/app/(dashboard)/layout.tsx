import { requireSession } from '@/lib/server-auth';
import { Shell } from '@/components/shell';
import { WorkspaceProvider } from '@/components/workspace-provider';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <WorkspaceProvider user={session.user}>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
