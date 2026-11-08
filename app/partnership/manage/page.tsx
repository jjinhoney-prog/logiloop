import type { Metadata } from 'next';
import PartnerManage from '@/components/partnership/partner-manage';
export const metadata: Metadata = { title: '업체 정보 보완', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <PartnerManage />; }
