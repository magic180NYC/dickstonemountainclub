
let mountains=[];
async function loadMountains(){
  try{
    const res=await fetch('data/mountains.json',{cache:'no-store'});
    mountains=await res.json();
  }catch(e){
    console.warn('산 데이터 파일을 불러오지 못했습니다.',e);
  }
}
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function toast(msg){let el=$('.toast');if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function getSaved(){return JSON.parse(localStorage.getItem('dmc.saved')||'[]')}function setSaved(v){localStorage.setItem('dmc.saved',JSON.stringify(v));updateSavedCounts()}function isSaved(id){return getSaved().includes(id)}function toggleSave(id){const s=getSaved();const next=s.includes(id)?s.filter(x=>x!==id):[...s,id];setSaved(next);toast(next.includes(id)?'저장했습니다':'저장을 해제했습니다');renderDynamic()}function updateSavedCounts(){document.querySelectorAll('[data-saved-count]').forEach(el=>el.textContent=getSaved().length)}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function mountainImage(m){return m.imageThumb||m.image||'assets/hero.jpg'}
function imageCredit(m){if(!m.imageSource)return '';if(m.imageStatus==='generated_fallback')return '대체 이미지';if(m.imageSourceUrl)return '<a href="'+escapeHtml(m.imageSourceUrl)+'" target="_blank" rel="noopener">공개 이미지 출처</a>';return '공개 이미지'}
function selectedMountain(){const id=new URLSearchParams(location.search).get('mountain')||localStorage.getItem('dmc.lastMountain')||'bukhansan';return mountains.find(m=>m.id===id)||mountains[0]}
function goDashboard(id){localStorage.setItem('dmc.lastMountain',id);location.href='dashboard.html?mountain='+encodeURIComponent(id)}
window.goDashboard=goDashboard;
function renderMountainList(list=mountains){
  const box=$('[data-mountain-list]'); if(!box)return;
  const count=$('[data-result-count]'); if(count)count.textContent=list.length+'개 산';
  box.innerHTML=list.length?list.slice(0,100).map(m=>`<article class="item search-item"><div class="thumb" style="background-image:url(&quot;${escapeHtml(mountainImage(m))}&quot;)"></div><div><h3>${escapeHtml(m.name)}</h3><p class="muted">${escapeHtml(m.region)} · ${escapeHtml(m.level)} · ${escapeHtml(m.time)} · ${escapeHtml(m.distance)} · ${escapeHtml(m.elevation)}</p><div class="tags"><span class="tag">${escapeHtml(m.difficultyOriginal||m.level)}</span><span class="tag">${escapeHtml(m.course?.summit||'정상')}</span></div></div><a class="btn primary" href="dashboard.html?mountain=${encodeURIComponent(m.id)}" data-open="${escapeHtml(m.id)}">상세 보기</a></article>`).join(''):'<div class="empty">조건에 맞는 산이 없습니다.</div>';
  $$('[data-open]',box).forEach(a=>a.addEventListener('click',()=>localStorage.setItem('dmc.lastMountain',a.dataset.open)));
}
function mountainSearchText(m){return [m.name,m.nameEn,m.region,m.province,m.level,m.difficultyOriginal,m.desc,m.summary,m.transport,m.course?.name,m.course?.start,m.course?.mid,m.course?.summit,m.course?.end,...(m.keywords||[]),...(m.photoSpots||[]),...(m.recommendedFor||[])].join(' ').toLowerCase()}
function matchesTheme(m,theme){const text=mountainSearchText(m);if(theme==='초보')return m.level==='초급'||/초보|초급|완만|입문/.test(text);if(theme==='대중교통')return /대중교통|버스|지하철|역/.test(text);if(theme==='계곡')return /계곡|폭포|물|溪/.test(text);if(theme==='단풍')return /단풍|가을|억새/.test(text);if(theme==='일출')return /일출|해돋이|전망|조망/.test(text);if(theme==='암릉')return /암릉|바위|릿지|암벽/.test(text);return true}
function resetFilterControls(){
  $$('.filter-btn[data-region]').forEach(b=>b.classList.toggle('active',b.dataset.region==='전체'));
  $$('.filter-btn[data-level]').forEach(b=>b.classList.toggle('active',b.dataset.level==='전체'));
  $$('.filter-btn[data-theme]').forEach(b=>b.classList.remove('active'));
}
function clearSearchInput(){const input=$('[data-search-input]');if(input)input.value=''}
function updateResultLabel(mode){const label=$('.result-head .muted');if(label)label.textContent=mode==='search'?'검색 결과':mode==='filter'?'필터 결과':'전체 산'}
function activeFilterState(){return {region:$('.filter-btn.active[data-region]')?.dataset.region||'전체',level:$('.filter-btn.active[data-level]')?.dataset.level||'전체',themes:$$('.filter-btn.active[data-theme]').map(b=>b.dataset.theme)}}
function applyFilters(){
  const q=($('[data-search-input]')?.value||'').trim().toLowerCase();
  const {region,level,themes}=activeFilterState();
  const hasFilter=region!=='전체'||level!=='전체'||themes.length>0;
  const list=mountains.filter(m=>(region==='전체'||m.region===region)&&(level==='전체'||m.level===level)&&(!q||mountainSearchText(m).includes(q))&&themes.every(t=>matchesTheme(m,t)));
  updateResultLabel(q?'search':hasFilter?'filter':'all');
  renderMountainList(list);
}
function setupArchive(){
  const list=$('[data-mountain-list]'); if(!list)return;
  renderMountainList();
  updateResultLabel('all');
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.filter-btn');
    if(!btn)return;
    clearSearchInput();
    if(btn.dataset.theme){btn.classList.toggle('active');applyFilters();return}
    const group=btn.dataset.region?'data-region':'data-level';
    $$('.filter-btn['+group+']').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  });
  $('[data-search-input]')?.addEventListener('input',e=>{if(e.target.value.trim())resetFilterControls();applyFilters()});
}

