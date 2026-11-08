import { validDate } from './quotes';
import { partnerCategories } from './partner-brand';
import { partnerTemperatures, partnerServices } from './partner-profile';
export interface PublicCenter {
  province:string; district:string; temperatures:string[]; services:string[];
  total?:string; spare?:string; availableAt?:string; checkedAt?:string;
}
export interface PublicPartner { categories:string[]; temperatures:string[]; centers:PublicCenter[]; photos?:{url:string;caption:string;permissionConfirmed:boolean}[] }
export const detailedAddress = /\d+\s*번지|\d+\s*번길|[가-힣\d]+(?:로|길)\s*\d+/;
export function normalizePublicPartner(input:unknown):PublicPartner {
  const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
  const text=(v:unknown,max=80)=>{if(v===undefined)return '';if(typeof v!=='string'||v.length>max||detailedAddress.test(v))throw new Error('공개 센터 정보는 상세 주소 없이 권역·조건만 입력하세요.');return v.trim();};
  const choices=(v:unknown,options:readonly string[])=>{if(v===undefined)return [];if(!Array.isArray(v)||v.length>options.length||v.some(x=>typeof x!=='string'||!options.includes(x)))throw new Error('공개 품목·온도·작업을 확인하세요.');return [...new Set(v)] as string[];};
  const raw=obj(input);
  if(raw.centers!==undefined&&(!Array.isArray(raw.centers)||raw.centers.length>10))throw new Error('공개 센터는 최대 10곳입니다.');
  if(raw.photos!==undefined&&(!Array.isArray(raw.photos)||raw.photos.length>8))throw new Error('사진은 최대 8장입니다.');
  const photos=((raw.photos as unknown[]|undefined)??[]).map(v=>{const p=obj(v);if(p.permissionConfirmed!==true)throw new Error('사진의 게시 허락을 확인하세요.');const url=text(p.url,500);try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error();}catch{throw new Error('사진 이미지 주소를 확인하세요.');}return {url,caption:text(p.caption,100),permissionConfirmed:true};});
  return {photos,categories:choices(raw.categories,partnerCategories),temperatures:choices(raw.temperatures,partnerTemperatures),centers:((raw.centers as unknown[]|undefined)??[]).map(v=>{const c=obj(v);const center:PublicCenter={province:text(c.province,20),district:text(c.district,60),temperatures:choices(c.temperatures,partnerTemperatures),services:choices(c.services,partnerServices),total:text(c.total),spare:text(c.spare),availableAt:text(c.availableAt),checkedAt:text(c.checkedAt,10)};
    if(!center.province||!center.temperatures.length||!center.services.length)throw new Error('센터별 지역·온도·작업을 입력하세요.');
    if(center.checkedAt&&!validDate(center.checkedAt))throw new Error('확인일을 입력하세요.');return center;})};
}
