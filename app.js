const GAS_URL = 'https://script.google.com/macros/s/AKfycbz3Ai2moAPd5l3fdHiEhni6XnxfKPfMQ8UrQHPWO9T8SHV7SzCpS_n4VZz8oIdQ83hrxQ/exec';

let questions = [];
let answers = [];
let selectedStudent = null;
let searchTimer = null;

const qs = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[ch]));

document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  await Promise.allSettled([checkApi(), loadQuestions()]);
}

function bindEvents() {
  qs('studentSearch').addEventListener('input', handleStudentSearch);
  qs('clearStudentButton').addEventListener('click', clearStudent);
  qs('submitButton').addEventListener('click', submitAssessment);
  qs('teacherButton').addEventListener('click', () => qs('teacherDialog').showModal());
  qs('closeTeacherDialog').addEventListener('click', () => qs('teacherDialog').close());
  qs('loadDashboardButton').addEventListener('click', loadDashboard);
}

async function apiGet(action, params = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store'
  });

  if (!response.ok) throw new Error(`เชื่อมต่อ API ไม่สำเร็จ (${response.status})`);
  const data = await response.json();
  if (data && data.success === false) throw new Error(data.message || 'เกิดข้อผิดพลาดจากระบบ');
  return data;
}

async function apiPost(payload) {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`ส่งข้อมูลไม่สำเร็จ (${response.status})`);
  const data = await response.json();
  if (data && data.success === false) throw new Error(data.message || 'เกิดข้อผิดพลาดจากระบบ');
  return data;
}

async function checkApi() {
  const status = qs('apiStatus');
  try {
    await apiGet('ping', { t: Date.now() });
    status.textContent = 'เชื่อมต่อแล้ว';
    status.className = 'status-pill ok';
  } catch (error) {
    status.textContent = 'เชื่อมต่อไม่ได้';
    status.className = 'status-pill error';
    showToast('เชื่อมต่อ Google Apps Script ไม่สำเร็จ กรุณาตรวจสอบการ Deploy', true);
  }
}

async function loadQuestions() {
  try {
    const data = await apiGet('questions', { t: Date.now() });
    questions = Array.isArray(data.questions) ? data.questions : [];
    if (!questions.length) throw new Error('ไม่พบคำถามในระบบ');
    answers = Array(questions.length).fill(null);
    renderQuestions();
    updateProgress();
  } catch (error) {
    qs('questions').innerHTML = `
      <div class="loading-block">
        <div><b>โหลดคำถามไม่สำเร็จ</b><br><small>${escapeHtml(error.message)}</small></div>
      </div>`;
    showToast(error.message, true);
  }
}

function renderQuestions() {
  const shortLabels = ['ไม่ตรงเลย', 'ค่อนข้างไม่ตรง', 'ปานกลาง', 'ค่อนข้างตรง', 'ตรงมาก'];
  qs('questions').innerHTML = questions.map((q, index) => `
    <article class="question" id="question-${index + 1}">
      <div class="question-top">
        <div class="question-number">${index + 1}</div>
        <div class="question-copy">
          <div class="question-dimension">${escapeHtml(q.dimension || '')}</div>
          <div class="question-text">${escapeHtml(q.text || '')}</div>
        </div>
      </div>
      <div class="answer-scale">
        ${[1,2,3,4,5].map((score) => `
          <button type="button" class="answer-option" data-question="${index}" data-score="${score}">
            <b>${score}</b><small>${shortLabels[score - 1]}</small>
          </button>`).join('')}
      </div>
    </article>`).join('');

  document.querySelectorAll('.answer-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.question);
      const score = Number(btn.dataset.score);
      answers[index] = score;
      document.querySelectorAll(`.answer-option[data-question="${index}"]`)
        .forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      updateProgress();
    });
  });
}

function updateProgress() {
  const answered = answers.filter(v => v !== null).length;
  const total = questions.length || 30;
  const pct = total ? (answered / total) * 100 : 0;
  qs('progressText').textContent = `${answered} / ${total} ข้อ`;
  qs('progressBar').style.width = `${pct}%`;

  const ready = Boolean(selectedStudent) && answered === total && total > 0;
  qs('submitButton').disabled = !ready;
  qs('submitHint').textContent = ready
    ? 'พร้อมส่งคำตอบและดูผล'
    : !selectedStudent
      ? 'กรุณาเลือกนักเรียนก่อน'
      : `เหลืออีก ${Math.max(total - answered, 0)} ข้อ`;
}

function handleStudentSearch(event) {
  const query = event.target.value.trim();
  clearTimeout(searchTimer);

  if (selectedStudent && query !== `${selectedStudent.studentId} — ${selectedStudent.fullName}`) {
    selectedStudent = null;
    renderSelectedStudent();
  }

  if (query.length < 2) {
    hideStudentResults();
    return;
  }

  searchTimer = setTimeout(() => searchStudents(query), 320);
}

