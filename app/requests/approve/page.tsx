import type {Metadata} from 'next';
import Approval from '@/components/requests/approval';
export const metadata:Metadata={title:'공개 요약 확인',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Page(){return <Approval/>;}
