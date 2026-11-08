import {describe,it,expect} from 'vitest';
import {normalizeOperatingRegions,operatingRegionLabel} from '@/lib/partner-regions';
import {filterListings} from '@/lib/logic';
import {partnerListingDraft} from '@/lib/partner-listing';
import {emptyPartner} from '@/lib/partner-profile';
describe('public operating regions',()=>{
 const regions=[{province:'부산',district:'강서구 미음동'},{province:'인천',district:'영종'},{province:'인천',district:'중구'}];
 const item={id:'multi',type:'partner' as const,name:'멀티 물류',region:'부산',province:'부산',district:'미음동',temperature:'상온',service:'보관',tags:[],operatingRegions:regions};
 it('matches secondary region and searchable area while preserving warehouse geography',()=>{expect(filterListings([item],{region:'인천'})).toHaveLength(1);expect(filterListings([item],{query:'영종'})).toHaveLength(1);expect(filterListings([item],{region:'서울'})).toHaveLength(0);expect(filterListings([{...item,type:'warehouse'}],{region:'인천'})).toHaveLength(0);});
 it('carries all registered regions into the public draft without contacts',()=>{const draft=partnerListingDraft(6,{...emptyPartner(),regions,name:'private contact',phone:'01012345678'});expect(draft.operatingRegions).toEqual(regions);expect(JSON.stringify(draft)).not.toContain('private contact');});
 it('rejects precise addresses and malformed data, deduplicates and supports old records',()=>{expect(normalizeOperatingRegions(undefined)).toEqual([]);expect(normalizeOperatingRegions([...regions,regions[0]])).toHaveLength(3);expect(()=>normalizeOperatingRegions([{province:'부산',district:'미음로 100'}])).toThrow();expect(()=>normalizeOperatingRegions([{province:'부산'}])).toThrow();expect(operatingRegionLabel({province:'부산',district:'부산 강서구'})).toBe('부산 강서구');});
});