async function searchStudents(query) {
  const resultsBox = qs('studentResults');
  resultsBox.classList.remove('hidden');
  resultsBox.innerHTML = '<div class="loading-block"><span class="spinner"></span>กำลังค้นหา...</div>';

  try {
    const data = await apiGet('studentSearch', { q: query, t: Date.now() });
    const students = Array.isArray(data.students) ? data.students : [];

    if (!students.length) {
      resultsBox.innerHTML = '<div class="loading-block">ไม่พบรายชื่อนักเรียน</div>';
      return;
    }

    resultsBox.innerHTML = students.map((student, i) => `
      <button type="button" class="student-option" data-index="${i}">
        <div><b>${escapeHtml(student.fullName)}</b><span>${escapeHtml(student.studentId)} · ${escapeHtml(student.classRoom)}</span></div>
        <span>${escapeHtml(student.status || '')}</span>
      </button>`).join('');

    resultsBox.querySelectorAll('.student-option').forEach((btn, i) => {
      btn.addEventListener('click', () => selectStudent(students[i]));
    });
  } catch (error) {
    resultsBox.innerHTML = `<div class="loading-block">${escapeHtml(error.message)}</div>`;
  }
}

function selectStudent(student) {
  selectedStudent = student;
  qs('studentSearch').value = `${student.studentId} — ${student.fullName}`;
  hideStudentResults();
  renderSelectedStudent();
  updateProgress();
}

function clearStudent() {
  selectedStudent = null;
  qs('studentSearch').value = '';
  renderSelectedStudent();
  updateProgress();
  qs('studentSearch').focus();
}

function renderSelectedStudent() {
  const panel = qs('selectedStudent');
  const clearBtn = qs('clearStudentButton');

  if (!selectedStudent) {
    panel.classList.add('empty');
    qs('selectedStudentName').textContent = 'ยังไม่ได้เลือกนักเรียน';
    qs('selectedStudentMeta').textContent = 'กรุณาค้นหาและเลือกรายชื่อก่อนทำแบบประเมิน';
    clearBtn.classList.add('hidden');
    return;
  }

  panel.classList.remove('empty');
  qs('selectedStudentName').textContent = selectedStudent.fullName;
  qs('selectedStudentMeta').textContent = `รหัส ${selectedStudent.studentId} · ${selectedStudent.classRoom}`;
  clearBtn.classList.remove('hidden');
}

function hideStudentResults() {
  qs('studentResults').classList.add('hidden');
  qs('studentResults').innerHTML = '';
}

async function submitAssessment() {
  if (!selectedStudent) {
    showToast('กรุณาเลือกนักเรียนก่อน', true);
    return;
  }
  if (answers.some(v => v === null)) {
    showToast('กรุณาตอบคำถามให้ครบทุกข้อ', true);
    return;
  }

  const button = qs('submitButton');
  button.disabled = true;
  button.textContent = 'กำลังบันทึก...';

  try {
    const result = await apiPost({
      action: 'submit',
      studentId: selectedStudent.studentId,
      answers
    });
    renderResult(result);
  } catch (error) {
    showToast(error.message, true);
    button.disabled = false;
    button.textContent = 'ส่งคำตอบและดูผล';
  }
}

function renderResult(data) {
  qs('assessmentView').classList.add('hidden');
  qs('dashboardView').classList.add('hidden');

  const view = qs('resultView');
  view.classList.remove('hidden');

  const dimensions = Array.isArray(data.dimensions) ? data.dimensions : [];
  const top3 = Array.isArray(data.top3) ? data.top3 : [];
  const profile = data.profile || {};

  view.innerHTML = `
    <section class="result-hero">
      <div class="result-icon">${escapeHtml(profile.emoji || '⭐')}</div>
      <div>
        <small>ผลการประเมินของ ${escapeHtml(data.student?.fullName || selectedStudent?.fullName || '')}</small>
        <h1>${escapeHtml(profile.type || 'ผลการประเมิน')}</h1>
        <p>${escapeHtml(profile.description || '')}</p>
      </div>
    </section>

    <div class="kpis">
      <div class="kpi"><span>คะแนนรวม</span><b>${escapeHtml(data.totalScore)}/150</b></div>
      <div class="kpi"><span>คิดเป็น</span><b>${escapeHtml(data.percentage)}%</b></div>
      <div class="kpi"><span>จุดเด่นอันดับ 1</span><b style="font-size:18px">${escapeHtml(top3[0]?.name || '-')}</b></div>
    </div>

    <section class="card">
      <div class="section-head"><div><h2>3 จุดแข็งเด่น</h2><p>คุณลักษณะที่มีคะแนนสูงที่สุด</p></div></div>
      <div class="top3">
        ${top3.map((item, i) => `<div class="top-item"><span>อันดับ ${i + 1}</span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.score)}/15 คะแนน</small></div>`).join('')}
      </div>
    </section>

    <section class="card">
      <div class="section-head"><div><h2>คะแนนทั้ง 10 ด้าน</h2><p>ใช้เป็นข้อมูลเพื่อมองเห็นจุดแข็งและด้านที่พัฒนาได้</p></div></div>
      ${dimensions.map(item => `
        <div class="dimension-row">
          <div><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.level || '')}</small></div>
          <div class="meter"><span style="width:${Math.max(0, Math.min(100, Number(item.score || 0) / 15 * 100))}%"></span></div>
          <b>${escapeHtml(item.score)}/15</b>
        </div>`).join('')}
    </section>

    <section class="card">
      <div class="advice"><b>คำแนะนำในการพัฒนา</b><p>${escapeHtml(profile.advice || '')}</p></div>
      <p class="disclaimer">${escapeHtml(data.disclaimer || '')}</p>
      <button class="primary-button" id="restartButton" type="button">กลับหน้าหลัก</button>
    </section>`;

  qs('restartButton').addEventListener('click', () => location.reload());
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadDashboard() {
  const pin = qs('teacherPin').value.trim();
  const className = qs('classFilter').value.trim();

  if (!pin) {
    showToast('กรุณากรอกรหัสผู้ดูแล', true);
    return;
  }

  const button = qs('loadDashboardButton');
  button.disabled = true;
  button.textContent = 'กำลังโหลด...';

  try {
    const data = await apiPost({ action: 'dashboard', pin, className });
    qs('teacherDialog').close();
    renderDashboard(data.dashboard || {});
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = 'เปิด Dashboard';
  }
}

