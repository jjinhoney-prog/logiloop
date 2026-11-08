import {expect,test,vi} from 'vitest';
vi.mock('@/lib/supabase',()=>({db:()=>({})}));
import {approvalAccess,type PublicationRow} from '../../lib/request-store';
import {hashPartnerToken} from '../../lib/partner-document';
const token='a'.repeat(64);const row={approval_hash:hashPartnerToken(token),approval_expires_at:Date.now()+60000} as PublicationRow;
test('approval capability rejects missing, mismatched and expired links',()=>{expect(approvalAccess(row,token)).toBe(true);expect(approvalAccess(row,'b'.repeat(64))).toBe(false);expect(approvalAccess({...row,approval_hash:null},token)).toBe(false);expect(approvalAccess({...row,approval_expires_at:1},token)).toBe(false);expect(approvalAccess(row,'a')).toBe(false);});
