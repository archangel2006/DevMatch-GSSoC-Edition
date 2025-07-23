// script.js

// 1. Tech-stack synonyms
const SYNONYMS = {
  js: 'javascript', py: 'python', html5: 'html', css3: 'css',
  ts: 'typescript', reactjs: 'react', nodejs: 'node', expressjs: 'express'
};

// 2. DOM refs
const fileInput     = document.getElementById('fileInput');
const filterInput   = document.getElementById('filterInput');
const projectListEl = document.getElementById('projectList');
const visitCountEl  = document.getElementById('visitCount');

filterInput.disabled = true;  // lock filter until Excel loads

// 3. Read & normalize Excel
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = await file.arrayBuffer();
    const wb   = XLSX.read(data, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

    // attach normalized techs
    window.PROJECTS = rows.map(r => {
      const techs = (r['Tech stack'] || '')
        .toLowerCase()
        .split(',')
        .map(s => SYNONYMS[s.trim()] || s.trim())
        .filter(Boolean);
      return { ...r, techs: Array.from(new Set(techs)) };
    });

    filterInput.disabled = false;
    renderProjects();
  } catch (err) {
    console.error(err);
    alert('Error parsing Excel');
  }
});

// 4. Re-render on filter change
filterInput.addEventListener('input', renderProjects);

// 5. Main render
function renderProjects() {
  const q = filterInput.value.toLowerCase().trim();
  projectListEl.innerHTML = '';
  if (!window.PROJECTS) return;

  window.PROJECTS
    .filter(p => p.techs.some(t => t.includes(q)))
    .forEach(p => {
      const adminName = p['Project admin'] || 'Admin';
      const adminLink = p['Admin linkedin'] || '#';

      // build mentor anchors
      const mentors = [];
      for (let i = 1; i <= 5; i++) {
        const n = p[`mentor ${i}`], url = p[`mentor ${i} linkedin`];
        if (n && url) mentors.push(`<a href="${url}" target="_blank">${n}</a>`);
      }
      const mentorHTML = mentors.length ? mentors.join(', ') : '—';

      // card
      const li = document.createElement('li');
      li.className = 'project-item';
      li.innerHTML = `
        <div class="project-top">
          <h3>${p['Project name']}</h3>
        </div>
        <p>${p['Project description'] || ''}</p>
        <div class="tech">Tech: ${p.techs.join(', ')}</div>

        <div class="project-footer-row">
          <a href="${p['Project link']}" class="github-icon-link" target="_blank">
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                 alt="GitHub" class="github-icon"/>
          </a>
          <span><strong>Admin:</strong> 
            <a href="${adminLink}" target="_blank">${adminName}</a>
          </span>
          <span><strong>Mentors:</strong> ${mentorHTML}</span>
        </div>
      `;
      projectListEl.appendChild(li);
    });
}

// 6. Visit counter

async function bumpGlobalVisits() {
  try {
    const res = await fetch('https://api.countapi.xyz/hit/gssoc-explorer/visits');
    const { value } = await res.json();
    visitCountEl.textContent = value;
  } catch (err) {
    console.error('CountAPI error:', err);
  }
}

window.addEventListener('load', bumpGlobalVisits);