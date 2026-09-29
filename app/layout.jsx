import './globals.css';
import Shell from '@/components/shell';
import { PlatformProvider } from '@/components/platform-provider';
export const metadata={ title:{default:'로지루프 | 전국 물류거점 비교',template:'%s | 로지루프'}, description:'물류사 후보 연결부터 창고 직접 임차·3PL 위탁·혼합 운영 비교까지. 전국 물류거점 상담 플랫폼.', robots:{index:false,follow:false} };
export default function RootLayout({children}){return <html lang="ko"><body><PlatformProvider><Shell>{children}</Shell></PlatformProvider></body></html>}
