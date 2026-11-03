import Link from 'next/link';
import {publicRequests} from '@/lib/request-store';
import RequestCatalog from '@/components/requests/catalog';
import {pageMetadata} from '@/lib/page-metadata';
export const metadata=pageMetadata('진행 중인 화주 요청','공개가 승인된 물류 위탁 요청의 권역·품목·작업 조건을 확인하고 검토 의향을 남기세요.','/requests');
export const dynamic='force-dynamic';
export default async function Page(){const result=await Promise.allSettled([publicRequests()]);if(result[0].status==='rejected')return <div className="page"><h1>진행 중인 화주 요청</h1><p role="alert">요청 목록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p><Link href="/partnership">업체 등록하기</Link></div>;const items=result[0].value;return <div className="page"><h1>진행 중인 화주 요청</h1><p>화주가 공개를 승인한 요약만 제공합니다. 자세한 조건은 담당자 확인 후 지정 업체와 협의합니다.</p><div className="partner-actions"><Link href="/quote/request" className="button button-yellow">화주 견적 요청</Link><Link href="/partnership" className="button button-outline">물류사 등록</Link></div><RequestCatalog items={items}/></div>;}
