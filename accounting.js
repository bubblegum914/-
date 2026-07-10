const STORAGE_KEY = 'acc_entries';
const GOALS_KEY = 'acc_goals';
const CATS = {
  income: ['薪資', '投資', '兼職', '紅包', '其他收入'],
  expense: ['餐飲', '交通', '購物', '娛樂', '住房', '水電', '醫療', '教育', '其他支出']
};
const ICONS = {
  '薪資': '💼', '投資': '📈', '兼職': '💻', '紅包': '🧧',
  '餐飲': '🍽️', '交通': '🚌', '購物': '🛍️', '娛樂': '🎬',
  '住房': '🏠', '水電': '💡', '醫療': '🏥', '教育': '📚',
  '其他收入': '📦', '其他支出': '📦'
};

let userId = null;
let entries = [];
let goals = { monthly: 0, yearly: 0 };
let editingId = null;
let curMonth = new Date().getMonth() + 1;
let curYear = new Date().getFullYear();

const $ = id => document.getElementById(id);

function getStorageKey(base) {
  return userId ? base + '_' + userId : base;
}

function load() {
  const name = localStorage.getItem('acc_user');
  if (name) {
    userId = name;
    $('userName').textContent = name;
    $('userArea').style.display = 'flex';
  }
  if (!userId) {
    $('loginOverlay').classList.add('show');
    return;
  }
  $('loginOverlay').classList.remove('show');
  try {
    entries = JSON.parse(localStorage.getItem(getStorageKey(STORAGE_KEY))) || [];
    goals = JSON.parse(localStorage.getItem(getStorageKey(GOALS_KEY))) || { monthly: 0, yearly: 0 };
  } catch { entries = []; goals = { monthly: 0, yearly: 0 }; }
}

function save(k) {
  if (k === 'entries') localStorage.setItem(getStorageKey(STORAGE_KEY), JSON.stringify(entries));
  if (k === 'goals') localStorage.setItem(getStorageKey(GOALS_KEY), JSON.stringify(goals));
}

function fmt(n) { return Number(n).toLocaleString(); }

function todayEntries() {
  const ts = new Date().toISOString().split('T')[0];
  return entries.filter(e => e.date === ts);
}

function monthEntries() {
  return entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === curMonth && d.getFullYear() === curYear;
  });
}

function yearEntries() {
  return entries.filter(e => new Date(e.date).getFullYear() === curYear);
}

function dateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const y = dateStr;
  const ty = today.toISOString().split('T')[0];
  if (y === ty) return '🫧 今天';
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  if (y === yest.toISOString().split('T')[0]) return '🫧 昨天';
  return '📅 ' + (d.getMonth() + 1) + '/' + d.getDate();
}

/* Month select */
function initMonthSelect() {
  const sel = $('recMonth');
  sel.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m + '月';
    sel.appendChild(opt);
  }
  sel.value = curMonth;
}

/* ── Today Bar ── */
function renderToday() {
  const te = todayEntries();
  const tInc = te.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const tExp = te.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  $('todayInc').textContent = '$' + fmt(tInc);
  $('todayExp').textContent = '$' + fmt(tExp);
  $('todayBal').textContent = '$' + fmt(tInc - tExp);
  $('todayCount').textContent = te.length + '筆';

  // Today entries list
  const sorted = [...te].sort((a, b) => b.id - a.id);
  $('todayEntries').innerHTML = sorted.length === 0
    ? '<div class="empty-msg">🎶 今天還沒有記錄～</div>'
    : sorted.map(e =>
      `<div class="entry-row">
        <div class="entry-icon ${e.type}">${ICONS[e.category] || '📦'}</div>
        <div class="entry-info">
          <div class="entry-cat">${e.category}</div>
          <div class="entry-note">${e.note || ''}</div>
        </div>
        <div class="entry-amt ${e.type}">${e.type === 'income' ? '+' : '-'}$${fmt(e.amount)}</div>
      </div>`
    ).join('');
}

/* ── Summary ── */
function renderSummary() {
  const me = monthEntries();
  const inc = me.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const exp = me.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  $('monthInc').textContent = '$' + fmt(inc);
  $('monthExp').textContent = '$' + fmt(exp);
  $('monthBal').textContent = '$' + fmt(inc - exp);
}

