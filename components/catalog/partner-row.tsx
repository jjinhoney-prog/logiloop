'use client';

import { operatingRegionLabel } from '@/lib/partner-regions';
import {officialPartnerMedia} from '@/lib/official-partner-media';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2 } from 'lucide-react';
import { CompareToggle } from '@/components/ui/compare-toggle';
import { TempChip } from '@/components/ui';
import { isExampleListing, listingHref } from '@/lib/data';
import type { Listing } from '@/lib/types';
import styles from './partner-row.module.css';

export default function PartnerRow({ item }: { item: Listing }) {
  const [failedLogo, setFailedLogo] = useState<string>();
  const logoUrl = item.imageUrl || officialPartnerMedia[item.id]?.logo.url;
  const hasLogo = !!logoUrl && failedLogo !== logoUrl;
  const services = [...new Set(item.service.split('·').map(s => s.trim()).filter(Boolean))];
  return <article className={styles.row} aria-label={item.name}>
    <div className={`${styles.logo} ${!item.imageUrl && officialPartnerMedia[item.id] ? styles.officialLogo : ''}`}>
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={`${item.name} 로고`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedLogo(logoUrl)} />
      ) : <><Building2 size={28} strokeWidth={1.5} aria-hidden="true"/><span>로고 미등록</span></>}
    </div>
    <div className={styles.body}>
      <div className={styles.heading}><h2><Link href={listingHref(item)}>{item.name}</Link></h2>{isExampleListing(item) && <span className={styles.example}>예시</span>}</div>
      <div className={styles.regions}><span>운영 지역</span><ul>{(item.operatingRegions?.length ? item.operatingRegions.map(operatingRegionLabel) : [`${item.region} · ${item.district}`]).map(region=><li key={region}>{region}</li>)}</ul></div>
      {item.suitability && <p className={styles.highlight}><strong>운영 특징</strong>{item.suitability}</p>}
      {!!item.publicPartner?.categories.length && <p>{item.publicPartner.categories.join(' · ')}</p>}
      <div className={styles.services} aria-label="제공 서비스">{services.map(service => <span key={service}>{service}</span>)}</div>
      {!!item.publicPartner?.centers.length && <p className={styles.location}>{item.publicPartner.centers.map(c=>`${c.province} ${c.district} · 총 ${c.total||'확인 필요'} / 여유 ${c.spare||'확인 필요'} · ${c.checkedAt||'기준일 확인 필요'}`).join(' / ')}</p>}
      <dl className={styles.conditions}><div><dt>온도</dt><dd><TempChip value={item.temperature}/></dd></div><div><dt>수용</dt><dd>{item.available}</dd></div><div><dt>규모</dt><dd>{item.capacity}</dd></div></dl><p className={styles.disclaimer}>업체 등록 정보 · 지역별 서비스·온도·여유 물량은 견적 시 확인</p>
    </div>
    <div className={styles.actions}><strong>{item.price}</strong><Link className={styles.detail} href={listingHref(item)} aria-label={`${item.name} 상세보기`}>상세보기 <ArrowUpRight size={16}/></Link><CompareToggle id={item.id}/></div>
  </article>;
}
