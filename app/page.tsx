import { pageMetadata } from '@/lib/page-metadata';
import Home from '@/components/home/home';
import type { Metadata } from 'next';

const homeMetadata = pageMetadata(
  '창고 임대·물류사 찾기',
  '로지루프(LogiLoop)는 지음부동산중개법인이 운영하는 창고·물류사 매칭 플랫폼입니다. 부산·김해·양산 창고 임대와 3PL 위탁 후보를 비교하고, 전국 희망 지역과 운영 조건으로 상담을 요청하세요.',
  '/',
);

// 루트 layout의 title.template은 같은 세그먼트의 홈페이지에 적용되지 않는다.
export const metadata: Metadata = {
  ...homeMetadata,
  title: { absolute: '로지루프 | 창고 임대·물류사 찾기' },
  openGraph: { ...homeMetadata.openGraph, title: '로지루프 | 창고 임대·물류사 찾기' },
  twitter: { ...homeMetadata.twitter, title: '로지루프 | 창고 임대·물류사 찾기' },
};

const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://logiloop.co.kr/#website',
  name: '로지루프',
  alternateName: ['LogiLoop', '로지루프 by 지음'],
  url: 'https://logiloop.co.kr/',
  inLanguage: 'ko-KR',
  description: homeMetadata.description,
  publisher: {
    '@type': 'Organization',
    name: '지음부동산중개법인',
    legalName: '지음부동산중개법인 주식회사',
    url: 'https://ziumrealty.com/',
  },
};

export default function Page() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, '\\u003c') }} />
    <Home />
  </>;
}