/* ── Category Stats ── */
function renderCats() {
  const me = monthEntries();
  const groups = {};
  me.forEach(e => {
    if (!groups[e.category]) groups[e.category] = { type: e.type, amount: 0 };
    groups[e.category].amount += e.amount;
  });
  const sorted = Object.entries(groups).sort((a, b) => b[1].amount - a[1].amount);
  const max = sorted.length > 0 ? sorted[0][1].amount : 0;
  $('catStats').innerHTML = sorted.length === 0
    ? '<div class="empty-msg">🍀 本月尚無記錄</div>'
    : sorted.map(([cat, d]) =>
      `<div class="cat-row">
        <span class="cat-name">${ICONS[cat] || '📦'} ${cat}</span>
        <div class="cat-bar"><div class="cat-fill ${d.type === 'income' ? 'inc' : 'exp'}" style="width:${max > 0 ? (d.amount / max * 100) : 0}%"></div></div>
        <span class="cat-amt">$${fmt(d.amount)}</span>
      </div>`
    ).join('');
}

/* ── Goals ── */
function renderGoals() {
  const monthlyInc = monthEntries().filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const yearlyInc = yearEntries().filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);

  $('gMonthlyEarned').textContent = fmt(monthlyInc);
  $('gYearlyEarned').textContent = fmt(yearlyInc);
  $('gMonthlyTarget').textContent = fmt(goals.monthly);
  $('gYearlyTarget').textContent = fmt(goals.yearly);

  function set(el, earned, target) {
    const fill = $(el);
    const pct = $(el.replace('Fill', 'Pct'));
    const rem = $(el.replace('Fill', 'Remain'));
    if (target > 0) {
      const r = earned / target;
      const p = Math.min(r * 100, 100);
      fill.style.width = p + '%';
      pct.textContent = (r * 100).toFixed(1) + '%';
      const left = Math.max(target - earned, 0);
      rem.textContent = left > 0 ? '尚差 $' + fmt(left) : '🧚🏻‍♀️ 已達成！';
    } else {
      fill.style.width = '0%';
      pct.textContent = '0%';
      rem.textContent = target === 0 ? '尚未設定目標' : '目標 $' + fmt(target);
    }
  }
  set('gMonthlyFill', monthlyInc, goals.monthly);
  set('gYearlyFill', yearlyInc, goals.yearly);
}

/* ── Records List ── */
function renderRecs() {
  const type = $('recType').value;
  const search = $('recSearch').value.toLowerCase();
  let list = monthEntries();
  if (type !== 'all') list = list.filter(e => e.type === type);
  if (search) list = list.filter(e => (e.note || '').toLowerCase().includes(search));
  list.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

  if (list.length === 0) {
    $('recList').innerHTML = '<div class="empty-msg">🎶 尚無記錄</div>';
    return;
  }

  const groups = {};
  list.forEach(e => {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });

  let html = '';
  let totalInc = 0, totalExp = 0;

  Object.entries(groups).forEach(([date, items]) => {
    const dInc = items.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const dExp = items.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    totalInc += dInc; totalExp += dExp;

    html += `<div class="date-group">
      <div class="dg-hd">
        <span>${dateLabel(date)}</span>
        <span class="dg-line"></span>
        <span class="dg-badge">${items.length}筆</span>
      </div>`;

    items.forEach(e => {
      html += `<div class="entry-row">
        <div class="entry-icon ${e.type}">${ICONS[e.category] || '📦'}</div>
        <div class="entry-info">
          <div class="entry-cat">${e.category}</div>
          <div class="entry-note">${e.note || ''}</div>
        </div>
        <div class="entry-amt ${e.type}">${e.type === 'income' ? '+' : '-'}$${fmt(e.amount)}</div>
        <div style="display:flex;gap:3px;flex-shrink:0">
          <button onclick="editEntry(${e.id})" style="background:none;border:none;cursor:pointer;font-size:11px;color:#c4a88a;padding:2px 4px;border-radius:4px;transition:all 0.15s" onmouseover="this.style.background='rgba(152,208,176,0.2)';this.style.color='#7A5C45'" onmouseout="this.style.background='transparent';this.style.color='#c4a88a'">✎</button>
          <button onclick="delEntry(${e.id})" style="background:none;border:none;cursor:pointer;font-size:11px;color:#c4a88a;padding:2px 4px;border-radius:4px;transition:all 0.15s" onmouseover="this.style.background='rgba(160,112,80,0.2)';this.style.color='#A07050'" onmouseout="this.style.background='transparent';this.style.color='#c4a88a'">✕</button>
        </div>
      </div>`;
    });
    html += '</div>';
  });

  $('recList').innerHTML = html;
}

