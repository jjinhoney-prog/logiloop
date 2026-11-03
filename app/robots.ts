import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    // 관리자 페이지의 noindex를 읽을 수 있도록 페이지 크롤링은 허용한다.
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: [
      'https://logiloop.co.kr/sitemap.xml',
      'https://logiloop.co.kr/blog/sitemap.xml',
    ],
  };
}
