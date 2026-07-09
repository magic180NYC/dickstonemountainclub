
let mountains=[];
let openedCourseParam=false;
async function loadMountains(){
  if(Array.isArray(window.DMC_MOUNTAINS)) mountains=window.DMC_MOUNTAINS;
  try{
    const res=await fetch('data/mountains.json',{cache:'no-store'});
    if(res.ok) mountains=await res.json();
  }catch(e){
    console.warn('산 데이터 파일을 보조 데이터로 표시합니다.',e);
  }
}
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function toast(msg){let el=$('.toast');if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
let currentUser=null;
async function initAuth(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  currentUser=session?.user||null;
  supabaseClient.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;renderAuthNav();renderDynamic()});
  renderAuthNav();
}
function renderAuthNav(){
  $$('.nav-auth').forEach(nav=>{
    if(currentUser){
      nav.innerHTML='<button class="auth-login" type="button" data-logout aria-label="로그아웃"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span>로그아웃</span></button>';
      const btn=$('[data-logout]',nav);
      if(btn)btn.onclick=async()=>{await supabaseClient.auth.signOut();location.href='index.html'};
    }else{
      nav.innerHTML='<a class="auth-login" href="login.html" aria-label="로그인"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span>로그인</span></a>';
    }
  });
}
function setupLoginForm(){
  const form=$('[data-login-form]');if(!form)return;
  const toggle=$('[data-login-toggle]');
  const submitBtn=$('[data-login-submit]');
  const msg=$('[data-login-message]');
  let mode='signin';
  if(toggle)toggle.onclick=e=>{
    e.preventDefault();
    mode=mode==='signin'?'signup':'signin';
    submitBtn.textContent=mode==='signin'?'로그인':'회원가입';
    toggle.textContent=mode==='signin'?'회원가입':'로그인으로 돌아가기';
    if(msg)msg.textContent='';
  };
  form.onsubmit=async e=>{
    e.preventDefault();
    const email=$('[data-login-email]').value.trim();
    const password=$('[data-login-password]').value;
    if(!email||!password){if(msg)msg.textContent='이메일과 비밀번호를 입력해주세요';return}
    submitBtn.disabled=true;
    const {error}=mode==='signin'
      ?await supabaseClient.auth.signInWithPassword({email,password})
      :await supabaseClient.auth.signUp({email,password});
    submitBtn.disabled=false;
    if(error){if(msg)msg.textContent=error.message;return}
    if(mode==='signup'){if(msg)msg.textContent='가입 확인 이메일을 확인해주세요. 이메일 인증 후 로그인할 수 있습니다.';return}
    location.href='mypage.html';
  };
}
async function getSavedIds(){
  if(!currentUser)return [];
  const {data,error}=await supabaseClient.from('saved_mountains').select('mountain_id').eq('user_id',currentUser.id);
  if(error){console.warn(error);return []}
  return data.map(r=>r.mountain_id);
}
async function isSaved(id){return (await getSavedIds()).includes(id)}
async function toggleSave(id){
  if(!currentUser){toast('로그인이 필요합니다');location.href='login.html';return}
  const saved=await getSavedIds();
  if(saved.includes(id)){
    await supabaseClient.from('saved_mountains').delete().eq('user_id',currentUser.id).eq('mountain_id',id);
    toast('저장을 해제했습니다');
  }else{
    await supabaseClient.from('saved_mountains').insert({user_id:currentUser.id,mountain_id:id});
    toast('저장했습니다');
  }
  await renderDynamic();
}
function getSavedCourses(){return JSON.parse(localStorage.getItem('dmc.savedCourses')||'[]')}function setSavedCourses(v){localStorage.setItem('dmc.savedCourses',JSON.stringify(v));updateSavedCounts()}function courseSaveKey(mountainId,courseIndex){return mountainId+':'+courseIndex}function isCourseSaved(mountainId,courseIndex){const key=courseSaveKey(mountainId,courseIndex);return getSavedCourses().some(x=>x.key===key)}function toggleCourseSave(m,courseIndex){const c=courseList(m)[courseIndex]||courseList(m)[0];const key=courseSaveKey(m.id,courseIndex);const saved=getSavedCourses();const exists=saved.some(x=>x.key===key);const next=exists?saved.filter(x=>x.key!==key):[{key,mountainId:m.id,courseIndex,courseName:c.name||((courseIndex+1)+'코스'),savedAt:new Date().toISOString()},...saved];setSavedCourses(next);toast(exists?'코스 저장을 해제했습니다':'코스를 저장했습니다');return !exists}async function updateSavedCounts(){const savedIds=await getSavedIds();const count=savedIds.length+getSavedCourses().length;document.querySelectorAll('[data-saved-count]').forEach(el=>el.textContent=count)}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function mountainImage(m){return m.imageThumb||m.image||'assets/hero.jpg'}
function imageCredit(m){if(!m.imageSource)return '';if(m.imageStatus==='generated_fallback')return '대체 이미지';if(m.imageSourceUrl)return '<a href="'+escapeHtml(m.imageSourceUrl)+'" target="_blank" rel="noopener">공개 이미지 출처</a>';return '공개 이미지'}
function selectedMountain(){const id=new URLSearchParams(location.search).get('mountain')||localStorage.getItem('dmc.lastMountain')||'bukhansan';return mountains.find(m=>m.id===id)||mountains[0]}
function goDashboard(id){localStorage.setItem('dmc.lastMountain',id);location.href='dashboard.html?mountain='+encodeURIComponent(id)}
function goCourseDashboard(id,courseIndex){localStorage.setItem('dmc.lastMountain',id);location.href='dashboard.html?mountain='+encodeURIComponent(id)+'&course='+encodeURIComponent(courseIndex)}
function normalizeSearchQuery(value){return String(value||'').replace(/\s+/g,'').toLowerCase()}
function exactMountainMatch(query){const q=normalizeSearchQuery(query);if(!q)return null;return mountains.find(m=>normalizeSearchQuery(m.name)===q||normalizeSearchQuery(m.id)===q)||null}
function goIfExactMountain(query){const m=exactMountainMatch(query);if(!m)return false;goDashboard(m.id);return true}
window.goDashboard=goDashboard;
function renderMountainList(list=mountains){
  const box=$('[data-mountain-list]'); if(!box)return;
  const count=$('[data-result-count]'); if(count)count.textContent=list.length+'개 산';
  box.innerHTML=list.length?list.slice(0,100).map(m=>`<article class="item search-item"><div class="thumb" style="background-image:url(&quot;${escapeHtml(mountainImage(m))}&quot;)"></div><div><h3>${escapeHtml(m.name)}</h3><p class="muted">${escapeHtml(m.region)} · ${escapeHtml(m.level)} · ${escapeHtml(m.time)} · ${escapeHtml(m.distance)} · ${escapeHtml(m.elevation)}</p><div class="tags"><span class="tag">${escapeHtml(m.difficultyOriginal||m.level)}</span><span class="tag">${escapeHtml(m.course?.summit||'정상')}</span></div></div><a class="btn primary" href="dashboard.html?mountain=${encodeURIComponent(m.id)}" data-open="${escapeHtml(m.id)}">상세 보기</a></article>`).join(''):'<div class="empty">조건에 맞는 산이 없습니다.</div>';
  $$('[data-open]',box).forEach(a=>a.addEventListener('click',()=>localStorage.setItem('dmc.lastMountain',a.dataset.open)));
}
function mountainSearchText(m){const courses=m.courses||[];return [m.name,m.nameEn,m.region,m.province,m.level,m.difficultyOriginal,m.desc,m.summary,m.transport,m.course?.name,m.course?.start,m.course?.mid,m.course?.summit,m.course?.end,...(m.keywords||[]),...(m.photoSpots||[]),...(m.recommendedFor||[]),...courses.flatMap(c=>[c.name,c.level,c.distance,c.time,c.elevation,c.start,c.mid,c.summit,c.end,c.summary,c.transport,c.parking,c.toilet,...(c.route||[]),...(c.terrain||[]),...(c.themes||[]),...(c.recommendedFor||[])])].join(' ').toLowerCase()}
function matchesTheme(m,theme){const text=mountainSearchText(m);const courses=m.courses||[];if(theme==='초보')return m.level==='초급'||courses.some(c=>c.level==='초급')||/초보|초급|완만|입문/.test(text);if(theme==='대중교통')return courses.some(c=>/대중교통 가능/.test(c.transport||''))||/대중교통|버스|지하철|역/.test(text);if(theme==='계곡')return /계곡|폭포|물/.test(text);if(theme==='단풍')return /단풍|가을|억새/.test(text);if(theme==='일출')return /일출|해돋이|전망|조망/.test(text);if(theme==='암릉')return /암릉|바위|릿지|암벽|철계단|쇠사슬/.test(text);return true}
function matchesFeature(m,feature){const courses=m.courses||[];if(feature==='short')return courses.some(c=>Number(c.hours)<=2)||Number(m.hours)<=2;if(feature==='halfday')return courses.some(c=>Number(c.hours)<=4)||Number(m.hours)<=4;if(feature==='transit')return courses.some(c=>/대중교통 가능/.test(c.transport||''));if(feature==='parking')return courses.some(c=>/가능/.test(c.parking||''));if(feature==='toilet')return courses.some(c=>/있음/.test(c.toilet||''))||/있음/.test(m.facilities?.toilet||'');return true}
function activeFilterState(){
  return {
    region:$('.filter-btn.active[data-region]')?.dataset.region||'전체',
    level:$('.filter-btn.active[data-level]')?.dataset.level||'전체',
    themes:$$('.filter-btn.active[data-theme]').map(b=>b.dataset.theme),
    features:$$('.filter-btn.active[data-feature]').map(b=>b.dataset.feature)
  };
}
function resetFilterControls(){
  $$('.filter-btn[data-region],.filter-btn[data-level]').forEach(b=>b.classList.toggle('active',b.textContent.trim()==='전체'));
  $$('.filter-btn[data-theme],.filter-btn[data-feature]').forEach(b=>b.classList.remove('active'));
}
function clearSearchInput(){const input=$('[data-search-input]');if(input)input.value=''}
function updateResultLabel(mode){const label=$('[data-result-label]');if(!label)return;label.textContent=mode==='search'?'검색 결과':mode==='filter'?'필터 결과':'전체 산'}
function applyFilters(){
  const q=($('[data-search-input]')?.value||'').trim().toLowerCase();
  const {region,level,themes,features}=activeFilterState();
  const hasFilter=region!=='전체'||level!=='전체'||themes.length>0||features.length>0;
  const list=mountains.filter(m=>(region==='전체'||m.region===region)&&(level==='전체'||m.level===level)&&(!q||mountainSearchText(m).includes(q))&&themes.every(t=>matchesTheme(m,t))&&features.every(f=>matchesFeature(m,f)));
  updateResultLabel(q?'search':hasFilter?'filter':'all');
  renderMountainList(list);
}
function scrollToFirstResult(){
  const first=$('[data-mountain-list] .search-item');
  if(!first)return;
  setTimeout(()=>{
    const top=first.getBoundingClientRect().top+window.scrollY-16;
    window.scrollTo({top,behavior:'smooth'});
  },120);
}
function setupArchive(){
  const list=$('[data-mountain-list]'); if(!list)return;
  const searchInput=$('[data-search-input]');
  const params=new URLSearchParams(location.search);
  const initialQuery=(params.get('q')||'').trim();
  if(initialQuery&&searchInput){if(goIfExactMountain(initialQuery))return;searchInput.value=initialQuery;resetFilterControls();applyFilters();scrollToFirstResult()}
  else{renderMountainList();updateResultLabel('all')}
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.filter-btn');
    if(!btn)return;
    clearSearchInput();
    if(btn.dataset.theme||btn.dataset.feature){btn.classList.toggle('active');applyFilters();scrollToFirstResult();return}
    const group=btn.dataset.region?'data-region':'data-level';
    $$('.filter-btn['+group+']').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
    scrollToFirstResult();
  });
  searchInput?.addEventListener('input',e=>{if(e.target.value.trim())resetFilterControls();applyFilters()});
  searchInput?.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    e.preventDefault();
    const q=searchInput.value.trim();
    searchInput.blur();
    if(goIfExactMountain(q))return;
    applyFilters();
    scrollToFirstResult();
  });
}

