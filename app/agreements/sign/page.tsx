import type {Metadata} from 'next';
import AgreementSign from '@/components/agreements/sign';
export const metadata:Metadata={title:'계약 확인·전자서명',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Page(){return <AgreementSign/>;}
