import {requireAdmin} from '@/lib/auth';
import {getInquiries} from '@/lib/inquiries';
import {publicationRows,interestRows} from '@/lib/request-store';
import RequestsAdmin from '@/components/requests/admin';
export default async function Page(){await requireAdmin();const result=await Promise.allSettled([getInquiries(),publicationRows(),interestRows()]);if(result[0].status==='rejected'||result[1].status==='rejected'||result[2].status==='rejected')return <div className="page"><h1>화주 요청 공개 관리</h1><p role="alert">저장소를 연결하지 못했습니다. 006_public_requests.sql 적용 상태를 확인하세요.</p></div>;const inquiries=result[0].value,rows=result[1].value,interests=result[2].value;return <RequestsAdmin inquiries={inquiries.filter(x=>x.kind==='consultation').map(x=>({id:x.id,company:x.company,eligible:x.shipperQuote?.publicConsent===true}))} rows={rows.map(({id,inquiry_id,snapshot,state,revision,approved_at})=>({id,inquiry_id,snapshot,state,revision,approved_at}))} interests={interests}/>;}
