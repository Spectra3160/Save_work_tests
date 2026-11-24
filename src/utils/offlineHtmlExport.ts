import { ALL_THEMES } from '../data';
import { PersistedProgress } from '../types/quiz';

function escapeForScriptTag(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function downloadStandaloneOfflineHtml(currentProgress: PersistedProgress): void {
  const themesJson = escapeForScriptTag(JSON.stringify(ALL_THEMES));
  const initialProgressJson = escapeForScriptTag(JSON.stringify(currentProgress));

  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Охрана труда — Автономный тренажёр (Раздел 1)</title>
  <style>
    :root {
      --bg: #F7F8FA;
      --surface: #FFFFFF;
      --border: #E2E8F0;
      --text: #0F172A;
      --muted: #475569;
      --accent: #B91C1C;
      --accent-soft: #FEF2F2;
      --ok: #047857;
      --ok-soft: #ECFDF5;
      --warn: #B45309;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 20;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
    .nav { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .btn {
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn:hover { background: #F1F5F9; }
    .btn-primary { background: #0F172A; color: #FFFFFF; border-color: #0F172A; }
    .btn-primary:hover { background: #1E293B; }
    .btn-accent { background: var(--accent); color: #FFFFFF; border-color: var(--accent); }
    .btn-accent:hover { background: #991B1B; }
    .layout {
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
      padding: 24px;
      align-items: start;
    }
    @media (max-width: 920px) {
      .layout { grid-template-columns: 1fr; padding: 16px; }
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .sidebar {
      max-height: calc(100vh - 96px);
      overflow-y: auto;
      position: sticky;
      top: 72px;
      padding: 14px;
    }
    .theme-btn {
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
      padding: 10px 8px;
      font-weight: 600;
      font-size: 13px;
      color: var(--text);
      cursor: pointer;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .sub-btn {
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
      padding: 8px 10px;
      margin-top: 4px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .sub-btn:hover { background: #F1F5F9; color: var(--text); }
    .sub-btn.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
    .q-red { color: var(--accent); font-weight: 700; font-size: 13px; }
    .q-title { font-size: 20px; font-weight: 700; margin: 6px 0 14px; line-height: 1.35; }
    .q-map { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
    .q-dot {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-variant-numeric: tabular-nums;
    }
    .q-dot.current { border-color: #0F172A; border-width: 2px; }
    .q-dot.ok { background: var(--ok-soft); border-color: var(--ok); color: var(--ok); }
    .q-dot.err { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
    .q-dot.ans { background: #EFF6FF; border-color: #2563EB; color: #1D4ED8; }
    .opt {
      width: 100%;
      text-align: left;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 13px 15px;
      margin-bottom: 10px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--surface);
      cursor: pointer;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text);
    }
    .opt:hover { border-color: #94A3B8; background: #F8FAFC; }
    .opt.selected { border-color: #0F172A; background: #F8FAFC; box-shadow: inset 0 0 0 1px #0F172A; }
    .opt.correct { border-color: var(--ok); background: var(--ok-soft); color: #064E3B; }
    .opt.wrong { border-color: var(--accent); background: var(--accent-soft); color: #7F1D1D; }
    .opt-letter {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: 1px solid var(--border);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      background: #FFFFFF;
    }
    .explain {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: #F8FAFC;
      font-size: 14px;
    }
    .meta { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
    .row { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .mode-switch { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .mode-switch button { border: none; padding: 6px 12px; font-size: 13px; background: #FFF; cursor: pointer; }
    .mode-switch button.active { background: #0F172A; color: #FFF; font-weight: 600; }
    .hist-item { border-bottom: 1px solid var(--border); padding: 12px 0; }
  </style>
</head>
<body>
  <header>
    <div class="brand">Охрана труда — Автономный тренажёр</div>
    <div class="nav">
      <button class="btn" id="tabQuiz">Тестирование</button>
      <button class="btn" id="tabHistory">История попыток</button>
      <button class="btn" id="btnExport">Экспорт JSON</button>
      <label class="btn" style="display:inline-block;">Импорт JSON<input id="fileImport" type="file" accept=".json" style="display:none" /></label>
    </div>
  </header>
  <main class="layout">
    <aside class="panel sidebar" id="sidebar"></aside>
    <section class="panel" id="mainArea"></section>
  </main>
  <script>
    const THEMES = ${themesJson};
    const SEED_PROGRESS = ${initialProgressJson};
    const STORAGE_KEY = 'ot_trainer_progress_v1';
    const LETTERS = ['А', 'Б', 'В', 'Г'];

    let view = 'quiz';
    let expandedThemes = {};
    THEMES.forEach((t, i) => { expandedThemes[t.id] = i === 0; });

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.answers) return parsed;
        }
      } catch (e) {}
      return SEED_PROGRESS;
    }

    let state = loadState();
    expandedThemes[state.activeThemeId] = true;

    function persist() {
      state.lastSavedAt = Date.now();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function getActive() {
      const theme = THEMES.find(t => t.id === state.activeThemeId) || THEMES[0];
      const subtopic = theme.subtopics.find(s => s.id === state.activeSubtopicId) || theme.subtopics[0];
      const qIdx = Math.min(state.activeQuestionIndexBySubtopic[subtopic.id] || 0, subtopic.questions.length - 1);
      return { theme, subtopic, qIdx };
    }

    function subStats(sub) {
      let ans = 0, chk = 0, ok = 0;
      sub.questions.forEach(q => {
        const r = state.answers[q.id];
        if (r) {
          ans++;
          if (r.isChecked) { chk++; if (r.selectedIndex === q.correctIndex) ok++; }
        }
      });
      return { total: sub.questions.length, ans, chk, ok };
    }

    function renderSidebar() {
      const el = document.getElementById('sidebar');
      const { subtopic: activeSub } = getActive();
      let html = '';
      THEMES.forEach(t => {
        const isOpen = !!expandedThemes[t.id];
        let tAns = 0, tTot = 0;
        t.subtopics.forEach(s => { const st = subStats(s); tAns += st.ans; tTot += st.total; });
        html += '<div style="margin-bottom:6px;">';
        html += '<button class="theme-btn" data-toggle-theme="' + t.id + '"><span>' + t.code + ' · ' + t.shortTitle + '</span><span class="meta">' + tAns + '/' + tTot + '</span></button>';
        if (isOpen) {
          t.subtopics.forEach(s => {
            const st = subStats(s);
            const activeCls = s.id === activeSub.id ? ' active' : '';
            html += '<button class="sub-btn' + activeCls + '" data-theme="' + t.id + '" data-sub="' + s.id + '"><span><strong style="color:#B91C1C;">' + s.numberLabel + '.</strong> ' + s.title + '</span><span class="meta">' + st.ans + '/' + st.total + '</span></button>';
          });
        }
        html += '</div>';
      });
      el.innerHTML = html;
      el.querySelectorAll('[data-toggle-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-toggle-theme');
          expandedThemes[id] = !expandedThemes[id];
          renderSidebar();
        });
      });
      el.querySelectorAll('[data-sub]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.activeThemeId = btn.getAttribute('data-theme');
          state.activeSubtopicId = btn.getAttribute('data-sub');
          view = 'quiz';
          persist();
          render();
        });
      });
    }

    function renderHistory() {
      const main = document.getElementById('mainArea');
      const list = state.history || [];
      let html = '<h2 style="margin-top:0;">История попыток (' + list.length + ')</h2>';
      if (list.length === 0) {
        html += '<p class="meta">Пока нет завершённых попыток. Пройдите любой вопрос и нажмите «Сохранить результат» или «Завершить и проверить».</p>';
      } else {
        list.forEach(h => {
          const dt = new Date(h.completedAt).toLocaleString('ru-RU');
          html += '<div class="hist-item"><div class="row"><strong>' + h.themeCode + ' — ' + h.subtopicTitle + '</strong><span class="meta">' + dt + '</span></div>'
            + '<div class="meta" style="margin-top:4px;">Режим: ' + (h.mode === 'exam' ? 'Проверка' : 'Обучение') + ' · Результат: <strong>' + h.correctCount + '/' + h.totalCount + ' (' + h.percentage + '%)</strong></div></div>';
        });
      }
      main.innerHTML = html;
    }

    function renderQuiz() {
      const main = document.getElementById('mainArea');
      const { theme, subtopic, qIdx } = getActive();
      const q = subtopic.questions[qIdx];
      const rec = state.answers[q.id];
      const st = subStats(subtopic);

      let html = '<div class="row" style="margin-bottom:12px;">'
        + '<div><div class="meta">' + theme.code + ' · ' + theme.title + '</div><div class="q-red" style="margin-top:4px;">' + subtopic.numberLabel + '. ' + subtopic.title + '</div></div>'
        + '<div class="mode-switch">'
        + '<button id="modeTrain" class="' + (state.mode === 'training' ? 'active' : '') + '">Обучение</button>'
        + '<button id="modeExam" class="' + (state.mode === 'exam' ? 'active' : '') + '">Проверка</button>'
        + '</div></div>';

      html += '<div class="q-map">';
      subtopic.questions.forEach((item, i) => {
        const r = state.answers[item.id];
        let cls = 'q-dot';
        if (i === qIdx) cls += ' current';
        if (r) {
          if (r.isChecked) cls += (r.selectedIndex === item.correctIndex ? ' ok' : ' err');
          else cls += ' ans';
        }
        html += '<button class="' + cls + '" data-qidx="' + i + '">' + (i + 1) + '</button>';
      });
      html += '</div>';

      html += '<div class="meta">Вопрос ' + (qIdx + 1) + ' из ' + subtopic.questions.length + ' · Отвечено: ' + st.ans + '/' + st.total + (st.chk > 0 ? ' · Верно: ' + st.ok + '/' + st.chk : '') + '</div>';
      html += '<div class="q-title">' + q.question + '</div>';

      q.options.forEach((opt, idx) => {
        let cls = 'opt';
        if (rec) {
          if (rec.isChecked) {
            if (idx === q.correctIndex) cls += ' correct';
            else if (idx === rec.selectedIndex) cls += ' wrong';
          } else if (idx === rec.selectedIndex) {
            cls += ' selected';
          }
        }
        html += '<button class="' + cls + '" data-opt="' + idx + '"><span class="opt-letter">' + LETTERS[idx] + '</span><span>' + opt + '</span></button>';
      });

      if (rec && rec.isChecked) {
        const isOk = rec.selectedIndex === q.correctIndex;
        html += '<div class="explain"><strong style="color:' + (isOk ? '#047857' : '#B91C1C') + ';">' + (isOk ? '✓ Верно' : '✕ Ошибка') + '</strong>'
          + '<p style="margin:6px 0;">' + q.explanation + '</p>'
          + '<div class="meta">Основание: ' + q.reference + '</div></div>';
      }

      html += '<div class="row" style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border);">'
        + '<div style="display:flex; gap:8px;">'
        + '<button class="btn" id="btnPrev" ' + (qIdx === 0 ? 'disabled' : '') + '>← Назад</button>'
        + '<button class="btn btn-primary" id="btnNext" ' + (qIdx >= subtopic.questions.length - 1 ? 'disabled' : '') + '>Далее →</button>'
        + '</div>'
        + '<div style="display:flex; gap:8px;">'
        + '<button class="btn btn-accent" id="btnFinish">' + (state.mode === 'exam' ? 'Завершить и проверить' : 'Сохранить результат в историю') + '</button>'
        + '<button class="btn" id="btnResetSub">Сбросить тему</button>'
        + '</div></div>';

      main.innerHTML = html;

      document.getElementById('modeTrain').onclick = () => { state.mode = 'training'; persist(); render(); };
      document.getElementById('modeExam').onclick = () => { state.mode = 'exam'; persist(); render(); };
      main.querySelectorAll('[data-qidx]').forEach(b => {
        b.onclick = () => {
          state.activeQuestionIndexBySubtopic[subtopic.id] = Number(b.getAttribute('data-qidx'));
          persist();
          render();
        };
      });
      main.querySelectorAll('[data-opt]').forEach(b => {
        b.onclick = () => {
          const idx = Number(b.getAttribute('data-opt'));
          state.answers[q.id] = { selectedIndex: idx, isChecked: state.mode === 'training', updatedAt: Date.now() };
          persist();
          render();
        };
      });
      document.getElementById('btnPrev').onclick = () => {
        if (qIdx > 0) { state.activeQuestionIndexBySubtopic[subtopic.id] = qIdx - 1; persist(); render(); }
      };
      document.getElementById('btnNext').onclick = () => {
        if (qIdx < subtopic.questions.length - 1) { state.activeQuestionIndexBySubtopic[subtopic.id] = qIdx + 1; persist(); render(); }
      };
      document.getElementById('btnFinish').onclick = () => {
        let ok = 0;
        const details = [];
        subtopic.questions.forEach(item => {
          const r = state.answers[item.id];
          if (r) {
            r.isChecked = true;
            if (r.selectedIndex === item.correctIndex) ok++;
            details.push({ questionId: item.id, selectedIndex: r.selectedIndex, correctIndex: item.correctIndex });
          }
        });
        state.history = state.history || [];
        state.history.unshift({
          id: 'att_' + Date.now(),
          themeId: theme.id,
          themeCode: theme.code,
          subtopicId: subtopic.id,
          subtopicTitle: subtopic.numberLabel + '. ' + subtopic.title,
          mode: state.mode,
          correctCount: ok,
          totalCount: subtopic.questions.length,
          percentage: Math.round((ok / subtopic.questions.length) * 100),
          completedAt: Date.now(),
          details
        });
        persist();
        render();
      };
      document.getElementById('btnResetSub').onclick = () => {
        subtopic.questions.forEach(item => { delete state.answers[item.id]; });
        state.activeQuestionIndexBySubtopic[subtopic.id] = 0;
        persist();
        render();
      };
    }

    function render() {
      renderSidebar();
      if (view === 'history') renderHistory();
      else renderQuiz();
    }

    document.getElementById('tabQuiz').onclick = () => { view = 'quiz'; render(); };
    document.getElementById('tabHistory').onclick = () => { view = 'history'; render(); };
    document.getElementById('btnExport').onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ohrana-truda-progress.json';
      a.click();
      URL.revokeObjectURL(url);
    };
    document.getElementById('fileImport').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if (imported && imported.answers) { state = imported; persist(); render(); }
        } catch (err) {}
      };
      reader.readAsText(file);
    };

    render();
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Ohrana_Truda_Trenazher_Offline.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