/* ── Refresh ── */
function refreshAll() {
  renderToday();
  renderSummary();
  renderCats();
  renderGoals();
  renderRecs();
}

/* ── Modal ── */
function openModal(entry) {
  editingId = entry ? entry.id : null;
  $('modalTitle').textContent = entry ? '📝 編輯記錄' : '📝 新增記錄';
  $('fSubmit').textContent = entry ? '更新' : '💾 儲存';
  const type = entry ? entry.type : 'income';
  document.querySelectorAll('.tg-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tg-btn[data-type="${type}"]`).classList.add('active');
  populateCat(type);
  $('fDate').value = entry ? entry.date : new Date().toISOString().split('T')[0];
  $('fCat').value = entry ? entry.category : CATS[type][0];
  $('fAmount').value = entry ? entry.amount : '';
  $('fNote').value = entry ? (entry.note || '') : '';
  $('modal').classList.add('open');
}

function closeModal() {
  editingId = null;
  $('modal').classList.remove('open');
  $('modalForm').reset();
}

function populateCat(type) {
  const sel = $('fCat');
  sel.innerHTML = (CATS[type] || CATS.expense).map(c =>
    `<option value="${c}">${ICONS[c] || '📦'} ${c}</option>`
  ).join('');
}

$('modalClose').addEventListener('click', closeModal);
$('fCancel').addEventListener('click', closeModal);
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
$('fabAdd').addEventListener('click', () => openModal(null));

document.querySelectorAll('.tg-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tg-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    populateCat(this.dataset.type);
  });
});

/* ── Amount +/- buttons ── */
$('amtPlus').addEventListener('click', () => {
  const el = $('fAmount');
  el.value = (parseFloat(el.value) || 0) + 100;
});
$('amtMinus').addEventListener('click', () => {
  const el = $('fAmount');
  el.value = Math.max(0, (parseFloat(el.value) || 0) - 100);
});

$('modalForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const type = document.querySelector('.tg-btn.active').dataset.type;
  const date = $('fDate').value;
  const category = $('fCat').value;
  const amount = parseFloat($('fAmount').value);
  const note = $('fNote').value.trim();
  if (!date || !amount || amount <= 0) return;

  if (editingId) {
    const idx = entries.findIndex(e => e.id === editingId);
    if (idx !== -1) entries[idx] = { ...entries[idx], type, date, category, amount, note };
  } else {
    entries.push({ id: Date.now() + Math.random(), type, date, category, amount, note, createdAt: new Date().toISOString() });
  }
  save('entries');
  closeModal();
  refreshAll();
});

window.editEntry = function(id) {
  const e = entries.find(en => en.id === id);
  if (e) openModal(e);
};

window.delEntry = function(id) {
  if (!confirm('確定刪除？')) return;
  entries = entries.filter(e => e.id !== id);
  save('entries');
  refreshAll();
};

/* ── Filters ── */
$('recMonth').addEventListener('change', function() { curMonth = parseInt(this.value); refreshAll(); });
$('recType').addEventListener('change', renderRecs);
$('recSearch').addEventListener('input', renderRecs);

/* ── Goals buttons ── */
$('gMonthlyBtn').addEventListener('click', function() {
  const v = parseFloat($('gMonthlyInput').value);
  if (v > 0) { goals.monthly = v; save('goals'); renderGoals(); $('gMonthlyInput').value = ''; }
});

$('gYearlyBtn').addEventListener('click', function() {
  const v = parseFloat($('gYearlyInput').value);
  if (v > 0) { goals.yearly = v; save('goals'); renderGoals(); $('gYearlyInput').value = ''; }
});

/* ── Name login ── */
$('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = $('loginName').value.trim();
  if (!name) return;
  userId = name;
  localStorage.setItem('acc_user', name);
  $('userName').textContent = name;
  $('userArea').style.display = 'flex';
  $('loginOverlay').classList.remove('show');
  load();
  refreshAll();
});

$('logoutBtn').addEventListener('click', function() {
  userId = null;
  localStorage.removeItem('acc_user');
  $('userArea').style.display = 'none';
  $('loginOverlay').classList.add('show');
  entries = [];
  goals = { monthly: 0, yearly: 0 };
  refreshAll();
});

/* ── Init ── */
(function() {
  load();
  initMonthSelect();
  refreshAll();
})();
