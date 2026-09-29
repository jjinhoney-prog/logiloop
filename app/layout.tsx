import type { Metadata } from 'next';
import { Manrope, Noto_Sans_KR } from 'next/font/google';
import { Providers } from '@/components/providers';
import Shell from '@/components/shell/shell';
import './globals.css';

// 빌드 시 내려받아 자체 호스팅한다. 방문자 브라우저는 Google Fonts에 요청하지 않는다.
// adjustFontFallback 끔: 자동 생성되는 'Manrope Fallback'(Arial)이 ↔·→ 같은 기호를 가로채
// Noto Sans KR보다 먼저 그리는 것을 막아 기존 글꼴 순서(Manrope → Noto Sans KR)를 유지한다.
// 주의: 16.3.7 기준 webpack 빌드에서만 적용되고 Turbopack 빌드는 이 옵션을 무시한다(화살표 기호만 Arial 모양).
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap', adjustFontFallback: false });
// 한글 글리프는 unicode-range 조각으로 필요한 만큼만 로드된다(한글 subset 프리로드 없음).
const notoSansKr = Noto_Sans_KR({ subsets: ['latin'], variable: '--font-noto-kr', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: { default: '로지루프 | 전국 물류거점 비교', template: '%s | 로지루프' },
  description: '물류사 후보 연결부터 창고 직접 임차·3PL 위탁·혼합 운영 비교까지. 전국 물류거점 상담 플랫폼.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${manrope.variable} ${notoSansKr.variable}`}>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
