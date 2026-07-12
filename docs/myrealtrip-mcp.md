# MyRealTrip MCP 확인 기록

확인일: 2026-07-12

확인 방법:
- 연결된 MCP 도구 검색으로 `mcp__myrealtrip` 네임스페이스의 도구 목록과 입력 스키마를 확인했다.
- `mcp__myrealtrip.searchTnas`를 실제 호출해 서울 투어 3건 검색 응답을 확인했다.
- 웹사이트 코드와 환경변수는 수정하지 않았다.

## 사용 가능한 MCP 도구

연결된 `mcp__myrealtrip` 네임스페이스에서 확인된 도구는 다음 11개다.

| 도구 이름 | 용도 |
| --- | --- |
| `mcp__myrealtrip.getCategoryList` | 도시별 투어/액티비티 카테고리 조회 |
| `mcp__myrealtrip.getTnaOptions` | 특정 날짜의 투어/액티비티 옵션, 가격, 예약 가능 여부 조회 |
| `mcp__myrealtrip.getTnaDetail` | 투어/액티비티 상세 정보 조회 |
| `mcp__myrealtrip.searchTnas` | 투어, 티켓, 액티비티 검색 |
| `mcp__myrealtrip.searchStays` | 숙소 검색 |
| `mcp__myrealtrip.getCurrentTime` | 현재 KST 시간 조회 |
| `mcp__myrealtrip.getStayDetail` | 숙소 상세, 객실, 가격, 편의시설, 리뷰 조회 |
| `mcp__myrealtrip.getPromotionAirlines` | 항공사 프로모션 조회 |
| `mcp__myrealtrip.searchInternationalFlights` | 한국 출발 해외 항공권 검색 |
| `mcp__myrealtrip.searchDomesticFlights` | 국내선 항공권 검색 |
| `mcp__myrealtrip.flightsFareCalendar` | 항공 최저가 캘린더 조회 |

## 입력값 스키마

아래 필수/선택 구분은 MCP 도구 설명과 노출된 스키마 주석에 표시된 내용을 기준으로 정리했다. 일부 항공 도구는 타입 표기상 `?`가 붙어 있지만 설명에는 `Required`로 표시되어 있어, 설명의 `Required` 표기를 함께 기록했다.

### `mcp__myrealtrip.getCategoryList`

필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `city` | `string` | 카테고리를 조회할 도시명 |

선택 입력값: 없음

### `mcp__myrealtrip.getTnaOptions`

필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `gid` | `string` | `searchTnas` 결과의 상품 ID |
| `selectedDate` | `string` | 예약 날짜, `YYYY-MM-DD` 형식 |
| `url` | `string` | `searchTnas` 결과의 상품 URL |

선택 입력값: 없음

### `mcp__myrealtrip.getTnaDetail`

필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `gid` | `string` | `searchTnas` 결과의 상품 ID |
| `url` | `string` | `searchTnas` 결과의 상품 URL |

선택 입력값: 없음

### `mcp__myrealtrip.searchTnas`

필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `query` | `string` | 검색 키워드. 한국어 키워드 사용 권장 |

선택 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `category` | `string` | `getCategoryList`의 `categories[].value` 값 |
| `page` | `number` | 페이지 번호 |
| `perPage` | `number` | 페이지당 결과 수, 최대 100 |
| `sort` | `string` | 정렬. 예: `price_asc`, `review_score_desc`, `selling_count_desc` |

### `mcp__myrealtrip.searchStays`

필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `checkIn` | `string` | 체크인 날짜, `YYYY-MM-DD` 형식 |
| `checkOut` | `string` | 체크아웃 날짜, `YYYY-MM-DD` 형식 |
| `keyword` | `string` | 검색 키워드 |

