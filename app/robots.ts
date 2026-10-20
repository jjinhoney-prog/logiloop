import type { MetadataRoute } from 'next';

// 본 사이트는 layout의 noindex로 검색에서 빼고, /blog(인블로그)만 색인 대상으로 알린다.
// noindex를 크롤러가 읽을 수 있도록 크롤링 자체는 막지 않는다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: 'https://logiloop.co.kr/blog/sitemap.xml',
  };
}
