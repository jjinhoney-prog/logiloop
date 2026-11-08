import type { Metadata } from 'next';
import QuoteReportPage from '@/components/quotes/quote-report';
export const metadata: Metadata = { title: '3PL 비교 리포트', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <QuoteReportPage />; }