선택 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `adultCount` | `number` | 성인 인원 수 |
| `childCount` | `number` | 아동 인원 수 |
| `freeCancellation` | `boolean` | 무료 취소 가능 숙소만 검색 |
| `includeBreakfast` | `boolean` | 조식 포함 숙소만 검색 |
| `isDomestic` | `boolean` | 국내 여부 |
| `maxPrice` | `number` | 최대 가격 |
| `minPrice` | `number` | 최소 가격 |
| `minReviewRating` | `number` | 최소 리뷰 평점 |
| `order` | `"recommended" \| "price_asc" \| "price_desc" \| "discount_rate_desc"` | 정렬 |
| `page` | `number` | 페이지 번호 |
| `services` | `Array<"WIFI" \| "PARKING" \| "LAUNDARY" \| "SPA_SAUNA" \| "FITNESS" \| "POOL" \| "BARBECUE" \| "PET">` | 시설/서비스 필터 |
| `starRatings` | `Array<"fivestar" \| "fourstar" \| "threestar" \| "twostar" \| "onestar">` | 호텔 성급 필터 |
| `stayTypes` | `Array<"HOTELS" \| "BNB_V2" \| "HOSTELS" \| "TRADITIONAL_ACCOMMODATION" \| "MOTELS" \| "RESORTS" \| "PENSION_PRIVATEHOUSE">` | 숙소 유형 |

### `mcp__myrealtrip.getCurrentTime`

필수 입력값: 없음

선택 입력값: 없음

### `mcp__myrealtrip.getStayDetail`

필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `checkIn` | `string` | 체크인 날짜, `YYYY-MM-DD` 형식 |
| `checkOut` | `string` | 체크아웃 날짜, `YYYY-MM-DD` 형식 |
| `gid` | `number` | `searchStays` 결과의 숙소 GID |

선택 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `adultCount` | `number` | 성인 수 |
| `childCount` | `number` | 아동 수 |

### `mcp__myrealtrip.getPromotionAirlines`

필수 입력값: 없음

선택 입력값: 없음

### `mcp__myrealtrip.searchInternationalFlights`

도구 설명상 필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `origin` | `string` | 출발 공항 IATA 코드 |
| `destination` | `any` | 도착지 |
| `departDate` | `string` | 출발일, `YYYYMMDD` 또는 `YYYY-MM-DD` |

선택 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `cabinClass` | `"ECONOMY" \| "BUSINESS" \| "FIRST"` | 좌석 등급 |
| `directFlightOnly` | `boolean` | 직항만 검색 |
| `maxResults` | `integer` | 최대 결과 수, 기본 5, 최대 250 |
| `passengers` | `{ adults?: integer; children?: integer; infants?: integer }` | 탑승객 수 |
| `preferredAirline` | `string` | 선호 항공사 코드 |
| `returnDate` | `any` | 귀국일 |
| `tripType` | `"ONE_WAY" \| "ROUND_TRIP"` | 여정 유형 |

### `mcp__myrealtrip.searchDomesticFlights`

도구 설명상 필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `origin` | `string` | 출발 공항 코드 |
| `destination` | `any` | 도착지 |
| `departDate` | `string` | 출발일, `YYYYMMDD` 또는 `YYYY-MM-DD` |

선택 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `cabinClass` | `"ECONOMY" \| "BUSINESS"` | 좌석 등급 |
| `maxResults` | `integer` | 최대 결과 수, 기본 10, 최대 100 |
| `passengers` | `{ adults?: integer; children?: integer }` | 탑승객 수 |
| `returnDate` | `any` | 귀국일 |
| `tripType` | `"ONE_WAY" \| "ROUND_TRIP"` | 여정 유형 |

### `mcp__myrealtrip.flightsFareCalendar`

도구 설명상 필수 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `from` | `string` | 출발 공항 IATA 코드 |
| `to` | `any` | 도착지 |
| `departureDate` | `string` | 출발일, `YYYYMMDD` 또는 `YYYY-MM-DD` |

선택 입력값:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| `airlines` | `string[]` | 항공사 코드 목록. `["*"]`는 전체 |
| `international` | `boolean` | 국제선 여부 |
| `maxResults` | `integer` | 반환할 최대 결과 수 |
| `period` | `integer` | 여행 기간 |
| `transfer` | `integer` | 경유 횟수 |

