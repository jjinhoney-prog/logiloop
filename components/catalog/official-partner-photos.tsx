'use client';
import {useState} from 'react';
import {officialPartnerMedia} from '@/lib/official-partner-media';
import styles from './official-partner-photos.module.css';
export default function OfficialPartnerPhotos({id,compact=false}:{id:string;compact?:boolean}) {
  const media=officialPartnerMedia[id];
  const [failed,setFailed]=useState<string[]>([]);
  if(!media?.photos.length)return null;
  return <section className={compact?styles.compact:styles.gallery} aria-label="업체 현장 사진">
    <h3>업체 현장 사진</h3>
    <div className={styles.photos}>{media.photos.map(photo=><figure key={photo.url}>
      <a href={photo.url} target="_blank" rel="noopener noreferrer" aria-label={`${photo.caption} 크게 보기 (새 창)`}>
        {failed.includes(photo.url)?<span className={styles.failed}>사진을 불러오지 못했습니다</span>:
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.url} width={photo.width} height={photo.height} alt={photo.caption} loading="lazy" decoding="async" onError={()=>setFailed(v=>[...v,photo.url])}/>}
      </a><figcaption>{photo.caption} <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">출처<span className={styles.srOnly}>: 공식 게시물 (새 창)</span></a></figcaption>
    </figure>)}</div><p>공식 홈페이지·블로그 공개 자료 · 현재 시설과 운영 조건은 견적 시 확인합니다.</p>
  </section>;
}
