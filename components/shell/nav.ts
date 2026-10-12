import type { Route } from 'next';
import { BookOpen, Info, GitCompareArrows, LayoutDashboard, Truck, Warehouse, type LucideIcon } from 'lucide-react';

export const navigation: { href: Route; title: string; icon: LucideIcon }[] = [
  { href: '/', title: '홈', icon: LayoutDashboard },
  { href: '/warehouses', title: '창고·물류센터', icon: Warehouse },
  { href: '/partners', title: '물류사·3PL', icon: Truck },
  { href: '/compare', title: '후보 비교함', icon: GitCompareArrows },
  { href: '/about', title: '서비스 안내', icon: Info },
  { href: '/insights', title: '물류 가이드', icon: BookOpen },
];

const secondaryLabels: [prefix: string, label: string][] = [
  ['/consultation', '물류 요청'],
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