## `searchTnas` 상품 검색 응답 필드

실제 `mcp__myrealtrip.searchTnas` 응답은 최상위에 `widget`, `name`, `copy_text`를 포함했다. 상품별 데이터는 `widget.children[]`의 `ListViewItem` 내부 UI 구조로 제공되었다.

확인된 최상위 필드:

| 필드 | 확인된 값/형태 |
| --- | --- |
| `widget.type` | `"ListView"` |
| `widget.children[]` | 상품 카드 목록 |
| `widget.limit` | `10` |
| `name` | `"myrealtrip"` |
| `copy_text` | 검색 결과 요약 문자열 |

상품별 주요 필드와 실제 위치:

| 항목 | 실제 응답 필드/위치 | 비고 |
| --- | --- | --- |
| 상품 ID | 별도 필드명 없음 | 상품 링크의 `/products/{id}` 또는 `/offers/{id}` 경로에서 확인 가능 |
| 상품명 | `widget.children[].children[].children[].children[].children[].children[].children[].value` 형태의 `Text.value` | UI 트리 안에서 `weight: "bold"`인 텍스트로 확인됨 |
| 가격 | 상품 카드 내부 가격 `Text.value` | 예: `"16,000원~"` |
| 이미지 | 상품 카드 내부 `Image.src` | 이미지 URL |
| 평점 | 상품 카드 내부 평점 `Text.value` | 예: `"⭐ 4.1 (185)"` |
| 지역 | 별도 필드명 없음 | 상품명에 `[서울/야간]`처럼 포함되는 경우만 확인됨 |
| 상품 링크 | `widget.children[].onClickAction.url`, 버튼의 `onClickAction.url`, `payload.target.url` | 같은 상품 링크가 카드와 예약 버튼에 반복 제공됨 |

주의:
- `searchTnas` 설명에는 `getTnaDetail`과 `getTnaOptions` 입력으로 `gid`를 사용한다고 되어 있으나, 이번 `searchTnas` 실제 응답에서는 `gid`라는 별도 필드는 보이지 않았다.
- 가격은 검색 응답 설명상 시작가다. 날짜별 실제 옵션 가격은 `getTnaOptions`로 확인해야 한다.
- 지역은 별도 구조화 필드로 확인되지 않았다.

## 서울 투어 3개 실제 검색 확인

호출한 도구:

```json
{
  "tool": "mcp__myrealtrip.searchTnas",
  "input": {
    "query": "서울 투어",
    "sort": "recommended",
    "page": 1,
    "perPage": 3
  }
}
```

연결 상태: 정상. `widget` 목록과 `copy_text`가 반환되었다.

검색 결과 3건:

| 상품 ID | 상품명 | 가격 | 이미지 | 평점 | 지역 | 상품 링크 |
| --- | --- | --- | --- | --- | --- | --- |
| `3885005` | `[키즈][서울/야간] 우리가족 서울나들이 서울시티투어 야경버스` | `16,000원~` | `https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2024/11/27/htS4/RofIPxpQtg.jpg?width=480&quality=70` | `⭐ 4.1 (185)` | 별도 필드 없음. 상품명에 `[서울/야간]` 포함 | `https://experiences.myrealtrip.com/products/3885005` |
| `3880354` | `[아이와함께] 국립중앙박물관 원데이 도슨트 투어` | `27,900원~` | `https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2024/11/25/lMp7/gKBg1dOBe7.jpg?width=480&quality=70` | `⭐ 4.9 (246)` | 별도 필드 없음 | `https://experiences.myrealtrip.com/products/3880354` |
| `3885006` | `[키즈][서울/주간] 우리가족 서울나들이    서울시티투어 순환버스 ` | `19,000원~` | `https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2024/11/27/033P/4FpzIqNOGw.jpg?width=480&quality=70` | `⭐ 4 (34)` | 별도 필드 없음. 상품명에 `[서울/주간]` 포함 | `https://experiences.myrealtrip.com/products/3885006` |
