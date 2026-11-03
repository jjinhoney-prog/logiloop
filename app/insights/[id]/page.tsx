import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { articles } from '@/lib/data';
import { pageMetadata } from '@/lib/page-metadata';
import { warehouseRegions, warehouseRegionHref } from '@/lib/warehouse-regions';
import styles from '@/components/catalog/region-guide.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((a) => ({ id: a.id }));
}

export async function generateMetadata(props: PageProps<'/insights/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  const article = articles.find((a) => a.id === id);
  if (!article) notFound();
  return pageMetadata(article.title, article.description, `/insights/${article.id}`);
}

export default async function Page(props: PageProps<'/insights/[id]'>) {
  const { id } = await props.params;
  const article = articles.find((a) => a.id === id);
  if (!article) notFound();
  return (
    <article className="page article-page">
      <Link className="back-link" href="/insights">
        <ArrowLeft size={16} />
        물류 가이드
      </Link>
      <header>
        <span className="eyebrow">
          {article.category} · {article.read} 읽기
        </span>
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <div className="article-byline">
          로지루프 에디터 <span>·</span> 전략백서 v1.3 기반
        </div>
      </header>
      <div className="article-content">
        {article.sections.map(([title, body], i) => (
          <section key={title}>
            <span>0{i + 1}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
      <nav aria-label="가이드와 함께 볼 창고·물류사" className={styles.navigation}>
        <Link href="/warehouses">창고·물류센터 전체 보기</Link>
        {warehouseRegions.map((region) => (
          <Link key={region.slug} href={warehouseRegionHref(region.slug)}>{region.name} 창고 임대</Link>
        ))}
        {article.id === 'lease-or-3pl' && <Link href="/partners">물류사·3PL 후보 보기</Link>}
      </nav>
      <div className="article-cta">
        <h2>우리 회사 조건으로 정리해 볼까요?</h2>
        <p>아직 정해지지 않은 항목은 상담하면서 확인할 수 있습니다.</p>
        <Link className="button button-dark" href={`/consultation?${new URLSearchParams({ situation: article.requestSituation, service: article.title }).toString()}`}>
          {article.requestLabel}
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
