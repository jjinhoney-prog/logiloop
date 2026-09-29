import { notFound } from 'next/navigation';
import { listings } from '@/lib/data';
import Detail from '@/components/detail';
export function generateStaticParams(){return listings.filter(i=>i.type==='partner').map(i=>({id:i.id}))}
export async function generateMetadata({params}){const {id}=await params;return {title:listings.find(i=>i.id===id)?.name||'물류사 상세'}}
export default async function Page({params}){const {id}=await params;const item=listings.find(i=>i.id===id&&i.type==='partner');if(!item)notFound();return <Detail item={item}/>}

export const dynamicParams = false;
