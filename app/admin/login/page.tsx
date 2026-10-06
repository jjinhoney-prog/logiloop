import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/login-form';
import { PageHeading } from '@/components/ui';
import { isAdmin, isAuthConfigured } from '@/lib/auth';

export const metadata: Metadata = { title: '관리자 로그인' };

export default async function Page() {
  if (await isAdmin()) redirect('/admin');
  return (
    <div className="page">
      <PageHeading eyebrow="OPERATIONS WORKSPACE" title="운영 워크스페이스" description="상담 접수와 매물 관리는 관리자만 이용할 수 있습니다." />
      <LoginForm configured={isAuthConfigured()} />
    </div>
  );
}
