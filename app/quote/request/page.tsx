import type { Metadata } from 'next';
import ShipperRequest from '@/components/quotes/shipper-request';
import {getPublicListings} from '@/lib/listings';
import {parseConsultationParams,parseRequestContext} from '@/lib/search-params';
import {partnerCategories} from '@/lib/partner-brand';
export const metadata: Metadata = {title:'화주 3PL 견적 요청',robots:{index:false,follow:true}};
export default async function Page(props:PageProps<'/quote/request'>){
 const params=await props.searchParams;const context=parseRequestContext(params);const {targets}=parseConsultationParams(params);
 const listings=targets.length?await getPublicListings('partner'):[];
 const candidates=listings.filter(x=>targets.includes(x.id));
 return <ShipperRequest initial={{region:context.region==='아직 모름'?'':context.region,temperature:context.temperature==='아직 모름'?'':context.temperature,note:context.note,category:typeof params.category==='string'&&partnerCategories.includes(params.category as typeof partnerCategories[number])?params.category:'',services:typeof params.service==='string'?[params.service.slice(0,100)]:[],candidates:candidates.map(({id,name})=>({id,name}))}}/>;
}
