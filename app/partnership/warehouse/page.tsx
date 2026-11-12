import type { Metadata } from 'next';
import { WarehouseForm } from '@/components/partnership/warehouse-form';
import { isDbConfigured } from '@/lib/supabase';
export const metadata: Metadata = { title: '창고·물류센터 임대 등록', description: '위치·면적·임대 조건을 등록하고 조건이 맞는 화주 요청을 받아보세요. 상세 주소와 연락처는 공개하지 않습니다.', robots: { index: false, follow: true } };
export const dynamic = 'force-dynamic';
export default function Page() { return <WarehouseForm stored={isDbConfigured()} />; }
