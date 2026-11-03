import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getInquiries } from '@/lib/inquiries';
import { listQuotes } from '@/lib/quote-store';
import QuoteAdmin from '@/components/quotes/quote-admin';
export const metadata:Metadata={title:'3PL 견적 관리'};
export default async function Page(props:PageProps<'/admin/quotes'>){
  await requireAdmin('/admin/quotes');const {inquiry}=await props.searchParams;
  const results=await Promise.allSettled([getInquiries(),listQuotes()]);
  if(results[0].status==='rejected'||results[1].status==='rejected')return <div className="page admin-page"><h1>3PL 견적 관리</h1><p role="alert">{results.find(r=>r.status==='rejected')?.reason instanceof Error ? results.find(r=>r.status==='rejected')?.reason.message : '저장소 연결을 확인하세요.'}</p><Link href="/admin">관리자로 돌아가기</Link></div>;
  return <>{process.env.LOGILOOP_DEMO === '1' && <div className="demo-notice">로컬 시연 · 가상 업체·화주 데이터 · 운영 DB 변경과 실제 발송 없음</div>}<QuoteAdmin inquiries={results[0].value} quotes={results[1].value} initialInquiry={typeof inquiry==='string'?Number(inquiry):undefined}/></>;
}
