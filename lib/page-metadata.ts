import type { Metadata } from 'next';

/** 페이지별 검색 설명과 공유 정보를 동일한 원문으로 유지합니다. */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | 로지루프`, description, url: path, siteName: '로지루프', locale: 'ko_KR', type: 'website' },
    twitter: { card: 'summary', title: `${title} | 로지루프`, description },
  };
}
