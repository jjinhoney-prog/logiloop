export interface OfficialPartnerMedia {
  logo: {url:string;sourceUrl:string};
  photos: {url:string;caption:string;sourceUrl:string;width:number;height:number}[];
}
/** Reviewed official public sources. This does not assert a separate supplier permission. */
export const officialPartnerMedia: Record<string,OfficialPartnerMedia> = {
  "registered-partner-6": {
    "logo": {
      "url": "/partners/hslnc/logo.png",
      "sourceUrl": "https://m.blog.naver.com/hslnc"
    },
    "photos": [
      {
        "url": "/partners/hslnc/mieum.jpg",
        "caption": "부산 미음센터",
        "sourceUrl": "http://xn--392b00jfkj6m23aizwp0p.kr/theme/theme04/company/bu_02.php",
        "width": 1203,
        "height": 787
      },
      {
        "url": "/partners/hslnc/yeongjong-1.jpg",
        "caption": "인천 영종 1센터",
        "sourceUrl": "http://xn--392b00jfkj6m23aizwp0p.kr/theme/theme04/company/bu_02.php",
        "width": 1203,
        "height": 787
      },
      {
        "url": "/partners/hslnc/yeongjong-2.jpg",
        "caption": "인천 영종 2센터",
        "sourceUrl": "http://xn--392b00jfkj6m23aizwp0p.kr/theme/theme04/company/bu_02.php",
        "width": 1204,
        "height": 444
      }
    ]
  }
};
