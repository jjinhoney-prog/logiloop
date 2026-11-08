'use client';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import { deadlinePassed, emptyQuoteResponse, quoteRequestText, replyWindowLastDay, type QuoteResponse, type QuoteSpec } from '@/lib/quotes';
import { QuoteResponseFields } from './quote-fields';
import styles from './quote-fields.module.css';
type View = {id:string;partnerName:string;spec:QuoteSpec;revision:string;response:QuoteResponse|null};
export default function QuoteResponsePage() {
  const [view,setView]=useState<View|null>(null); const [response,setResponse]=useState(emptyQuoteResponse);
  const [error,setError]=useState(''); const [message,setMessage]=useState(''); const [pending,setPending]=useState(false);
  const credentials=useRef({id:'',token:''}); const busy=useRef(false);
  useEffect(()=>{
    let controller: AbortController;
    async function load(){
      controller?.abort(); controller=new AbortController(); const signal=controller.signal;
      const [id,token]=window.location.hash.slice(1).split('.'); credentials.current={id,token};
      setView(null);setResponse(emptyQuoteResponse());setError('');setMessage('');
      try {const result=await fetch('/api/quote/respond',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,token,action:'load'}),cache:'no-store',signal});const data=await result.json();if(!result.ok)throw new Error(data.error);if(!signal.aborted){setView(data);setResponse(data.response??emptyQuoteResponse());}}
      catch(err){if(!signal.aborted)setError(err instanceof Error?err.message:'불러오지 못했습니다.');}
    }
    void load(); const changed=()=>{void load();};window.addEventListener('hashchange',changed);
    return ()=>{controller?.abort();window.removeEventListener('hashchange',changed);};
  },[]);
  async function submit(e:FormEvent){e.preventDefault();if(busy.current||!view)return;busy.current=true;setPending(true);setError('');setMessage('');const identity={...credentials.current};
    try{const result=await fetch('/api/quote/respond',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...identity,action:'save',revision:view.revision,response})});const data=await result.json();if(!result.ok)throw new Error(data.error);if(credentials.current.id!==identity.id||credentials.current.token!==identity.token)return;setView(data);setResponse(data.response);setMessage('견적 회신을 저장했습니다. 지음 담당자가 검토합니다.');}
    catch(err){setError(err instanceof Error?err.message:'저장하지 못했습니다.');}finally{busy.current=false;setPending(false);}
  }
  return <div className="page partner-page"><h1>견적 회신</h1><p>해당 업체 담당자만 사용하는 비공개 링크입니다. 계약 체결이 아닌 조건 검토용 견적입니다.</p>{error&&<p role="alert" className="field-error">{error}</p>}{view?<><h2>{view.partnerName}</h2>{deadlinePassed(view.spec.deadline)&&<p className={styles.late} role="note">회신기한({view.spec.deadline})이 지났습니다. {replyWindowLastDay(view.spec.deadline)}까지 이 링크로 회신하면 비교에 반영되며, 기한 후 회신으로 표시됩니다.</p>}<pre className="quote-summary">{quoteRequestText(view.id,view.partnerName,view.spec)}</pre><form onSubmit={submit} className="panel partner-form"><fieldset disabled={pending} className="partner-form-body"><QuoteResponseFields supplier spec={view.spec} value={response} onChange={setResponse}/></fieldset><p role="status">{message}</p><button className="button button-yellow" disabled={pending}>{pending?'저장 중…':'견적 회신 저장'}</button></form></>:!error&&<p role="status">요청을 불러오는 중…</p>}</div>;
}
