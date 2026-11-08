'use client';
import {useState} from 'react';
export default function PartnerGallery({photos}:{photos:{url:string;caption:string}[]}){
 const [failed,setFailed]=useState<string[]>([]);
 if(!photos.length)return null;
 return <section className="panel"><h2>업체 제공 현장·작업 사진</h2><p className="muted">업체가 게시를 허용한 자료입니다. 현재 시설·작업 조건은 상담 시 다시 확인합니다.</p><div className="partner-gallery">{photos.map((p,i)=><figure key={`${p.url}-${i}`}>{failed.includes(p.url)?<p>사진을 불러오지 못했습니다.</p>:
 // eslint-disable-next-line @next/next/no-img-element
 <img src={p.url} alt={p.caption||`업체 제공 작업 사진 ${i+1}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(v=>[...v,p.url])}/>}
 <figcaption>{p.caption||'업체 제공 사진'}</figcaption></figure>)}</div></section>;
}
