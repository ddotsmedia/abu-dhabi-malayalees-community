/* ============================================================
   ADMC Admin Panel — Single-Page Application
   ============================================================ */

const API = '/api';

/* ---- Utilities ---- */
function token()  { return localStorage.getItem('admc_token'); }
function saveToken(t) { localStorage.setItem('admc_token', t); }
function clearToken()  { localStorage.removeItem('admc_token'); }

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token()) headers['Authorization'] = 'Bearer ' + token();
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showToast(msg, type = 'default') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3200);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function confirm_(msg) { return window.confirm(msg); }

function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function tagHtml(val, map) {
  const m = map[val] || { cls: 'tag-gray', label: val };
  return `<span class="tag ${m.cls}">${m.label}</span>`;
}

/* ---- Router ---- */
const sections = {};
let currentSection = 'dashboard';

function navigate(section) {
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });
  document.getElementById('topbarTitle').textContent =
    section.charAt(0).toUpperCase() + section.slice(1);
  const render = sections[section];
  if (render) render();
}

/* ============================================================
   DASHBOARD
   ============================================================ */
sections.dashboard = async function () {
  const content = document.getElementById('mainContent');
  content.innerHTML = '<p style="color:var(--muted)">Loading…</p>';
  try {
    const stats = await apiFetch('/stats');
    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="icon">📅</div>
          <div class="label">Total Events</div>
          <div class="value">${stats.events}</div>
        </div>
        <div class="stat-card">
          <div class="icon">📰</div>
          <div class="label">News Articles</div>
          <div class="value">${stats.news}</div>
        </div>
        <div class="stat-card">
          <div class="icon">👥</div>
          <div class="label">Active Members</div>
          <div class="value">${stats.active_members}</div>
        </div>
        <div class="stat-card">
          <div class="icon">✉️</div>
          <div class="label">Unread Messages</div>
          <div class="value" style="color:${stats.unread_contacts > 0 ? 'var(--danger)' : 'var(--primary)'}">${stats.unread_contacts}</div>
        </div>
      </div>
      <div class="table-wrap" style="padding:24px">
        <h3 style="margin-bottom:8px;font-size:0.95rem;font-weight:700">Quick Actions</h3>
        <p style="font-size:0.88rem;color:var(--muted);margin-bottom:16px">Use the sidebar to manage your content.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="navigate('events')">+ Add Event</button>
          <button class="btn btn-outline" onclick="navigate('news')">+ Add News</button>
          <button class="btn btn-outline" onclick="navigate('members')">+ Add Member</button>
        </div>
      </div>
    `;
    // Update contact badge
    if (stats.unread_contacts > 0) {
      const badge = document.getElementById('contactBadge');
      badge.textContent = stats.unread_contacts;
      badge.style.display = '';
    }
  } catch (e) {
    content.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`;
  }
};

/* ============================================================
   EVENTS
   ============================================================ */
const EVENT_CATS = {
  cultural: { cls: 'tag-blue',   label: 'Cultural' },
  welfare:  { cls: 'tag-green',  label: 'Welfare'  },
  national: { cls: 'tag-yellow', label: 'National' },
  sports:   { cls: 'tag-gold',   label: 'Sports'   },
  other:    { cls: 'tag-gray',   label: 'Other'    },
};

