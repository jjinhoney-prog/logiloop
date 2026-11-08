import {notFound} from 'next/navigation';
import Link from 'next/link';
import {publicRequest} from '@/lib/request-store';
import RequestSummary from '@/components/requests/summary';
import InterestForm from '@/components/requests/interest';
import type {Metadata} from 'next';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'화주 요청 상세',robots:{index:false,follow:true},referrer:'no-referrer'};
export default async function Page(props:PageProps<'/requests/[id]'>){const {id}=await props.params;const item=await publicRequest(id);if(!item)notFound();return <div className="page partner-page"><Link href="/requests" className="back-link">화주 요청 목록</Link><h1>화주 요청 상세</h1><section className="panel"><RequestSummary value={item.snapshot}/></section><InterestForm requestId={id}/></div>;}
