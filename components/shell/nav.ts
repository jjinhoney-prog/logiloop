import type { Route } from 'next';
import { BookOpen, GitCompareArrows, LayoutDashboard, Truck, Warehouse, type LucideIcon } from 'lucide-react';

export const navigation: { href: Route; title: string; icon: LucideIcon }[] = [
  { href: '/', title: '상담 시작', icon: LayoutDashboard },
  { href: '/warehouses', title: '창고·물류센터', icon: Warehouse },
  { href: '/partners', title: '물류사·3PL', icon: Truck },
  { href: '/compare', title: '후보 비교함', icon: GitCompareArrows },
  { href: '/insights', title: '물류 가이드', icon: BookOpen },
];

const secondaryLabels: [prefix: string, label: string][] = [
  ['/consultation', '상담 신청'],
  ['/admin', '운영 워크스페이스'],
  ['/partnership', '파트너 참여'],
];

export function isActive(href: string, path: string) {
  return href === '/' ? path === '/' : path.startsWith(href);
}

/** 상단 breadcrumb에 표시할 현재 화면 이름 */
export function currentLabel(path: string) {
  return (
    navigation.find(({ href }) => isActive(href, path))?.title ??
    secondaryLabels.find(([prefix]) => path.startsWith(prefix))?.[1] ??
    '이용 안내'
  );
}