function setupClubBanner(){
  const record=$('[data-club-record]');
  const mountain=$('[data-club-mountain]');
  const leader=$('[data-club-leader]');
  if(record) record.addEventListener('click',()=>{location.href='mypage.html#records'});
  if(mountain) mountain.addEventListener('click',()=>goDashboard(mountain.dataset.clubMountain||'gwanaksan'));
  if(leader) leader.addEventListener('click',()=>{location.href='mypage.html#leader'});
}

function setupHomeSearch(){const form=$('[data-home-search]');if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();const q=$('[data-home-query]').value.trim();location.href='archive.html'+(q?'?q='+encodeURIComponent(q):'')})}
async function renderWeather(m){const box=$('[data-weather]');if(!box)return;box.innerHTML='<p class="muted">실시간 날씨를 불러오는 중입니다.</p>';try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${m.lat}&longitude=${m.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,weather_code&timezone=Asia%2FSeoul`;const res=await fetch(url);if(!res.ok)throw new Error('weather');const data=await res.json();const c=data.current;box.innerHTML=`<div class="stats"><div class="stat"><strong>${Math.round(c.temperature_2m)}°C</strong><span class="muted">기온</span></div><div class="stat"><strong>${c.relative_humidity_2m}%</strong><span class="muted">습도</span></div><div class="stat"><strong>${Math.round(c.wind_speed_10m)}km/h</strong><span class="muted">바람</span></div></div><p class="muted">Open-Meteo 무료 API 기준 · UV ${c.uv_index ?? '정보 없음'}</p>`}catch(e){box.innerHTML='<p class="note">날씨 API를 불러오지 못했습니다. GitHub Pages에 올린 뒤 네트워크가 허용되면 자동으로 다시 동작합니다.</p>'}}
function renderDashboard(){const page=$('[data-dashboard]');if(!page)return;const m=selectedMountain();if(!m){page.innerHTML='<div class="empty">산 데이터 파일을 불러오지 못했습니다. GitHub Pages 또는 로컬 서버에서 다시 열어주세요.</div>';return}document.title=m.name+' | 딕소톤 마운틴 클럽';$('[data-m-title]').textContent=m.name;$('[data-m-desc]').textContent=m.desc;const photo=$('[data-m-photo]');if(photo){photo.src=mountainImage(m);photo.alt=m.imageAlt||m.name+' 산 이미지'}const credit=$('[data-image-credit]');if(credit){credit.innerHTML=imageCredit(m)}$('[data-m-spec]').innerHTML='<li>지역: '+escapeHtml(m.region)+'</li><li>난이도: '+escapeHtml(m.level)+'</li><li>예상 소요 시간: '+escapeHtml(m.time)+'</li><li>왕복 거리: '+escapeHtml(m.distance)+'</li><li>누적 고도: '+escapeHtml(m.elevation)+'</li><li>좌표: '+Number(m.lat).toFixed(5)+', '+Number(m.lon).toFixed(5)+'</li><li>좌표 출처: '+(m.coordinateSource==='openstreetmap_nominatim_peak'||m.coordinateSource==='openstreetmap_nominatim_peak_name_disambiguated'?'OpenStreetMap':String(m.coordinateSource||'').startsWith('wikidata')?'Wikidata':'공개 데이터')+'</li>';$('[data-map]').src=`https://www.openstreetmap.org/export/embed.html?bbox=${m.lon-0.04}%2C${m.lat-0.03}%2C${m.lon+0.04}%2C${m.lat+0.03}&layer=mapnik&marker=${m.lat}%2C${m.lon}`;renderLocationInfo(m);renderFacilities(m);renderCourseInfo(m);renderRecommended(m);$('[data-save]').textContent=isSaved(m.id)?'저장 해제':'저장하기';$('[data-save]').onclick=()=>toggleSave(m.id);$('[data-gpx]').onclick=()=>downloadGpx(m);renderWeather(m);renderReviews(m.id)}

function mapUrl(m,type){
  const name=encodeURIComponent(m.name||'산');
  if(type==='kakao')return 'https://map.kakao.com/link/map/'+name+','+m.lat+','+m.lon;
  return 'https://map.naver.com/p/search/'+name;
}
function openMap(m,type){
  location.href=mapUrl(m,type);
}

function renderLocationInfo(m){
  const start=$('[data-route-start]');
  const end=$('[data-route-end]');
  if(start)start.textContent=m.course?.start&&m.course.start!=='출발지 정보 준비중'?m.course.start:'대표 등산로 입구';
  if(end)end.textContent=m.course?.end&&m.course.end!=='하산지점 정보 준비중'?m.course.end:(m.course?.summit||m.name+' 정상');
  $$('[data-map-placeholder]').forEach(btn=>{
    const type=btn.dataset.mapPlaceholder;
    btn.onclick=()=>{btn.classList.add('tapped');setTimeout(()=>btn.classList.remove('tapped'),220);openMap(m,type)};
    btn.title=(type==='kakao'?'카카오맵':'네이버지도')+'에서 '+m.name+' 보기';
  });
}

const facilityDefs=[['toilet','화장실','있음','toilet.svg'],['convenienceStore','편의점','입구 5분','store.svg'],['dustCleaner','먼지털이','하산지점','dust-cleaner.svg'],['parking','주차','가능','parking.svg'],['busStop','버스정류장','300m','bus-stop.svg'],['water','식수','없음','water.svg']];
function facilityValue(raw, fallback){const value=String(raw||'').trim();return !value||value==='확인 필요'||value==='정보 준비중'?fallback:value}
function facilityTone(value){return /없음|불가|운영 안|폐쇄|없/.test(value)?'bad':(/확인|준비/.test(value)?'warn':'good')}
function facilityCardsHtml(m, compact=false){const f=m.facilities||{};return '<div class="facility-card-grid '+(compact?'compact':'')+'">'+facilityDefs.map(([key,label,fallback,file])=>{const value=facilityValue(f[key],fallback);return '<div class="facility-card '+facilityTone(value)+'"><div class="facility-icon" aria-hidden="true"><img src="assets/facilities/'+file+'" alt=""></div><span>'+escapeHtml(label)+'</span><strong>'+escapeHtml(value)+'</strong></div>'}).join('')+'</div>'}
function renderFacilities(m){const box=$('[data-facilities]');if(!box)return;box.innerHTML=facilityCardsHtml(m)}
function renderRecommended(m){const box=$('[data-recommended]');if(!box)return;const list=Array.isArray(m.recommendedFor)?m.recommendedFor:[];box.innerHTML=list.length?list.map(x=>'<li>'+x+'</li>').join(''):'<li>정보 준비중</li>'}
function courseList(m){
  if(Array.isArray(m.courses)&&m.courses.length)return m.courses;
  const c=m.course||{};
  const valid=v=>v&&v!=='출발지 정보 준비중'&&v!=='중간지점 정보 준비중'&&v!=='하산지점 정보 준비중';
  const base={start:valid(c.start)?c.start:'대표 등산로 입구',mid:valid(c.mid)?c.mid:'중간지점',summit:c.summit||m.name,end:valid(c.end)?c.end:'하산지점',distance:m.distance,time:m.time,level:m.level};
  return [
    {...base,name:'1코스',badge:'추천'},
    {...base,name:'2코스',start:'대중교통 접근점',mid:'능선 구간',end:'원점 회귀'},
    {...base,name:'3코스',start:'주차장',mid:'전망 포인트',end:'하산지점'}
  ];
}
function renderCourseInfo(m){
  const box=$('[data-course-info]'); if(!box)return;
  box.innerHTML=courseList(m).map((c,i)=>{
    const steps=[c.start,c.mid,c.summit||m.name,c.end].filter(Boolean);
    return '<article class="course-card"><div class="course-card-top"><div><strong>'+escapeHtml(c.name||((i+1)+'코스'))+'</strong>'+(c.badge?'<span class="course-badge">'+escapeHtml(c.badge)+'</span>':'')+'</div><button class="course-more" type="button" data-course-soon>상세 보기</button></div><div class="course-meta"><span>거리 <b>'+escapeHtml(c.distance||m.distance||'-')+'</b></span><span>예상 소요시간 <b>'+escapeHtml(c.time||m.time||'-')+'</b></span><span>난이도 <b>'+escapeHtml(c.level||m.level||'-')+'</b></span></div><div class="course-flow" aria-label="코스 이동 흐름">'+steps.map((step,idx)=>'<span class="course-step"><i>'+(idx+1)+'</i>'+escapeHtml(step)+'</span>').join('<em>→</em>')+'</div></article>';
  }).join('');
  $('[data-course-soon]',box).forEach(btn=>btn.onclick=()=>toast('코스별 상세 정보는 준비중입니다'));
}

function downloadGpx(m){const gpx=`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="딕소톤 마운틴 클럽"><wpt lat="${m.lat}" lon="${m.lon}"><name>${m.name}</name></wpt><trk><name>${m.name} sample route</name><trkseg><trkpt lat="${m.lat-0.01}" lon="${m.lon-0.01}"></trkpt><trkpt lat="${m.lat}" lon="${m.lon}"></trkpt><trkpt lat="${m.lat+0.01}" lon="${m.lon+0.01}"></trkpt></trkseg></trk></gpx>`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([gpx],{type:'application/gpx+xml'}));a.download=m.id+'.gpx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function reviewKey(id){return 'dmc.reviews.'+id}function getReviews(id){return JSON.parse(localStorage.getItem(reviewKey(id))||'[]')}function setReviews(id,v){localStorage.setItem(reviewKey(id),JSON.stringify(v))}
function renderReviews(id){const list=$('[data-review-list]');if(!list)return;const reviews=getReviews(id);list.innerHTML=reviews.length?reviews.map(r=>`<div class="review"><strong>${r.name}</strong><p class="muted">${r.text}</p></div>`).join(''):'<div class="empty">아직 저장된 후기가 없습니다. 첫 후기를 남겨보세요.</div>';const form=$('[data-review-form]');if(!form)return;form.onsubmit=e=>{e.preventDefault();const name=$('[data-review-name]').value.trim()||'익명 회원';const text=$('[data-review-text]').value.trim();if(!text){toast('후기를 입력해주세요');return}setReviews(id,[{name,text,date:new Date().toISOString()},...getReviews(id)]);$('[data-review-text]').value='';toast('후기를 저장했습니다');renderReviews(id)}}
function renderMyPage(){if(!$('[data-my-page]'))return;const saved=getSaved().map(id=>mountains.find(m=>m.id===id)).filter(Boolean);$('[data-saved-list]').innerHTML=saved.length?saved.map(m=>`<li><button class="btn ghost" data-open="${m.id}">${m.name}</button></li>`).join(''):'<li class="muted">저장한 산이 없습니다.</li>';$$('[data-open]').forEach(b=>b.addEventListener('click',()=>goDashboard(b.dataset.open)));let reviewCount=mountains.reduce((n,m)=>n+getReviews(m.id).length,0);$('[data-review-count]').textContent=reviewCount;$('[data-saved-count]').textContent=saved.length}
function renderDynamic(){updateSavedCounts();renderDashboard();renderMyPage()}
document.addEventListener('DOMContentLoaded',async()=>{await loadMountains();const params=new URLSearchParams(location.search);const q=params.get('q');if(q&&$('[data-search-input]'))$('[data-search-input]').value=q;setupHomeSearch();setupClubBanner();setupArchive();if(q)applyFilters();renderDynamic()});
