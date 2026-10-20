import type { Metadata, Viewport } from 'next';
import { Manrope, Noto_Sans_KR } from 'next/font/google';
import { Providers } from '@/components/providers';
import Shell from '@/components/shell/shell';
import './globals.css';
import { FunnelObserver } from '@/components/analytics/funnel-observer';

// 빌드 시 내려받아 자체 호스팅한다. 방문자 브라우저는 Google Fonts에 요청하지 않는다.
// adjustFontFallback 끔: 자동 생성되는 'Manrope Fallback'(Arial)이 ↔·→ 같은 기호를 가로채
// Noto Sans KR보다 먼저 그리는 것을 막아 기존 글꼴 순서(Manrope → Noto Sans KR)를 유지한다.
// 주의: 16.3.7 기준 webpack 빌드에서만 적용되고 Turbopack 빌드는 이 옵션을 무시한다(화살표 기호만 Arial 모양).
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap', adjustFontFallback: false });
// 한글 글리프는 unicode-range 조각으로 필요한 만큼만 로드된다(한글 subset 프리로드 없음).
const notoSansKr = Noto_Sans_KR({ subsets: ['latin'], variable: '--font-noto-kr', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: { default: '로지루프 | 화주를 위한 창고·물류사 찾기', template: '%s | 로지루프' },
  description: '지음부동산중개법인이 운영하는 로지루프. 화주의 조건을 정리하고 창고·물류사 후보와 운영방식을 비교합니다. 전국 희망 지역과 조건에 맞는 창고·물류사 후보를 검토합니다.',
  robots: { index: false, follow: false },
};

// 다크모드 기기에서도 밝은 화면으로 렌더링한다(globals.css의 color-scheme과 같은 값).
export const viewport: Viewport = { colorScheme: 'only light' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${manrope.variable} ${notoSansKr.variable}`}>
      <body>
        <Providers>
          <FunnelObserver />
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
