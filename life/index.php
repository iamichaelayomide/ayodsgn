<?php
declare(strict_types=1);
require __DIR__.'/../api/life/bootstrap.php';
life_headers();
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow"><title>My Life · ayo.dsgn</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Instrument+Sans:wght@500;600;700&family=Instrument+Serif:ital@0;1&display=swap">
  <link rel="stylesheet" href="./life.css?v=4"><script type="module" src="./app.js?v=4"></script>
</head>
<body>
  <div id="announcement" role="status" aria-live="polite"></div>
  <section id="auth" class="auth-screen">
    <a class="wordmark" href="/">ayo.<span>dsgn</span></a>
    <div class="auth-card"><p class="eyebrow">YOUR PRIVATE SPACE</p><h1>A little clarity.<br>A little <em>momentum.</em></h1>
    <p id="auth-copy">Sign in to your life planner.</p>
    <form id="auth-form">
      <label id="setup-label" hidden>One-time setup key<input name="token" type="password" autocomplete="off"></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" required maxlength="200"></label>
      <p id="auth-error" class="error" role="alert"></p><button class="primary" id="auth-submit" type="submit" disabled>Loading…</button>
    </form><p class="fine-print">Your ideas, your pace. A space just for you.</p></div>
  </section>
  <div id="workspace" class="workspace" hidden>
    <aside class="sidebar">
      <a class="wordmark" href="/">ayo.<span>dsgn</span></a>
      <p class="eyebrow">PERSONAL WORKSPACE</p>
      <nav aria-label="Planner views">
        <button data-view="board" aria-current="page"><span aria-hidden="true">▦</span> My board</button>
        <button data-view="week"><span aria-hidden="true">▤</span> This week</button>
        <button data-view="archive"><span aria-hidden="true">▱</span> Archive</button>
      </nav>
      <div class="sidebar-note"><span class="accent-line"></span><p>Make room for<br>what <em>matters.</em></p><small>One next step at a time.</small></div>
      <div class="sidebar-bottom"><a href="../api/life/?action=export" id="export">Export my data</a><button id="logout">Sign out</button></div>
    </aside>
    <main>
      <header class="topbar"><p>My Life <span>/</span> <span id="breadcrumb">My board</span></p><span id="save-status" role="status">All changes saved</span></header>
      <section class="page-heading"><div><p class="eyebrow" id="page-eyebrow">A SPACE TO MOVE FORWARD</p><h1 id="page-title">Your life, <em>in motion.</em></h1><p id="page-description">Capture the thought. Take the next step. Keep the bigger picture close.</p></div><button class="primary" id="new-task">+ New task</button></section>
      <section id="sprint-panel" class="sprint-panel" hidden><div><p class="eyebrow">THIS WEEK'S INTENTION</p><label for="sprint-goal">What would make this a good week?</label><textarea id="sprint-goal" rows="2" maxlength="2000" placeholder="Write one clear sprint goal…"></textarea><button id="save-goal" class="primary">Save sprint goal</button></div><div><div class="week-switch"><button id="previous-week" aria-label="Previous week">←</button><span id="week-range"></span><button id="next-week" aria-label="Next week">→</button></div><p id="sprint-progress"></p><button id="choose-tasks">Choose sprint tasks</button><button id="current-week">Back to this week</button></div></section>
      <section class="toolbar" aria-label="Board filters"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Find a task…" aria-label="Search tasks"></label><label><span class="sr-only">Priority filter</span><select id="priority-filter"><option value="">All priorities</option><option value="high">High priority</option><option value="normal">Normal priority</option><option value="low">Low priority</option></select></label><label><span class="sr-only">Label filter</span><select id="label-filter"><option value="">All labels</option></select></label><button id="clear-filters" hidden>Clear filters</button><span id="task-count"></span><button id="new-list">+ Add list</button><label class="mobile-list"><span class="sr-only">Visible list</span><select id="mobile-list"></select></label></section>
      <div id="board" class="board" aria-label="Task board"></div>
      <div id="archive" hidden></div>
      <p class="board-footnote" id="board-footnote">Drag cards to move them, or open a task and choose its list.</p>
      <div id="page-error" class="error" role="alert" hidden></div>
      <button id="reload" class="reload" hidden>Load latest board — keep my draft</button>
    </main>
  </div>
  <dialog id="task-dialog" aria-labelledby="task-dialog-title">
    <form id="task-form"><div class="dialog-heading"><div><p class="eyebrow">ONE NEXT STEP</p><h2 id="task-dialog-title">New task</h2></div><button type="button" data-close aria-label="Close task">×</button></div>
      <input type="hidden" name="id"><label>Task title<input name="title" required maxlength="200" placeholder="What do you want to do?"></label>
      <div class="field-row"><label>List<select name="listId"></select></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option></select></label></div>
      <label>Position in list<input name="position" type="number" min="1" max="5001" value="1"><small>1 places the task at the top. Use this to reorder without dragging.</small></label>
      <div class="field-row"><label>Due date<input name="dueDate" type="date"></label><label>Labels<input name="labels" maxlength="410" placeholder="Work, Personal, Learning"></label></div>
      <label>Notes<textarea name="notes" rows="4" maxlength="20000" placeholder="Give this thought a little context…"></textarea></label>
      <label>What's blocking this?<textarea name="blocker" rows="2" maxlength="2000" placeholder="Optional — name the thing in your way"></textarea></label>
      <div class="checklist-heading"><h3>Checklist</h3><button type="button" id="add-checklist">+ Add item</button></div><div id="checklist"></div>
      <label class="checkbox-label"><input name="inSprint" type="checkbox"> Include in the selected week's sprint</label>
      <p id="task-error" class="error" role="alert"></p><button type="button" data-reload hidden>Load latest board — keep my draft</button><div class="dialog-actions"><button type="button" id="archive-task" class="danger" hidden>Archive task</button><button type="button" data-close>Cancel</button><button type="submit" class="primary">Save task</button></div>
    </form>
  </dialog>
  <dialog id="list-dialog" aria-labelledby="list-dialog-title"><form id="list-form"><div class="dialog-heading"><h2 id="list-dialog-title">Add list</h2><button type="button" data-close aria-label="Close list">×</button></div><input type="hidden" name="id"><label>List name<input name="name" required maxlength="80"></label><p id="list-error" class="error" role="alert"></p><button type="button" data-reload hidden>Load latest board — keep my draft</button><div class="dialog-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save list</button></div></form></dialog>
  <dialog id="sprint-dialog" aria-labelledby="sprint-dialog-title"><form id="sprint-form"><div class="dialog-heading"><h2 id="sprint-dialog-title">Choose sprint tasks</h2><button type="button" data-close aria-label="Close sprint selection">×</button></div><p>Choose what you will focus on. These remain the same tasks on your board.</p><div id="sprint-choices"></div><p id="sprint-error" class="error" role="alert"></p><button type="button" data-reload hidden>Load latest board — keep my draft</button><div class="dialog-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save selection</button></div></form></dialog>
  <dialog id="confirm-dialog" aria-labelledby="confirm-title"><div class="dialog-heading"><h2 id="confirm-title">Archive this item?</h2></div><p>You can restore it from Archive.</p><div class="dialog-actions"><button id="confirm-cancel">Cancel</button><button id="confirm-yes" class="primary">Archive</button></div></dialog>
</body></html>
