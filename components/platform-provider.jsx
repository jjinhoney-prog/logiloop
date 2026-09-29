'use client';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { toggleSelection } from '@/lib/logic.mjs';
import { listings } from '@/lib/data';
const Context = createContext(null);
export function PlatformProvider({ children }) {
 const [selected, setSelected] = useState([]); const selectionRef = useRef([]); selectionRef.current = selected; const [ready,setReady] = useState(false); const [notice, setNotice] = useState('');
 useEffect(() => { try { const saved = JSON.parse(localStorage.getItem('logiloop:compare') || '[]'); if (Array.isArray(saved)) setSelected([...new Set(saved.filter(id => listings.some(item=>item.id===id)))].slice(0,3)); } catch {} setReady(true); }, []);
 useEffect(()=>{ if(ready) {try{localStorage.setItem('logiloop:compare',JSON.stringify(selected))}catch{}} },[selected,ready]);
 useEffect(()=>{if(notice){const timer=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(timer)}},[notice]);
 useEffect(() => {
  if (!ready || !document.modelContext?.registerTool) return;
  const lifecycle = new AbortController();
  const register = tool => {
   try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {}
  };
  register({ name: 'read_comparison_candidates', description: 'Read the fictional catalog and current browser-local comparison selection. No quotes or customer data.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => ({ exampleData: true, selectedIds: selectionRef.current, candidates: listings.map(({ id, name, region, type, temperature }) => ({ id, name, region, type, temperature })) }) });
  register({ name: 'set_comparison_candidates', description: 'Replace the visible browser-local comparison selection with up to three fictional catalog IDs. Does not submit an inquiry.', inputSchema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' }, maxItems: 3, uniqueItems: true } }, required: ['ids'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: input => {
   if (!input || !Array.isArray(input.ids) || input.ids.length > 3 || new Set(input.ids).size !== input.ids.length || input.ids.some(id => !listings.some(item => item.id === id))) throw new Error('Provide up to three unique catalog IDs.');
   flushSync(() => setSelected([...input.ids]));
   return { selectedIds: [...selectionRef.current], savedIn: 'this browser only', inquirySubmitted: false };
  } });
  return () => lifecycle.abort();
 }, [ready]);
 function toggle(id){ if(!selected.includes(id)&&selected.length>=3){setNotice('비교 후보는 최대 3개까지 담을 수 있습니다.');return} setSelected(prev=>toggleSelection(prev,id)); }
 return <Context.Provider value={{ selected, toggle, clear:()=>setSelected([]), ready, notify:setNotice }}>{children}<div role="status" className={notice?'toast visible':'toast'}>{notice}</div></Context.Provider>;
}
export const usePlatform = () => useContext(Context);
