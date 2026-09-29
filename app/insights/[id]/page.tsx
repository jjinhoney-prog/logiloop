import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { articles } from '@/lib/data';

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((a) => ({ id: a.id }));
}

export async function generateMetadata(props: PageProps<'/insights/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  return { title: articles.find((a) => a.id === id)?.title || '물류 가이드' };
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
      <div className="article-cta">
        <h2>우리 회사 조건으로 정리해 볼까요?</h2>
        <p>아직 정해지지 않은 항목은 상담하면서 확인할 수 있습니다.</p>
        <Link className="button button-dark" href="/consultation">
          상담 준비하기
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
