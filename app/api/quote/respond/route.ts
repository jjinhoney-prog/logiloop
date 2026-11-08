import { partnerBody, partnerJson } from '@/lib/partner-http';
import { normalizeSupplierResponse } from '@/lib/quotes';
import { canReadQuote, patchQuote, QuoteConflict, quoteIdValid, readQuote, supplierQuoteView } from '@/lib/quote-store';
export async function POST(request: Request) {
  const parsed = await partnerBody(request,'quote');
  if (parsed.response) return parsed.response;
  const body = parsed.body!;
  if (!quoteIdValid(body.id) || typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return partnerJson({error:'유효한 회신 링크가 아닙니다.'},401);
  if (!['load','save'].includes(String(body.action))) return partnerJson({error:'요청을 확인하세요.'},400);
  try {
    const row = await readQuote(body.id);
    if (!row || !canReadQuote(row,body.token)) return partnerJson({error:'링크가 만료·종결되었거나 아직 전달 처리되지 않았습니다. 지음 담당자에게 확인해 주세요.'},401);
    if (body.action === 'load') return partnerJson({ok:true,...supplierQuoteView(row)});
    if (body.revision !== row.revision) return partnerJson({error:'회신이 변경되었습니다. 입력 내용을 보관하고 최신 내용을 다시 불러오세요.'},409);
    let response;
    try { response = normalizeSupplierResponse(body.response, row.spec); }
    catch(err) { return partnerJson({error:err instanceof Error ? err.message : '입력을 확인하세요.'},400); }
    const saved = await patchQuote(row,{response,state:'회신 완료',replied_at:new Date().toISOString()});
    return partnerJson({ok:true,...supplierQuoteView(saved)});
  } catch(err) { return partnerJson({error:err instanceof QuoteConflict ? err.message : '저장 또는 조회에 실패했습니다.'},err instanceof QuoteConflict ? 409 : 502); }
}
