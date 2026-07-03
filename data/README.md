# mountains.json 데이터 구조

산 20개 정보를 줄 때 아래 필드를 맞춰주면 사이트에 바로 적용하기 쉽습니다. 빈 값은 나중에 채워도 됩니다.

- id: 영문/소문자 고유값 예: gwanaksan
- name: 산/코스 이름
- region: 필터용 지역 예: 서울, 경기, 강원, 충청, 전라, 경상, 제주
- province: 상세 행정구역
- height: 높이 숫자(m)
- bac: BAC 100대 명산 여부 true/false
- level: 초급/중급/고급
- time, hours, distance, elevation
- rating: 임시 평점
- lat, lon: 지도/날씨용 좌표
- summary, desc
- recommendedFor: 추천 대상 배열
- transport: 출발지 가는 방법
- facilities: toilet, convenienceStore, dustCleaner, parking, water, busStop
- course: start, mid, summit, end
- sections: 구간별 후기 배열 [{title, body}]
- photoSpots, supplies, cautions: 배열
- hardSection, reviewSummary