sections.events = async function () {
  const content = document.getElementById('mainContent');
  content.innerHTML = '<p style="color:var(--muted)">Loading…</p>';
  try {
    const events = await apiFetch('/events');
    content.innerHTML = `
      <div class="section-hdr">
        <h2>Events (${events.length})</h2>
        <button class="btn btn-primary" id="addEventBtn">+ Add Event</button>
      </div>
      <div class="table-wrap">
        ${events.length === 0 ? `<div class="empty-state"><div class="icon">📅</div><p>No events yet. Add your first event!</p></div>` : `
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Venue</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${events.map(e => `
              <tr>
                <td class="td-truncate" title="${e.title}">${e.title}${e.is_featured ? ' <span class="tag tag-gold">Featured</span>' : ''}</td>
                <td style="white-space:nowrap">${fmtDate(e.event_date)}</td>
                <td class="td-truncate">${e.venue || '—'}</td>
                <td>${tagHtml(e.category, EVENT_CATS)}</td>
                <td>${e.is_published
                  ? '<span class="tag tag-green">Published</span>'
                  : '<span class="tag tag-gray">Draft</span>'}</td>
                <td>
                  <div class="td-actions">
                    <button class="btn btn-outline btn-sm" onclick="editEvent(${e.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEvent(${e.id})">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>
    `;
    document.getElementById('addEventBtn').onclick = () => openEventModal();
  } catch (e) { content.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
};

function eventFormHtml(ev = {}) {
  return `
    <div class="form-group">
      <label>Title *</label>
      <input type="text" id="evTitle" value="${ev.title || ''}" required placeholder="Event title" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Date *</label>
        <input type="date" id="evDate" value="${ev.event_date ? ev.event_date.slice(0,10) : ''}" required />
      </div>
      <div class="form-group">
        <label>Time</label>
        <input type="text" id="evTime" value="${ev.event_time || ''}" placeholder="e.g. 6:00 PM – 9:00 PM" />
      </div>
    </div>
    <div class="form-group">
      <label>Venue</label>
      <input type="text" id="evVenue" value="${ev.venue || ''}" placeholder="Venue / Location" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Category</label>
        <select id="evCat">
          ${Object.keys(EVENT_CATS).map(k =>
            `<option value="${k}" ${ev.category === k ? 'selected' : ''}>${EVENT_CATS[k].label}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="evDesc" rows="3" placeholder="Event description…">${ev.description || ''}</textarea>
    </div>
    <div style="display:flex;gap:20px">
      <label class="form-check"><input type="checkbox" id="evFeatured" ${ev.is_featured ? 'checked' : ''} /> Featured</label>
      <label class="form-check"><input type="checkbox" id="evPublished" ${ev.is_published !== false ? 'checked' : ''} /> Published</label>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="evSaveBtn">Save Event</button>
    </div>
  `;
}

function openEventModal(ev = null) {
  openModal(ev ? 'Edit Event' : 'Add Event', eventFormHtml(ev || {}));
  document.getElementById('evSaveBtn').onclick = () => saveEvent(ev ? ev.id : null);
}

async function editEvent(id) {
  try {
    const ev = await apiFetch('/events/' + id);
    openEventModal(ev);
  } catch (e) { showToast(e.message, 'error'); }
}

async function saveEvent(id) {
  const body = {
    title:       document.getElementById('evTitle').value.trim(),
    event_date:  document.getElementById('evDate').value,
    event_time:  document.getElementById('evTime').value.trim(),
    venue:       document.getElementById('evVenue').value.trim(),
    category:    document.getElementById('evCat').value,
    description: document.getElementById('evDesc').value.trim(),
    is_featured: document.getElementById('evFeatured').checked,
    is_published:document.getElementById('evPublished').checked,
  };
  if (!body.title || !body.event_date) return showToast('Title and date are required', 'error');
  try {
    if (id) {
      await apiFetch('/events/' + id, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Event updated', 'success');
    } else {
      await apiFetch('/events', { method: 'POST', body: JSON.stringify(body) });
      showToast('Event created', 'success');
    }
    closeModal();
    sections.events();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteEvent(id) {
  if (!confirm_('Delete this event?')) return;
  try {
    await apiFetch('/events/' + id, { method: 'DELETE' });
    showToast('Event deleted');
    sections.events();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ============================================================
   NEWS
   ============================================================ */
const NEWS_CATS = {
  community: { cls: 'tag-blue',   label: 'Community' },
  award:     { cls: 'tag-gold',   label: 'Award'     },
  welfare:   { cls: 'tag-green',  label: 'Welfare'   },
  cultural:  { cls: 'tag-yellow', label: 'Cultural'  },
  other:     { cls: 'tag-gray',   label: 'Other'     },
};

sections.news = async function () {
  const content = document.getElementById('mainContent');
  content.innerHTML = '<p style="color:var(--muted)">Loading…</p>';
  try {
    const items = await apiFetch('/news');
    content.innerHTML = `
      <div class="section-hdr">
        <h2>News (${items.length})</h2>
        <button class="btn btn-primary" id="addNewsBtn">+ Add News</button>
      </div>
      <div class="table-wrap">
        ${items.length === 0 ? `<div class="empty-state"><div class="icon">📰</div><p>No news articles yet.</p></div>` : `
        <table>
          <thead>
            <tr><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${items.map(n => `
              <tr>
                <td class="td-truncate" title="${n.title}">${n.title}${n.is_featured ? ' <span class="tag tag-gold">Featured</span>' : ''}</td>
                <td>${tagHtml(n.category, NEWS_CATS)}</td>
                <td>${fmtDate(n.published_date)}</td>
                <td>${n.is_published ? '<span class="tag tag-green">Published</span>' : '<span class="tag tag-gray">Draft</span>'}</td>
                <td>
                  <div class="td-actions">
                    <button class="btn btn-outline btn-sm" onclick="editNews(${n.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteNews(${n.id})">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>
    `;
    document.getElementById('addNewsBtn').onclick = () => openNewsModal();
  } catch (e) { content.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
};

function newsFormHtml(n = {}) {
  return `
    <div class="form-group">
      <label>Title *</label>
      <input type="text" id="nTitle" value="${n.title || ''}" required placeholder="Article title" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Category</label>
        <select id="nCat">
          ${Object.keys(NEWS_CATS).map(k =>
            `<option value="${k}" ${n.category === k ? 'selected' : ''}>${NEWS_CATS[k].label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Published Date</label>
        <input type="date" id="nDate" value="${n.published_date ? n.published_date.slice(0,10) : new Date().toISOString().slice(0,10)}" />
      </div>
    </div>
    <div class="form-group">
      <label>Excerpt</label>
      <textarea id="nExcerpt" rows="2" placeholder="Short summary…">${n.excerpt || ''}</textarea>
    </div>
    <div class="form-group">
      <label>Full Content</label>
      <textarea id="nContent" rows="5" placeholder="Full article content…">${n.content || ''}</textarea>
    </div>
    <div style="display:flex;gap:20px">
      <label class="form-check"><input type="checkbox" id="nFeatured" ${n.is_featured ? 'checked' : ''} /> Featured</label>
      <label class="form-check"><input type="checkbox" id="nPublished" ${n.is_published !== false ? 'checked' : ''} /> Published</label>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="nSaveBtn">Save Article</button>
    </div>
  `;
}

function openNewsModal(n = null) {
  openModal(n ? 'Edit Article' : 'Add News Article', newsFormHtml(n || {}));
  document.getElementById('nSaveBtn').onclick = () => saveNews(n ? n.id : null);
}

async function editNews(id) {
  try {
    const n = await apiFetch('/news/' + id);
    openNewsModal(n);
  } catch (e) { showToast(e.message, 'error'); }
}

async function saveNews(id) {
  const body = {
    title:          document.getElementById('nTitle').value.trim(),
    category:       document.getElementById('nCat').value,
    published_date: document.getElementById('nDate').value,
    excerpt:        document.getElementById('nExcerpt').value.trim(),
    content:        document.getElementById('nContent').value.trim(),
    is_featured:    document.getElementById('nFeatured').checked,
    is_published:   document.getElementById('nPublished').checked,
  };
  if (!body.title) return showToast('Title is required', 'error');
  try {
    if (id) {
      await apiFetch('/news/' + id, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Article updated', 'success');
    } else {
      await apiFetch('/news', { method: 'POST', body: JSON.stringify(body) });
      showToast('Article created', 'success');
    }
    closeModal();
    sections.news();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteNews(id) {
  if (!confirm_('Delete this article?')) return;
  try {
    await apiFetch('/news/' + id, { method: 'DELETE' });
    showToast('Article deleted');
    sections.news();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ============================================================
   MEMBERS
   ============================================================ */
const MBR_TYPES   = { individual:'Individual', family:'Family', life:'Life Member' };
const MBR_STATUS  = { active:'active', inactive:'inactive', pending:'pending' };

sections.members = async function () {
  const content = document.getElementById('mainContent');
  content.innerHTML = '<p style="color:var(--muted)">Loading…</p>';
  try {
    const members = await apiFetch('/members');
    const stats   = await apiFetch('/members/stats');
    content.innerHTML = `
      <div class="section-hdr">
        <h2>Members (${members.length})</h2>
        <button class="btn btn-primary" id="addMbrBtn">+ Add Member</button>
      </div>
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
        <div class="stat-card"><div class="label">Total</div><div class="value">${stats.total}</div></div>
        <div class="stat-card"><div class="label">Individual</div><div class="value">${stats.individual}</div></div>
        <div class="stat-card"><div class="label">Family</div><div class="value">${stats.family}</div></div>
        <div class="stat-card"><div class="label">Life</div><div class="value">${stats.life}</div></div>
      </div>
      <div class="table-wrap">
        <div class="table-toolbar">
          <input type="text" id="mbrSearch" placeholder="Search name / email…" style="width:220px" />
          <select id="mbrTypeFilter">
            <option value="">All Types</option>
            ${Object.entries(MBR_TYPES).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
          </select>
          <select id="mbrStatusFilter">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <div class="spacer"></div>
        </div>
        ${members.length === 0 ? `<div class="empty-state"><div class="icon">👥</div><p>No members yet.</p></div>` : `
        <table id="mbrTable">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td>${m.first_name} ${m.last_name}</td>
                <td>${m.email || '—'}</td>
                <td>${m.phone || '—'}</td>
                <td>${tagHtml(m.membership_type, {
                  individual: { cls:'tag-blue',  label:'Individual' },
                  family:     { cls:'tag-green', label:'Family'     },
                  life:       { cls:'tag-gold',  label:'Life'       },
                })}</td>
                <td>${tagHtml(m.membership_status, {
                  active:   { cls:'tag-green',  label:'Active'   },
                  inactive: { cls:'tag-gray',   label:'Inactive' },
                  pending:  { cls:'tag-yellow', label:'Pending'  },
                })}</td>
                <td>${fmtDate(m.joined_date)}</td>
                <td>
                  <div class="td-actions">
                    <button class="btn btn-outline btn-sm" onclick='editMember(${JSON.stringify(m)})'>Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMember('${m.id}')">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>
    `;
    document.getElementById('addMbrBtn').onclick = () => openMemberModal();

    // Live search
    const searchInput = document.getElementById('mbrSearch');
    if (searchInput) searchInput.addEventListener('input', filterMbrTable);
    const typeFilter   = document.getElementById('mbrTypeFilter');
    const statusFilter = document.getElementById('mbrStatusFilter');
    if (typeFilter)   typeFilter.addEventListener('change', filterMbrTable);
    if (statusFilter) statusFilter.addEventListener('change', filterMbrTable);
  } catch (e) { content.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
};

function filterMbrTable() {
  const search = document.getElementById('mbrSearch').value.toLowerCase();
  const type   = document.getElementById('mbrTypeFilter').value;
  const status = document.getElementById('mbrStatusFilter').value;
  document.querySelectorAll('#mbrTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const cells = row.querySelectorAll('td');
    const rowType   = cells[3]?.textContent.trim().toLowerCase();
    const rowStatus = cells[4]?.textContent.trim().toLowerCase();
    const matchSearch = !search || text.includes(search);
    const matchType   = !type   || rowType.includes(type.toLowerCase());
    const matchStatus = !status || rowStatus.includes(status.toLowerCase());
    row.style.display = matchSearch && matchType && matchStatus ? '' : 'none';
  });
}

function memberFormHtml(m = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>First Name *</label>
        <input type="text" id="mFirst" value="${m.first_name || ''}" required />
      </div>
      <div class="form-group">
        <label>Last Name *</label>
        <input type="text" id="mLast" value="${m.last_name || ''}" required />
      </div>
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="mEmail" value="${m.email || ''}" />
    </div>
    <div class="form-group">
      <label>Phone</label>
      <input type="tel" id="mPhone" value="${m.phone || ''}" placeholder="+971 50 XXX XXXX" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Membership Type</label>
        <select id="mType">
          <option value="individual" ${m.membership_type==='individual'?'selected':''}>Individual</option>
          <option value="family"     ${m.membership_type==='family'?'selected':''}>Family</option>
          <option value="life"       ${m.membership_type==='life'?'selected':''}>Life Member</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="mStatus">
          <option value="active"   ${m.membership_status==='active'?'selected':''}>Active</option>
          <option value="inactive" ${m.membership_status==='inactive'?'selected':''}>Inactive</option>
          <option value="pending"  ${m.membership_status==='pending'?'selected':''}>Pending</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Joined Date</label>
      <input type="date" id="mJoined" value="${m.joined_date ? m.joined_date.slice(0,10) : new Date().toISOString().slice(0,10)}" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="mSaveBtn">Save Member</button>
    </div>
  `;
}

function openMemberModal(m = null) {
  openModal(m ? 'Edit Member' : 'Add Member', memberFormHtml(m || {}));
  document.getElementById('mSaveBtn').onclick = () => saveMember(m ? m.id : null);
}

function editMember(m) {
  openMemberModal(m);
}

async function saveMember(id) {
  const body = {
    first_name:        document.getElementById('mFirst').value.trim(),
    last_name:         document.getElementById('mLast').value.trim(),
    email:             document.getElementById('mEmail').value.trim(),
    phone:             document.getElementById('mPhone').value.trim(),
    membership_type:   document.getElementById('mType').value,
    membership_status: document.getElementById('mStatus').value,
    joined_date:       document.getElementById('mJoined').value,
  };
  if (!body.first_name || !body.last_name) return showToast('First and last name required', 'error');
  try {
    if (id) {
      await apiFetch('/members/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(body) });
      showToast('Member updated', 'success');
    } else {
      await apiFetch('/members', { method: 'POST', body: JSON.stringify(body) });
      showToast('Member added', 'success');
    }
    closeModal();
    sections.members();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteMember(id) {
  if (!confirm_('Delete this member?')) return;
  try {
    await apiFetch('/members/' + encodeURIComponent(id), { method: 'DELETE' });
    showToast('Member deleted');
    sections.members();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ============================================================
   LEADERSHIP
   ============================================================ */
sections.leadership = async function () {
  const content = document.getElementById('mainContent');
  content.innerHTML = '<p style="color:var(--muted)">Loading…</p>';
  try {
    const items = await apiFetch('/leadership');
    content.innerHTML = `
      <div class="section-hdr">
        <h2>Executive Committee (${items.length})</h2>
        <button class="btn btn-primary" id="addLeaderBtn">+ Add Member</button>
      </div>
      <div class="table-wrap">
        ${items.length === 0 ? `<div class="empty-state"><div class="icon">🏅</div><p>No committee members yet.</p></div>` : `
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Initials</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.map(l => `
              <tr>
                <td style="color:var(--muted);font-size:0.8rem">${l.display_order}</td>
                <td><strong>${l.name}</strong></td>
                <td>${l.role}</td>
                <td><span class="tag tag-blue">${l.initials || '—'}</span></td>
                <td>${l.is_active ? '<span class="tag tag-green">Active</span>' : '<span class="tag tag-gray">Inactive</span>'}</td>
                <td>
                  <div class="td-actions">
                    <button class="btn btn-outline btn-sm" onclick='editLeader(${JSON.stringify(l)})'>Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteLeader(${l.id})">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>
    `;
    document.getElementById('addLeaderBtn').onclick = () => openLeaderModal();
  } catch (e) { content.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
};

function leaderFormHtml(l = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" id="lName" value="${l.name || ''}" required />
      </div>
      <div class="form-group">
        <label>Initials</label>
        <input type="text" id="lInitials" value="${l.initials || ''}" maxlength="4" placeholder="e.g. SK" />
      </div>
    </div>
    <div class="form-group">
      <label>Role / Position *</label>
      <input type="text" id="lRole" value="${l.role || ''}" required placeholder="e.g. President" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Display Order</label>
        <input type="number" id="lOrder" value="${l.display_order || 99}" min="1" max="99" />
      </div>
    </div>
    <div class="form-group">
      <label>Bio</label>
      <textarea id="lBio" rows="3" placeholder="Short biography…">${l.bio || ''}</textarea>
    </div>
    <label class="form-check" style="margin-bottom:4px">
      <input type="checkbox" id="lActive" ${l.is_active !== false ? 'checked' : ''} /> Active
    </label>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="lSaveBtn">Save</button>
    </div>
  `;
}

function openLeaderModal(l = null) {
  openModal(l ? 'Edit Committee Member' : 'Add Committee Member', leaderFormHtml(l || {}));
  document.getElementById('lSaveBtn').onclick = () => saveLeader(l ? l.id : null);
}

function editLeader(l) { openLeaderModal(l); }

async function saveLeader(id) {
  const body = {
    name:          document.getElementById('lName').value.trim(),
    role:          document.getElementById('lRole').value.trim(),
    initials:      document.getElementById('lInitials').value.trim().toUpperCase(),
    display_order: parseInt(document.getElementById('lOrder').value),
    bio:           document.getElementById('lBio').value.trim(),
    is_active:     document.getElementById('lActive').checked,
  };
  if (!body.name || !body.role) return showToast('Name and role are required', 'error');
  try {
    if (id) {
      await apiFetch('/leadership/' + id, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Updated', 'success');
    } else {
      await apiFetch('/leadership', { method: 'POST', body: JSON.stringify(body) });
      showToast('Added', 'success');
    }
    closeModal();
    sections.leadership();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteLeader(id) {
  if (!confirm_('Remove this committee member?')) return;
  try {
    await apiFetch('/leadership/' + id, { method: 'DELETE' });
    showToast('Deleted');
    sections.leadership();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ============================================================
   CONTACT SUBMISSIONS
   ============================================================ */
sections.contacts = async function () {
  const content = document.getElementById('mainContent');
  content.innerHTML = '<p style="color:var(--muted)">Loading…</p>';
  try {
    const items = await apiFetch('/contact');
    const unread = items.filter(i => !i.is_read).length;

    content.innerHTML = `
      <div class="section-hdr">
        <h2>Contact Submissions (${items.length})</h2>
        ${unread > 0 ? `<span class="tag tag-red">${unread} unread</span>` : '<span class="tag tag-green">All read</span>'}
      </div>
      ${items.length === 0
        ? `<div class="empty-state table-wrap" style="padding:48px"><div class="icon">✉️</div><p>No submissions yet.</p></div>`
        : items.map(s => `
          <div class="submission-card ${!s.is_read ? 'unread' : ''}" id="sub_${s.id}">
            <div class="submission-meta">
              <strong>${s.first_name} ${s.last_name || ''}</strong>
              <span>✉ ${s.email || '—'}</span>
              ${s.phone ? `<span>📞 ${s.phone}</span>` : ''}
              <span style="margin-left:auto">${fmtDate(s.created_at)}</span>
              ${!s.is_read ? '<span class="tag tag-blue">Unread</span>' : '<span class="tag tag-gray">Read</span>'}
            </div>
            ${s.subject ? `<div style="font-size:0.8rem;color:var(--muted);margin-bottom:6px">Subject: <strong>${s.subject}</strong></div>` : ''}
            <div class="submission-message">${s.message || '—'}</div>
            <div class="submission-actions">
              ${!s.is_read ? `<button class="btn btn-outline btn-sm" onclick="markRead(${s.id})">Mark as Read</button>` : ''}
              <button class="btn btn-danger btn-sm" onclick="deleteSubmission(${s.id})">Delete</button>
            </div>
          </div>
        `).join('')}
    `;
  } catch (e) { content.innerHTML = `<p style="color:var(--danger)">${e.message}</p>`; }
};

async function markRead(id) {
  try {
    await apiFetch('/contact/' + id + '/read', { method: 'PATCH' });
    showToast('Marked as read', 'success');
    sections.contacts();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteSubmission(id) {
  if (!confirm_('Delete this submission?')) return;
  try {
    await apiFetch('/contact/' + id, { method: 'DELETE' });
    showToast('Deleted');
    sections.contacts();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ============================================================
   AUTH
   ============================================================ */
function showApp(username) {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  document.getElementById('userLabel').textContent = username;
  document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();
  navigate('dashboard');
}

function showLogin() {
  clearToken();
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('appShell').classList.add('hidden');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');
  err.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('loginUsername').value.trim(),
        password: document.getElementById('loginPassword').value,
      }),
    });
    saveToken(data.token);
    showApp(data.username);
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

/* ---- Sidebar navigation ---- */
document.querySelectorAll('.nav-item[data-section]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(el.dataset.section);
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
  });
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.getElementById('sidebarClose').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
});

/* ---- Modal close ---- */
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

/* ---- Init ---- */
(async function init() {
  if (token()) {
    try {
      const data = await apiFetch('/auth/me');
      showApp(data.username);
    } catch {
      showLogin();
    }
  }
})();