function renderDashboard(data) {
  qs('assessmentView').classList.add('hidden');
  qs('resultView').classList.add('hidden');
  const view = qs('dashboardView');
  view.classList.remove('hidden');

  const dims = Array.isArray(data.dimensions) ? data.dimensions : [];
  const profiles = Array.isArray(data.profiles) ? data.profiles : [];
  const recent = Array.isArray(data.recent) ? data.recent : [];
  const maxProfile = Math.max(1, ...profiles.map(x => Number(x.count || 0)));

  view.innerHTML = `
    <section class="hero">
      <div class="hero-copy"><h1>Dashboard สำหรับครู</h1><p>ภาพรวมผลการประเมินนักขายมืออาชีพ</p></div>
      <div class="hero-stat"><b>${escapeHtml(data.totalResponses || 0)}</b><span>ผู้ตอบ</span><b>${escapeHtml(data.averagePercent || 0)}%</b><span>เฉลี่ยรวม</span></div>
    </section>

    <div class="kpis">
      <div class="kpi"><span>ผู้ตอบทั้งหมด</span><b>${escapeHtml(data.totalResponses || 0)}</b></div>
      <div class="kpi"><span>คะแนนเฉลี่ย</span><b>${escapeHtml(data.averageTotal || 0)}/150</b></div>
      <div class="kpi"><span>เฉลี่ยคิดเป็น</span><b>${escapeHtml(data.averagePercent || 0)}%</b></div>
    </div>

    <div class="dashboard-grid">
      <section class="card">
        <h2>คะแนนเฉลี่ย 10 ด้าน</h2>
        ${dims.map(item => `<div class="dimension-row"><b>${escapeHtml(item.name)}</b><div class="meter"><span style="width:${Math.max(0, Math.min(100, Number(item.average || 0) / 15 * 100))}%"></span></div><b>${escapeHtml(item.average)}</b></div>`).join('')}
      </section>
      <section class="card">
        <h2>ประเภทนักขาย</h2>
        ${profiles.map(item => `<div class="profile-row"><b>${escapeHtml(item.emoji || '')} ${escapeHtml(item.name)}</b><div class="meter"><span style="width:${Number(item.count || 0) / maxProfile * 100}%"></span></div><b>${escapeHtml(item.count || 0)}</b></div>`).join('')}
      </section>
    </div>

    <section class="card">
      <div class="section-head"><div><h2>ผู้ตอบล่าสุด</h2><p>แสดงสูงสุด 20 รายการล่าสุด</p></div></div>
      <div class="table-wrap">
        <table><thead><tr><th>เวลา</th><th>รหัส</th><th>ชื่อ</th><th>ชั้น/ห้อง</th><th>ผล</th><th>คะแนน</th></tr></thead>
        <tbody>${recent.map(row => `<tr><td>${escapeHtml(row.timestamp)}</td><td>${escapeHtml(row.studentId)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.className)}/${escapeHtml(row.room)}</td><td>${escapeHtml(row.profile)}</td><td>${escapeHtml(row.totalScore)}</td></tr>`).join('')}</tbody></table>
      </div>
      <div style="margin-top:16px"><button class="ghost-button" id="dashboardBackButton" type="button">กลับหน้าประเมิน</button></div>
    </section>`;

  qs('dashboardBackButton').addEventListener('click', () => location.reload());
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message, isError = false) {
  const toast = qs('toast');
  toast.textContent = message;
  toast.className = `toast${isError ? ' error' : ''}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3800);
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.search-wrap')) hideStudentResults();
});
