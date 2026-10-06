import type { ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock3, Truck, Warehouse } from 'lucide-react';
import { isExampleListing, listingHref } from '@/lib/data';
import type { Listing } from '@/lib/types';
import { CompareToggle } from './compare-toggle';

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-notice">
      <span className="demo-dot" />
      {children || '둘러보기 모드 · 아래 업체와 매물은 화면 확인을 위한 가상 예시입니다.'}
    </div>
  );
}

export function Empty({
  title = '조건에 맞는 후보가 없습니다.',
  description = '필터를 바꾸거나 상담에서 필요한 조건을 알려주세요.',
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Warehouse size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function CatalogCard({ item }: { item: Listing }) {
  const warehouse = item.type === 'warehouse';
  const Icon = warehouse ? Warehouse : Truck;
  return (
    <article className="catalog-card">
      <div className={`card-cover region-${item.region}`}>
        <div className="cover-top">
          <span>{warehouse ? 'SPACE' : '3PL PARTNER'}</span>
          {isExampleListing(item) && <span className="example-label">예시</span>}
        </div>
        <div className="cover-main">
          <Icon size={44} strokeWidth={1.2} />
          <span>
            {item.region}
            <small>{warehouse ? 'LOGISTICS SPACE' : 'LOGISTICS SERVICE'}</small>
          </span>
        </div>
        <div className="cover-bottom">
          <span>{item.temperature}</span>
          <span>{item.capacity}</span>
        </div>
      </div>
      <div className="card-body">
        <div className="card-location">{item.district}</div>
        <Link className="card-title" href={listingHref(item)}>
          {item.name}
          <ArrowUpRight size={18} />
        </Link>
        <div className="tags">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="card-meta">
          <strong>{item.price}</strong>
          <small>{item.available}</small>
        </div>
        <div className="card-footer">
          <span>
            <Clock3 size={13} />
            {item.status}
          </span>
          <CompareToggle id={item.id} />
        </div>
      </div>
    </article>
  );
}

export function SectionTitle({ index, title, href, linkText = '전체 보기' }: { index?: string; title: string; href?: Route; linkText?: string }) {
  return (
    <div className="section-title">
      <h2>
        {index && <span>{index}</span>}
        {title}
      </h2>
      {href && (
        <Link href={href}>
          {linkText}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

const roles = [
  ['로지루프', '요구조건 정리 · 후보 비교 · 현장 확인 · 조건 협의 지원 · 전환 일정 관리'],
  ['물류사', '계약한 보관·출고·배송 서비스 수행과 문제 처리'],
  ['임대인', '계약한 공간·시설 제공'],
  ['화주', '물량·품목 정보 제공 · 대안 선택 · 운영 기준 합의'],
] as const;

export function Roles() {
  return (
    <div className="roles-grid">
      {roles.map(([name, text]) => (
        <div key={name}>
          <strong>{name}</strong>
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}
