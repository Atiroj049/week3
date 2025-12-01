document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addTaskForm');
  const titleInput = document.getElementById('taskTitle');
  const descInput = document.getElementById('taskDescription');
  const prioInput = document.getElementById('taskPriority');
  const statusFilter = document.getElementById('statusFilter');
  const todoList = document.getElementById('todoTasks');
  const progressList = document.getElementById('progressTasks');
  const doneList = document.getElementById('doneTasks');
  const todoCount = document.getElementById('todoCount');
  const progressCount = document.getElementById('progressCount');
  const doneCount = document.getElementById('doneCount');
  const loading = document.getElementById('loadingOverlay');

  function showLoading(v){ if (loading) loading.style.display = v ? 'flex' : 'none'; }

  async function fetchTasks(){
    try{
      showLoading(true);
      const q = statusFilter && statusFilter.value ? `?status=${encodeURIComponent(statusFilter.value)}` : '';
      const res = await fetch(`/api/tasks${q}`);
      if (!res.ok) throw new Error(await res.text());
      const tasks = await res.json();
      renderTasks(tasks);
    }catch(err){
      console.error(err);
      alert('Failed to load tasks: ' + (err.message || err));
    }finally{ showLoading(false); }
  }

  function clearLists(){ todoList.innerHTML=''; progressList.innerHTML=''; doneList.innerHTML=''; }

  function createCard(task){
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.id = task.id;
    card.innerHTML = `
      <div class="task-header">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <span class="priority-badge priority-${(task.priority||'MEDIUM').toLowerCase()}">${escapeHtml(task.priority)}</span>
      </div>
      <div class="task-description">${escapeHtml(task.description||'')}</div>
      <div class="task-meta">Created: ${new Date(task.createdAt).toLocaleString()}</div>
    `;
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const statusBtn = document.createElement('button');
    statusBtn.className = 'btn btn-success btn-sm';
    if (task.status === 'TODO') statusBtn.textContent = '→ Start';
    else if (task.status === 'IN_PROGRESS') statusBtn.textContent = '→ Done';
    else statusBtn.textContent = '↺ Reopen';

    statusBtn.addEventListener('click', async () => {
      try {
        const next = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
        const res = await fetch(`/api/tasks/${task.id}/status`, {
          method:'PUT',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ status: next })
        });
        if (!res.ok) throw new Error(await res.text());
        await fetchTasks();
      } catch(err){ console.error(err); alert('Failed to update status'); }
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.textContent = '🗑️ Delete';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this task?')) return;
      try {
        const res = await fetch(`/api/tasks/${task.id}`, { method:'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error(await res.text());
        await fetchTasks();
      } catch(err){ console.error(err); alert('Failed to delete'); }
    });

    actions.appendChild(statusBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);
    return card;
  }

  function renderTasks(tasks){
    clearLists();
    let t=0,p=0,d=0;
    tasks.forEach(task=>{
      const card = createCard(task);
      if (task.status === 'TODO'){ todoList.appendChild(card); t++; }
      else if (task.status === 'IN_PROGRESS'){ progressList.appendChild(card); p++; }
      else { doneList.appendChild(card); d++; }
    });
    todoCount.textContent = t;
    progressCount.textContent = p;
    doneCount.textContent = d;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title){ alert('Title is required'); return; }
    const payload = { title, description: descInput.value.trim(), priority: prioInput.value };
    try {
      showLoading(true);
      const res = await fetch('/api/tasks', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if (!res.ok) { const txt = await res.text().catch(()=>res.statusText); throw new Error(txt || 'Server error'); }
      titleInput.value=''; descInput.value=''; prioInput.value='MEDIUM';
      await fetchTasks();
    } catch(err){ console.error(err); alert('Failed to create task: ' + (err.message||err)); }
    finally { showLoading(false); }
  });

  if (statusFilter) statusFilter.addEventListener('change', fetchTasks);

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  fetchTasks();
});