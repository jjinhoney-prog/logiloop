import type { Metadata } from 'next';
import QuoteResponsePage from '@/components/quotes/quote-response';
export const metadata: Metadata = {title:'비공개 견적 회신',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Page(){return <QuoteResponsePage/>;}
