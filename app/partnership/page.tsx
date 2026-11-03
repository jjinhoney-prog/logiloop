import type { Metadata } from 'next';
import { PartnerForm } from '@/components/partnership/partner-form';

export const metadata: Metadata = { title: '3PL 업체 등록', description: '운영 지역과 서비스를 등록하고 로지루프와 화주 요청을 검토하세요. 센터 상세정보는 접수 후 보완할 수 있습니다.' };
export default function Page() { return <PartnerForm />; }
