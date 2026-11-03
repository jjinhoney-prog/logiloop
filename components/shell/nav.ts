import type { Route } from 'next';
import { BookOpen, Info, GitCompareArrows, LayoutDashboard, Truck, Warehouse, type LucideIcon } from 'lucide-react';

export const navigation: { href: Route; title: string; icon: LucideIcon }[] = [
  { href: '/', title: '홈', icon: LayoutDashboard },
  { href: '/warehouses', title: '창고·물류센터', icon: Warehouse },
  { href: '/partners', title: '물류사·3PL', icon: Truck },
  { href: '/requests', title: '진행 중인 화주 요청', icon: Truck },
  { href: '/quote/request', title: '3PL 견적 요청', icon: Truck },
  { href: '/compare', title: '후보 비교함', icon: GitCompareArrows },
  { href: '/about', title: '서비스 안내', icon: Info },
  { href: '/insights', title: '물류 가이드', icon: BookOpen },
];

const secondaryLabels: [prefix: string, label: string][] = [
  ['/agreements/sign', '계약 확인·전자서명'],
  ['/consultation', '물류 요청'],
  ['/admin/agreements', '전자계약 관리'],
  ['/admin/requests', '화주 요청 공개 관리'],
  ['/admin/quotes', '3PL 견적 관리'],
  ['/admin', '운영 워크스페이스'],
  ['/partnership/manage', '업체 정보 보완'],
  ['/partnership/warehouse', '창고 임대 등록'],
  ['/partnership', '3PL 업체 등록'],
];

export function isActive(href: string, path: string) {
  return href === '/' ? path === '/' : (path === href || path.startsWith(`${href}/`));
}

/** 상단 breadcrumb에 표시할 현재 화면 이름 */
export function currentLabel(path: string) {
  return (
    navigation.find(({ href }) => isActive(href, path))?.title ??
    secondaryLabels.find(([prefix]) => path.startsWith(prefix))?.[1] ??
    '이용 안내'
  );
}
