import type { Metadata } from 'next';
import WarehouseManage from '@/components/partnership/warehouse-manage';
export const metadata: Metadata = { title: '창고 정보 보완', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <WarehouseManage />; }