function setupClubBanner(){
  const record=$('[data-club-record]');
  const mountain=$('[data-club-mountain]');
  const leader=$('[data-club-leader]');
  if(record) record.addEventListener('click',()=>{location.href='mypage.html#records'});
  if(mountain) mountain.addEventListener('click',()=>goDashboard(mountain.dataset.clubMountain||'gwanaksan'));
  if(leader) leader.addEventListener('click',()=>{location.href='mypage.html#leader'});
}

function setupHomeSearch(){const form=$('[data-home-search]');if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();const q=$('[data-home-query]').value.trim();if(goIfExactMountain(q))return;location.href='archive.html'+(q?'?q='+encodeURIComponent(q)+'#results':'#results')})}
async function renderWeather(m){const box=$('[data-weather]');if(!box)return;box.innerHTML='<p class="muted">실시간 날씨를 불러오는 중입니다.</p>';try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${m.lat}&longitude=${m.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,weather_code&timezone=Asia%2FSeoul`;const res=await fetch(url);if(!res.ok)throw new Error('weather');const data=await res.json();const c=data.current;box.innerHTML=`<div class="stats"><div class="stat"><strong>${Math.round(c.temperature_2m)}°C</strong><span class="muted">기온</span></div><div class="stat"><strong>${c.relative_humidity_2m}%</strong><span class="muted">습도</span></div><div class="stat"><strong>${Math.round(c.wind_speed_10m)}km/h</strong><span class="muted">바람</span></div></div><p class="muted">Open-Meteo 무료 API 기준 · UV ${c.uv_index ?? '정보 없음'}</p>`}catch(e){box.innerHTML='<p class="note">날씨 API를 불러오지 못했습니다. GitHub Pages에 올린 뒤 네트워크가 허용되면 자동으로 다시 동작합니다.</p>'}}
async function renderDashboard(){const page=$('[data-dashboard]');if(!page)return;const m=selectedMountain();if(!m){page.innerHTML='<div class="empty">산 데이터 파일을 불러오지 못했습니다. GitHub Pages 또는 로컬 서버에서 다시 열어주세요.</div>';return}document.title=m.name+' | 딕스톤 마운틴 클럽';$('[data-m-title]').textContent=m.name;$('[data-m-desc]').textContent=m.desc;const photo=$('[data-m-photo]');if(photo){photo.src=mountainImage(m);photo.alt=m.imageAlt||m.name+' 산 이미지'}const credit=$('[data-image-credit]');if(credit){credit.innerHTML=imageCredit(m)}$('[data-m-spec]').innerHTML='<li>지역: '+escapeHtml(m.region)+'</li><li>난이도: '+escapeHtml(m.level)+'</li><li>예상 소요 시간: '+escapeHtml(m.time)+'</li><li>왕복 거리: '+escapeHtml(m.distance)+'</li><li>누적 고도: '+escapeHtml(m.elevation)+'</li><li>좌표: '+Number(m.lat).toFixed(5)+', '+Number(m.lon).toFixed(5)+'</li><li>좌표 출처: '+(m.coordinateSource==='openstreetmap_nominatim_peak'||m.coordinateSource==='openstreetmap_nominatim_peak_name_disambiguated'?'OpenStreetMap':String(m.coordinateSource||'').startsWith('wikidata')?'Wikidata':'공개 데이터')+'</li>';renderLocationInfo(m);renderDecisionSummary(m);renderFacilities(m);renderCourseInfo(m);renderRecommended(m);$('[data-save]').textContent=(await isSaved(m.id))?'저장 해제':'저장하기';$('[data-save]').onclick=()=>toggleSave(m.id);$('[data-gpx]').onclick=()=>downloadGpx(m);renderWeather(m);renderReviews(m.id)}

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
function renderDecisionSummary(m){const box=$('[data-decision-summary]');if(!box)return;const d=m.decisionSummary||{};const courses=m.courses||[];const easy=courses.filter(c=>c.level==='초급').length;box.innerHTML='<div class="decision-grid"><div><span>추천 판단</span><strong>'+escapeHtml(d.recommendation||'정보 준비중')+'</strong></div><div><span>대표 선택</span><strong>'+escapeHtml(d.quickPick||courses[0]?.name||m.course?.name||'대표 코스')+'</strong></div><div><span>교통</span><strong>'+escapeHtml(d.transport||'확인 필요')+'</strong></div><div><span>편의</span><strong>'+escapeHtml(d.facilities||'확인 필요')+'</strong></div></div><p class="note decision-note">'+escapeHtml(d.caution||'코스와 날씨를 확인한 뒤 산행을 결정하세요.')+'</p>'+(easy?'<p class="muted">초급 코스 '+easy+'개가 있어 가벼운 산행 선택지도 있습니다.</p>':'')}
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
function sourceLinks(items){return (items||[]).map(x=>'<a href="'+escapeHtml(x.url)+'" target="_blank" rel="noopener">'+escapeHtml(x.label)+'</a>').join('')||'<span>출처 준비중</span>'}
function courseSourcesHtml(c){const s=c.sources||{};const sum=c.sourceSummary||{};return '<div class="course-source-box"><div class="course-source-head"><strong>정보 검수 상태</strong><span>'+escapeHtml(c.verificationStatus||'초안')+'</span></div><div class="course-source-grid"><div><b>공식</b><p>'+escapeHtml(sum.official||'공식 확인 필요')+'</p>'+sourceLinks(s.official)+'</div><div><b>지도</b><p>'+escapeHtml(sum.map||'지도 확인 필요')+'</p>'+sourceLinks(s.map)+'</div><div><b>후기</b><p>'+escapeHtml(sum.review||'후기 참고')+'</p>'+sourceLinks(s.review)+'</div></div><p class="course-source-note">'+escapeHtml(c.sourceNote||'설명문은 사이트 톤에 맞게 재작성했습니다.')+'</p></div>'}
function courseDetailText(c,m){
  const terrain=(c.terrain||[]).join(' · ')||'노면 정보 준비중';
  const targets=(c.recommendedFor||[]).join(' · ')||'추천 대상 준비중';
  return '<div class="course-detail-meta"><span>거리 <b>'+escapeHtml(c.distance||m.distance||'-')+'</b></span><span>시간 <b>'+escapeHtml(c.time||m.time||'-')+'</b></span><span>난이도 <b>'+escapeHtml(c.level||m.level||'-')+'</b></span><span>상승 <b>'+escapeHtml(c.elevation||m.elevation||'-')+'</b></span></div><p>'+escapeHtml(c.summary||'코스 설명을 준비중입니다.')+'</p><div class="course-detail-section"><h4>이동 흐름</h4><div class="course-flow detail">'+(c.route||[c.start,c.mid,c.summit||m.name,c.end]).filter(Boolean).map((step,idx)=>'<span class="course-step"><i>'+(idx+1)+'</i>'+escapeHtml(step)+'</span>').join('<em>→</em>')+'</div></div><div class="course-detail-section"><h4>판단 포인트</h4><ul><li>추천: '+escapeHtml(targets)+'</li><li>노면: '+escapeHtml(terrain)+'</li><li>교통: '+escapeHtml(c.transport||'확인 필요')+'</li></ul></div><div class="course-mini-facilities"><span>화장실 <b>'+escapeHtml(c.toilet||m.facilities?.toilet||'확인 필요')+'</b></span><span>주차 <b>'+escapeHtml(c.parking||m.facilities?.parking||'확인 필요')+'</b></span><span>대중교통 <b>'+escapeHtml(c.transport||'확인 필요')+'</b></span></div>'+courseSourcesHtml(c)+'<div class="course-detail-actions"><button class="btn primary" type="button" data-course-save>코스 저장</button><a class="btn kakao" href="'+mapUrl(m,'kakao')+'" target="_blank" rel="noopener">카카오맵</a><a class="btn naver" href="'+mapUrl(m,'naver')+'" target="_blank" rel="noopener">네이버지도</a></div>';
}
function openCourseDetail(m,courseIndex){
  const c=courseList(m)[courseIndex]||courseList(m)[0];
  let modal=$('[data-course-detail-modal]');
  if(!modal){modal=document.createElement('div');modal.className='course-detail-modal';modal.dataset.courseDetailModal='';document.body.appendChild(modal)}
  modal.innerHTML='<div class="course-detail-backdrop" data-course-close></div><section class="course-detail-sheet" role="dialog" aria-modal="true" aria-label="코스 상세 정보"><button class="course-detail-close" type="button" data-course-close>닫기</button><p class="eyebrow">'+escapeHtml(m.name)+' 코스</p><h3>'+escapeHtml(c.name||'코스 상세')+'</h3>'+courseDetailText(c,m)+'</section>';
  const saveBtn=$('[data-course-save]',modal);
  if(saveBtn){
    const sync=()=>saveBtn.textContent=isCourseSaved(m.id,courseIndex)?'코스 저장 해제':'코스 저장';
    sync();
    saveBtn.onclick=()=>{toggleCourseSave(m,courseIndex);sync();renderMyPage()};
  }
  modal.classList.add('show');
  $$('[data-course-close]',modal).forEach(btn=>btn.onclick=()=>modal.classList.remove('show'));
}
function renderCourseInfo(m){
  const box=$('[data-course-info]'); if(!box)return;
  box.innerHTML=courseList(m).map((c,i)=>{
    const steps=[c.start,c.mid,c.summit||m.name,c.end].filter(Boolean);
    return '<article class="course-card"><div class="course-card-top"><div><strong>'+escapeHtml(c.name||((i+1)+'코스'))+'</strong>'+(c.badge?'<span class="course-badge">'+escapeHtml(c.badge)+'</span>':'')+'</div><button class="course-more" type="button" data-course-index="'+i+'">상세 보기</button></div><div class="course-meta"><span>거리 <b>'+escapeHtml(c.distance||m.distance||'-')+'</b></span><span>예상 소요시간 <b>'+escapeHtml(c.time||m.time||'-')+'</b></span><span>난이도 <b>'+escapeHtml(c.level||m.level||'-')+'</b></span></div><div class="course-flow" aria-label="코스 이동 흐름">'+steps.map((step,idx)=>'<span class="course-step"><i>'+(idx+1)+'</i>'+escapeHtml(step)+'</span>').join('<em>→</em>')+'</div></article>';
  }).join('');
  $$('[data-course-index]',box).forEach(btn=>btn.onclick=()=>openCourseDetail(m,Number(btn.dataset.courseIndex)));
  const courseParam=new URLSearchParams(location.search).get('course');
  if(courseParam!==null&&!openedCourseParam){
    openedCourseParam=true;
    setTimeout(()=>openCourseDetail(m,Number(courseParam)||0),80);
  }
}

function downloadGpx(m){const gpx=`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="딕스톤 마운틴 클럽"><wpt lat="${m.lat}" lon="${m.lon}"><name>${m.name}</name></wpt><trk><name>${m.name} sample route</name><trkseg><trkpt lat="${m.lat-0.01}" lon="${m.lon-0.01}"></trkpt><trkpt lat="${m.lat}" lon="${m.lon}"></trkpt><trkpt lat="${m.lat+0.01}" lon="${m.lon+0.01}"></trkpt></trkseg></trk></gpx>`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([gpx],{type:'application/gpx+xml'}));a.download=m.id+'.gpx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function getReviews(id){const {data,error}=await supabaseClient.from('reviews').select('*').eq('mountain_id',id).order('created_at',{ascending:false});if(error){console.warn(error);return []}return data}
async function renderReviews(id){const list=$('[data-review-list]');if(!list)return;const reviews=await getReviews(id);list.innerHTML=reviews.length?reviews.map(r=>`<div class="review"><strong>${escapeHtml(r.author_name)}</strong><p class="muted">${escapeHtml(r.body)}</p></div>`).join(''):'<div class="empty">아직 저장된 후기가 없습니다. 첫 후기를 남겨보세요.</div>';const form=$('[data-review-form]');if(!form)return;form.onsubmit=async e=>{e.preventDefault();if(!currentUser){toast('로그인이 필요합니다');location.href='login.html';return}const name=$('[data-review-name]').value.trim()||currentUser.email;const text=$('[data-review-text]').value.trim();if(!text){toast('후기를 입력해주세요');return}const{error}=await supabaseClient.from('reviews').insert({user_id:currentUser.id,mountain_id:id,author_name:name,body:text});if(error){toast('저장 실패: '+error.message);return}$('[data-review-text]').value='';toast('후기를 저장했습니다');renderReviews(id)}}
const GROWTH_LEVELS=[{level:1,minPoints:0,name:'씨앗 산악인'},{level:2,minPoints:50,name:'초보 산악인'},{level:3,minPoints:150,name:'열정 산악인'},{level:4,minPoints:300,name:'베테랑 산악인'},{level:5,minPoints:500,name:'마스터 산악인'}];
const GROWTH_BADGES=[{reviews:1,name:'첫 발자국'},{reviews:5,name:'성실한 기록자'},{reviews:10,name:'산행 마스터'}];
function computeGrowth(reviewCount){
  const points=reviewCount*50;
  let current=GROWTH_LEVELS[0],next=null;
  for(const lvl of GROWTH_LEVELS){if(points>=lvl.minPoints)current=lvl;else{next=lvl;break}}
  const progressPct=next?Math.min(100,Math.round((points-current.minPoints)/(next.minPoints-current.minPoints)*100)):100;
  const badges=GROWTH_BADGES.filter(b=>reviewCount>=b.reviews).map(b=>b.name);
  return {points,level:current.level,levelName:current.name,next,progressPct,badges};
}
async function renderMyPage(){if(!$('[data-my-page]'))return;const savedIds=await getSavedIds();const saved=savedIds.map(id=>mountains.find(m=>m.id===id)).filter(Boolean);const savedCourses=getSavedCourses().map(item=>{const m=mountains.find(x=>x.id===item.mountainId);return m?{...item,m}:null}).filter(Boolean);const mountainHtml=saved.map(m=>`<li><button class="btn ghost" data-open="${m.id}"><strong>${m.name}</strong><span>저장한 산</span></button></li>`).join('');const courseHtml=savedCourses.map(item=>`<li><button class="btn ghost saved-course-link" data-course-open="${item.mountainId}" data-course-index="${item.courseIndex}"><strong>${item.m.name}</strong><span>${item.courseName}</span></button></li>`).join('');$('[data-saved-list]').innerHTML=(mountainHtml+courseHtml)||'<li class="muted">저장한 산이나 코스가 없습니다.</li>';$$('[data-open]').forEach(b=>b.addEventListener('click',()=>goDashboard(b.dataset.open)));$$('[data-course-open]').forEach(b=>b.addEventListener('click',()=>goCourseDashboard(b.dataset.courseOpen,b.dataset.courseIndex)));let reviewCount=0;if(currentUser){const{count}=await supabaseClient.from('reviews').select('*',{count:'exact',head:true}).eq('user_id',currentUser.id);reviewCount=count||0}$('[data-review-count]').textContent=reviewCount;$('[data-saved-count]').textContent=saved.length+savedCourses.length;
  const growth=computeGrowth(reviewCount);
  const levelNameEl=$('[data-level-name]');if(levelNameEl)levelNameEl.textContent=growth.levelName;
  const levelNumEl=$('[data-level-num]');if(levelNumEl)levelNumEl.textContent=growth.level+'단계';
  const progressEl=$('[data-level-progress]');if(progressEl)progressEl.style.width=growth.progressPct+'%';
  const detailEl=$('[data-level-detail]');if(detailEl)detailEl.textContent=growth.next?(growth.points+'P · 다음 레벨("'+growth.next.name+'")까지 '+(growth.next.minPoints-growth.points)+'P 남음'):(growth.points+'P · 최고 레벨입니다');
  const badgeListEl=$('[data-badge-list]');if(badgeListEl)badgeListEl.innerHTML=growth.badges.length?growth.badges.map(b=>'<li>🏅 '+escapeHtml(b)+'</li>').join(''):'<li class="muted">아직 획득한 뱃지가 없습니다. 후기를 남겨보세요.</li>';
}
async function renderDynamic(){await updateSavedCounts();await renderDashboard();await renderMyPage()}
document.addEventListener('DOMContentLoaded',async()=>{await initAuth();await loadMountains();const params=new URLSearchParams(location.search);const q=params.get('q');if(q&&$('[data-search-input]'))$('[data-search-input]').value=q;setupHomeSearch();setupClubBanner();setupArchive();setupLoginForm();if(q)applyFilters();await renderDynamic()});
