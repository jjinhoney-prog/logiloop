import {requireAdmin} from '@/lib/auth';
import {getInquiries} from '@/lib/inquiries';
import {listQuotes} from '@/lib/quote-store';
import {listAgreements} from '@/lib/agreement-store';
import AgreementsAdmin from '@/components/agreements/admin';
export default async function Page(props:PageProps<'/admin/agreements'>){await requireAdmin();const {inquiry}=await props.searchParams;const result=await Promise.allSettled([listAgreements(),getInquiries(),listQuotes()]);if(result[0].status==='rejected'||result[1].status==='rejected')return <div className="page"><h1>전자계약 관리</h1><p role="alert">전자계약 저장소를 불러오지 못했습니다. 007_agreements.sql 적용을 확인하세요.</p></div>;
 return <AgreementsAdmin quotes={result[2].status==='fulfilled'?result[2].value:[]} quoteError={result[2].status==='rejected'?'견적을 불러오지 못했습니다. 견적 저장소를 확인하거나 빈 초안으로 시작하세요.':undefined} initialInquiry={typeof inquiry==='string'?Number(inquiry):undefined} rows={result[0].value.map(row=>{const {access_hashes,expires_at,...view}=row;void access_hashes;void expires_at;return view;})} inquiries={result[1].value.filter(x=>x.kind==='consultation').map(({id,company})=>({id,company}))}/>;}
