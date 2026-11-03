import {expect,test} from 'vitest';
import {filterListings} from '../../lib/logic';
import {normalizePublicPartner} from '../../lib/public-partner';
const item={id:'test',type:'partner' as const,name:'테스트',region:'경남',district:'김해',temperature:'복수 온도대',tags:[],service:'보관',publicPartner:{categories:['식품'],temperatures:['냉장','냉동'],centers:[{province:'경남',district:'김해',temperatures:['냉장'],services:['보관']},{province:'부산',district:'강서구',temperatures:['냉동'],services:['보관']}]}};
test('multiple temperatures and categories are searchable',()=>{
 expect(filterListings([item],{temperature:'냉장',category:'식품'})).toHaveLength(1);
 expect(filterListings([item],{query:'식품'})).toHaveLength(1);
});
test('region and temperature must match the same center',()=>{
 expect(filterListings([item],{region:'부산',temperature:'냉장'})).toHaveLength(0);
 expect(filterListings([item],{region:'부산',temperature:'냉동'})).toHaveLength(1);
});
test('public projection rejects unknown fields and detailed center addresses',()=>{
 expect(()=>normalizePublicPartner({categories:['식품'],temperatures:['냉장'],centers:[{province:'부산',district:'신항북로 50',temperatures:['냉장'],services:['보관']}]})).toThrow();
 const publicData=normalizePublicPartner({...item.publicPartner,phone:'01012345678',secret:'private'});
 expect(JSON.stringify(publicData)).not.toContain('private');expect(publicData).not.toHaveProperty('phone');
});
test('supplier photos require explicit permission and safe image links',()=>{
 expect(()=>normalizePublicPartner({photos:[{url:'https://example.com/photo.jpg',caption:'작업장',permissionConfirmed:false}]})).toThrow();
 expect(()=>normalizePublicPartner({photos:[{url:'javascript:alert(1)',caption:'작업장',permissionConfirmed:true}]})).toThrow();
 const result=normalizePublicPartner({photos:[{url:'https://example.com/photo.jpg',caption:'작업장',permissionConfirmed:true,privateNote:'비공개'}]});
 expect(result.photos).toHaveLength(1);expect(JSON.stringify(result)).not.toContain('비공개');
});
