/* Source inline script 1 */


/* ============================================================
   PROFESSIONAL UX STATE
============================================================ */

let sidebarCollapsed = localStorage.getItem("naveen_sidebar_collapsed") === "1";
let focusInterval = null;
let focusSeconds = 25 * 60;
let focusRunning = false;
let commandIndex = 0;

const commandItems = [
  {label:"New Task", detail:"Create a new task", action:()=>{switchView("tasks");openTaskModal();}},
  {label:"Dashboard", detail:"Go to dashboard", action:()=>switchView("dashboard")},
  {label:"Tasks", detail:"Open task manager", action:()=>switchView("tasks")},
  {label:"Brainstorming", detail:"Open sticky-note board", action:()=>switchView("brainstorm")},
  {label:"Proofs", detail:"Open proof wall", action:()=>switchView("proofs")},
  {label:"Calendar", detail:"Open calendar", action:()=>switchView("calendar")},
  {label:"Settings", detail:"Open workspace settings", action:()=>switchView("settings")},
  {label:"Toggle Theme", detail:"Switch dark / warm light", action:()=>{const light=document.body.classList.contains("light");setTheme(light?"dark":"light");}},
  {label:"Focus Mode", detail:"Start a 25 minute session", action:()=>startFocusFromTask()},
  {label:"Add Sticky Note", detail:"Create a new idea", action:()=>{switchView("brainstorm");addSticky();}}
];

function toast(message,type="success"){
  const stack=$("toastStack");
  const el=document.createElement("div");
  el.className=`toast ${type}`;
  el.innerHTML=`<span>${type==="error"?"✕":"✓"}</span><span>${escapeHtml(message)}</span><button class="close">×</button>`;
  el.querySelector(".close").onclick=()=>el.remove();
  stack.appendChild(el);
  setTimeout(()=>el.remove(),3200);
}

function updateGreeting(){
  const hour=new Date().getHours();
  const part=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const pending=tasks.filter(t=>t.status!=="completed").length;
  const overdue=tasks.filter(isOverdue).length;

  $("greetingLine").textContent =
    pending
      ? `${part}, ${window.NEXA_DISPLAY_NAME || "there"}. ${pending} task${pending===1?"":"s"} left${overdue?` · ${overdue} overdue`:""}`
      : `${part}, ${window.NEXA_DISPLAY_NAME || "there"}. Nothing pending. Time to build something.`;
}

function toggleSidebar(){
  sidebarCollapsed=!sidebarCollapsed;
  document.querySelector(".app").classList.toggle("sidebar-collapsed",sidebarCollapsed);
  localStorage.setItem("naveen_sidebar_collapsed",sidebarCollapsed?"1":"0");
}

function initSidebar(){
  document.querySelector(".app").classList.toggle("sidebar-collapsed",sidebarCollapsed);
}

function renderCommands(query=""){
  const results=$("commandResults");
  const q=query.trim().toLowerCase();

  const matches=commandItems.filter(item =>
    !q ||
    item.label.toLowerCase().includes(q) ||
    item.detail.toLowerCase().includes(q)
  );

  commandIndex=Math.min(commandIndex,Math.max(0,matches.length-1));

  results.innerHTML=matches.length
    ? matches.map((item,i)=>`
      <button class="command-item ${i===commandIndex?"active":""}" data-command-index="${i}">
        <span>${escapeHtml(item.label)}</span>
        <small>${escapeHtml(item.detail)}</small>
      </button>
    `).join("")
    : `<div style="padding:18px;color:#948b80;font-size:12px">No command found.</div>`;

  results.querySelectorAll("[data-command-index]").forEach(btn=>{
    btn.onclick=()=>{
      const item=matches[Number(btn.dataset.commandIndex)];
      closeCommandPalette();
      item?.action();
    };
  });

  return matches;
}

function openCommandPalette(){
  $("commandPalette").style.display="flex";
  $("commandInput").value="";
  commandIndex=0;
  renderCommands("");
  setTimeout(()=>$("commandInput").focus(),30);
}

function closeCommandPalette(){
  $("commandPalette").style.display="none";
}

function updateFocusDisplay(){
  const m=Math.floor(focusSeconds/60);
  const s=focusSeconds%60;
  $("focusTimer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function stopFocusInterval(){
  if(focusInterval){
    clearInterval(focusInterval);
    focusInterval=null;
  }
}

function startFocus(){
  if(focusRunning) return;
  if(typeof focusStartedAt === "undefined" || !focusStartedAt) focusStartedAt=new Date().toISOString();
  focusRunning=true;
  $("focusStart").textContent="Pause";
  focusInterval=setInterval(()=>{
    if(focusSeconds<=0){
      stopFocusInterval();
      focusRunning=false;
      $("focusStart").textContent="Start";
      const session={id:crypto.randomUUID(),minutes:25,startedAt:focusStartedAt||new Date().toISOString(),completedAt:new Date().toISOString()};
      const sessions=(typeof load === "function" ? load("naveen_focus_sessions_v1",[]) : []);
      sessions.push(session);
      localStorage.setItem("naveen_focus_sessions_v1",JSON.stringify(sessions));
      focusStartedAt=null;
      toast("Focus session complete. Nice work.");
      return;
    }
    focusSeconds--;
    updateFocusDisplay();
  },1000);
}

function pauseFocus(){
  stopFocusInterval();
  focusRunning=false;
  $("focusStart").textContent="Start";
}

function resetFocus(){
  pauseFocus();
  focusStartedAt=null;
  focusSeconds=25*60;
  updateFocusDisplay();
}

function openFocusModal(task){
  $("focusTitle").textContent=task?.title || "Focus Session";
  $("focusDescription").textContent=task?.description || "Stay with the next useful thing.";
  $("focusModal").style.display="flex";
  resetFocus();
}

function startFocusFromTask(){
  const task=tasks.find(t=>t.status!=="completed");
  if(!task){
    toast("No pending task to focus on.","error");
    return;
  }
  openFocusModal(task);
}

function startFocusFromTaskId(id){
  const task=tasks.find(t=>t.id===id);
  if(task) openFocusModal(task);
}

/* ============================================================
   DATA
============================================================ */

const KEYS = {
  TASKS: "naveen_spa_tasks_v3",
  NOTES: "naveen_spa_notes_v3",
  CONNECTORS: "naveen_spa_connectors_v3",
  THEME: "naveen_spa_theme_v3"
};

const quotes = [
  {text:"The strong are always kind.", source:"Vagabond — Volume 25"},
  {text:"Invincible is just a word.", source:"Vagabond — Volume 8"},
  {text:"There is no light for those who do not know darkness.", source:"Vagabond — Volume 2"},
  {text:"Ultimately... we're all alone in this world.", source:"Vagabond — Volume 25"},
  {text:"A quiet mind sees what a restless mind misses.", source:"Vagabond — inspired"},
  {text:"Real strength begins when you stop proving you are strong.", source:"Vagabond — inspired"},
  {text:"The path becomes clear when you keep walking it.", source:"Vagabond — inspired"},
  {text:"Defeat can teach what victory hides.", source:"Vagabond — inspired"},
  {text:"Knowing yourself is harder than defeating another man.", source:"Vagabond — inspired"},
  {text:"A sword is only as calm as the hand that holds it.", source:"Vagabond — inspired"},
  {text:"Ego makes noise. Understanding makes silence.", source:"Vagabond — inspired"},
  {text:"The man who fears loss has already lost his freedom.", source:"Vagabond — inspired"},
  {text:"Growth is often just pain understood later.", source:"Vagabond — inspired"},
  {text:"Peace is not weakness; it is strength without anger.", source:"Vagabond — inspired"},
  {text:"You do not master the mountain by hating its height.", source:"Vagabond — inspired"},
  {text:"The greatest opponent is often the self you refuse to face.", source:"Vagabond — inspired"},
  {text:"Power without control turns strength into ruin.", source:"Vagabond — inspired"},
  {text:"A person can change the moment they stop running from truth.", source:"Vagabond — inspired"},
  {text:"The deeper the roots, the quieter the tree.", source:"Vagabond — inspired"},
  {text:"You become stronger when you no longer need to be feared.", source:"Vagabond — inspired"},
  {text:"Every battle leaves a lesson behind.", source:"Vagabond — inspired"},
  {text:"Peace with yourself is harder than victory over another.", source:"Vagabond — inspired"},
  {text:"The strongest step is sometimes choosing not to strike.", source:"Vagabond — inspired"},
  {text:"Pain can sharpen you, but only wisdom can guide you.", source:"Vagabond — inspired"},
  {text:"Do not chase the image of strength; build the real thing.", source:"Vagabond — inspired"},
  {text:"A lonely road can still lead to a meaningful life.", source:"Vagabond — inspired"},
  {text:"Understanding another person starts with understanding yourself.", source:"Vagabond — inspired"},
  {text:"The need to win can become its own kind of weakness.", source:"Vagabond — inspired"},
  {text:"The journey changes the man more than the destination does.", source:"Vagabond — inspired"},
  {text:"When the mind becomes still, even fear loses its voice.", source:"Vagabond — inspired"}
];

let quoteBag = [];
function refillQuoteBag(){
  quoteBag = quotes.map((_,i)=>i);
  for(let i=quoteBag.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [quoteBag[i],quoteBag[j]]=[quoteBag[j],quoteBag[i]];
  }
}


let tasks = load(KEYS.TASKS, []);
let notes = load(KEYS.NOTES, []);
let connectors = load(KEYS.CONNECTORS, []);
let activeView = "dashboard";
let taskFilter = "all";
let editingTaskId = null;
let proofTaskId = null;
let proofData = null;
let brainTool = "select";
let draggingNote = null;
let selectedNoteId = null;
let connectorStart = null;


/* ============================================================
   HELPERS
============================================================ */

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Storage save failed:", error);
    if (typeof toast === "function") {
      toast("Storage is full. Remove old proof images or data.", "error");
    }
    return false;
  }
}

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

async function compressProofImage(dataUrl, maxDimension=1600, quality=0.78) {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
      const ctx = canvas.getContext("2d", {alpha:false});
      if (!ctx) { reject(new Error("Canvas unavailable")); return; }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Could not decode proof image"));
    img.src = dataUrl;
  });
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value+"T00:00:00").toLocaleDateString(undefined,{
    day:"2-digit",month:"short",year:"numeric"
  });
}

function formatShortDate(value) {
  if (!value) return "";
  return new Date(value+"T00:00:00").toLocaleDateString(undefined,{
    day:"2-digit",month:"short"
  });
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString(undefined,{
    hour:"2-digit",minute:"2-digit",hour12:false
  });
}

function todayKey() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,"0"),
    String(d.getDate()).padStart(2,"0")
  ].join("-");
}

function parseLocalDateTime(dateValue, timeValue = "23:59:59") {
  if (!dateValue) return null;
  const datePart = String(dateValue).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;

  const rawTime = String(timeValue || "23:59:59").trim();
  const timePart = /^\d{2}:\d{2}$/.test(rawTime)
    ? `${rawTime}:00`
    : /^\d{2}:\d{2}:\d{2}$/.test(rawTime)
      ? rawTime
      : null;

  if (!timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const parsed = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function reminderDate(task) {
  if (!task.reminderDate || !task.reminderTime) return null;
  return parseLocalDateTime(task.reminderDate, task.reminderTime);
}

function taskScheduleDate(task) {
  const reminder = reminderDate(task);
  if (reminder) return reminder;
  if (task.dueDate) return parseLocalDateTime(task.dueDate, "23:59:59");
  return null;
}

function isOverdue(task) {
  const target = taskScheduleDate(task);
  return task.status !== "completed" && target && target.getTime() < Date.now();
}

function countdown(task) {
  const target = taskScheduleDate(task);
  if (!target) return "No schedule";

  let diff = target.getTime() - Date.now();

  if (diff <= 0) {
    diff = Math.abs(diff);
    const minutes = Math.floor(diff/60000);
    if (minutes >= 60) return `Overdue by ${Math.floor(minutes/60)}h ${minutes%60}m`;
    return `Overdue by ${minutes}m`;
  }

  const total = Math.floor(diff/1000);
  const days = Math.floor(total/86400);
  const hours = Math.floor((total%86400)/3600);
  const minutes = Math.floor((total%3600)/60);
  const seconds = total%60;

  if (days) return `In ${days}d ${hours}h`;
  if (hours) return `In ${hours}h ${minutes}m`;
  if (minutes) return `In ${minutes}m ${seconds}s`;
  return `In ${seconds}s`;
}

function priorityClass(p) {
  return p === "high" ? "high" : p === "medium" ? "medium" : "low";
}


/* ============================================================
   QUOTE
============================================================ */

function setQuote() {
  if(!quoteBag.length) refillQuoteBag();
  const q = quotes[quoteBag.shift()];
  $("heroQuote").textContent = `“${q.text}”`;
  $("heroQuoteSource").textContent = `— ${q.source}`;
  $("sidebarQuote").textContent = q.text;
  $("sidebarQuoteSource").textContent = `— ${q.source}`;
}


/* ============================================================
   CLOCK
============================================================ */

function updateClock() {
  const d = new Date();
  $("clock").textContent =
    `${String(d.getHours()).padStart(2,"0")}:`+
    `${String(d.getMinutes()).padStart(2,"0")}:`+
    `${String(d.getSeconds()).padStart(2,"0")}`;
}
refillQuoteBag();
setQuote();
updateClock();
setInterval(updateClock,1000);
setInterval(setQuote,14000);


/* ============================================================
   NAVIGATION
============================================================ */

const viewNames = {
  dashboard:"Dashboard",
  tasks:"Tasks",
  brainstorm:"Brainstorming",
  proofs:"Proofs",
  calendar:"Calendar",
  notes:"Knowledge",
  settings:"Settings"
};

function switchView(view) {
  activeView = view;

  document.querySelectorAll(".view").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === `view-${view}`
    );
  });

  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });

  $("breadcrumb").textContent =
    `Workspace / ${viewNames[view]}`;

  if (view === "proofs") renderProofs();
  if (view === "calendar") renderCalendar();
  if (view === "dashboard") renderDashboard();
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click",() => switchView(button.dataset.view));
});


/* ============================================================
   THEME
============================================================ */

function setTheme(theme) {
  document.body.classList.toggle("light",theme === "light");
  save(KEYS.THEME,theme);

  $("themeTop").textContent =
    theme === "light" ? "☾" : "☀︎";

  document.querySelectorAll("[data-theme-choice]").forEach(b => {
    b.classList.toggle(
      "active",
      b.dataset.themeChoice === theme
    );
  });
}

const savedTheme = localStorage.getItem(KEYS.THEME) || "dark";
setTheme(savedTheme);

async function requestThemeChange(theme){
  const current=document.body.classList.contains("light")?"light":"dark";
  if(theme===current)return;
  if(theme==="light") {
    const ok=await nexaConfirm("Warm Light increases overall brightness and contrast. Your eyes may experience a brief flash while the theme changes.", {title:"Switch to Warm Light?", kicker:"APPEARANCE", confirmText:"Switch to Light", cancelText:"Stay Dark"});
    if(!ok)return;
  }
  setTheme(theme);
}

$("themeTop").addEventListener("click",() => {
  const light = document.body.classList.contains("light");
  void requestThemeChange(light ? "dark" : "light");
});

document.querySelectorAll("[data-theme-choice]").forEach(button => {
  button.addEventListener("click",() => {
    void requestThemeChange(button.dataset.themeChoice);
  });
});


/* ============================================================
   TASK MODAL
============================================================ */

function openTaskModal(task=null) {
  editingTaskId = task?.id || null;

  $("taskModalTitle").textContent =
    task ? "Edit Task" : "Add Task";

  $("taskId").value = task?.id || "";
  $("taskTitle").value = task?.title || "";
  $("taskDescription").value = task?.description || "";
  $("taskPriority").value = task?.priority || "medium";
  $("taskDueDate").value = task?.dueDate || "";
  $("taskReminderDate").value = task?.reminderDate || "";
  $("taskReminderTime").value = task?.reminderTime || "";

  $("taskModal").style.display = "grid";
  setTimeout(() => $("taskTitle").focus(),40);
}

function closeTaskModal() {
  $("taskModal").style.display = "none";
  $("taskForm").reset();
  editingTaskId = null;
}

$("taskForm").addEventListener("submit",event => {
  event.preventDefault();

  const title = $("taskTitle").value.trim();
  if (!title) return;

  const existing = editingTaskId
    ? tasks.find(t => t.id === editingTaskId)
    : null;

  const task = {
    id: existing?.id || crypto.randomUUID(),
    title,
    description: $("taskDescription").value.trim(),
    priority: $("taskPriority").value,
    dueDate: $("taskDueDate").value,
    reminderDate: $("taskReminderDate").value,
    reminderTime: $("taskReminderTime").value,
    status: existing?.status || "pending",
    proofDataUrl: existing?.proofDataUrl || null,
    completedAt: existing?.completedAt || null,
    remindedAt: existing?.remindedAt || null,
    createdAt: existing?.createdAt || new Date().toISOString()
  };

  tasks = existing
    ? tasks.map(t => t.id === editingTaskId ? task : t)
    : [task,...tasks];

  save(KEYS.TASKS,tasks);
  closeTaskModal();
  renderAll();
  toast(existing ? "Task updated." : "Task created.");
});

$("closeTaskModal").onclick = closeTaskModal;
$("cancelTask").onclick = closeTaskModal;
$("quickAddTop").onclick = () => {
  switchView("tasks");
  openTaskModal();
};
$("tasksAdd").onclick = () => openTaskModal();


/* ============================================================
   TASK RENDERING
============================================================ */

function filteredTasks() {
  let result = tasks.filter(task => {
    if (taskFilter === "pending") return task.status !== "completed";
    if (taskFilter === "completed") return task.status === "completed";
    return true;
  });

  return result.sort((a,b) => {
    if (a.status !== b.status)
      return a.status === "completed" ? 1 : -1;

    const ad = taskScheduleDate(a)?.getTime() || Infinity;
    const bd = taskScheduleDate(b)?.getTime() || Infinity;

    return ad-bd;
  });
}

function taskCard(task) {
  const overdue = isOverdue(task);

  return `
    <article class="task-card ${task.status==="completed" ? "completed":""}">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          ${
            task.description
            ? `<p class="task-desc">${escapeHtml(task.description)}</p>`
            : ""
          }
        </div>

        <span class="badge ${priorityClass(task.priority)}">
          ${task.priority}
        </span>
      </div>

      <div class="task-meta">
        <span class="badge">Due: ${task.dueDate ? formatShortDate(task.dueDate) : "—"}</span>
        <span class="badge">${task.reminderDate ? "Reminder "+formatShortDate(task.reminderDate)+" "+task.reminderTime : "No reminder"}</span>
        ${
          task.status==="completed"
          ? `<span class="badge done">✓ ${formatTime(task.completedAt)}</span>`
          : `<span class="badge ${overdue?"overdue":""}">${countdown(task)}</span>`
        }
        ${overdue ? `<span class="badge overdue">OVERDUE</span>` : ""}
      </div>

      ${
        task.proofDataUrl
        ? `
          <div style="display:flex;align-items:center;gap:8px;margin-top:9px;color:#8f877b;font-size:9px">
            Proof:
            <img class="task-thumb" src="${task.proofDataUrl}" data-proof-view="${task.id}" alt="Proof">
          </div>
        `
        : ""
      }

      <div class="task-actions">
        ${
          task.status==="completed"
          ? `<button class="task-action proof" data-action="view-proof" data-id="${task.id}">View Proof</button>`
          : `<button class="task-action proof" data-action="proof" data-id="${task.id}">Upload Proof</button>
             ${task.priority === "low" && localStorage.getItem("nexa_quick_complete_low")==="1" ? `<button class="task-action quick-complete-action" data-action="quick-complete" data-id="${task.id}">Quick complete</button>` : ""}`
        }
        <button class="task-action" data-action="focus" data-id="${task.id}">Focus</button>
        <button class="task-action" data-action="calendar" data-id="${task.id}">Set Reminder</button>
        <button class="task-action" data-action="duplicate" data-id="${task.id}">Duplicate</button>
        <button class="task-action" data-action="edit" data-id="${task.id}">Edit</button>
        <button class="task-action danger" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderTaskList(targetId, list) {
  const el = $(targetId);

  if (!list.length) {
    el.innerHTML = `<div class="task-empty">Nothing pending. Time to build something.</div>`;
    return;
  }

  el.innerHTML = list.map(taskCard).join("");

  el.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click",() => {
      taskAction(
        button.dataset.action,
        button.dataset.id
      );
    });
  });

  el.querySelectorAll("[data-proof-view]").forEach(image => {
    image.addEventListener("click",() => {
      const task = tasks.find(t => t.id === image.dataset.proofView);
      if (task) openProofViewer(task);
    });
  });
}

function renderTasks() {
  renderTaskList(
    "mainTaskList",
    filteredTasks()
  );

  const today = todayKey();

  $("taskToday").textContent =
    tasks.filter(t => t.dueDate===today || t.reminderDate===today).length;

  $("taskPending").textContent =
    tasks.filter(t => t.status!=="completed").length;

  $("taskOverdue").textContent =
    tasks.filter(isOverdue).length;

  $("taskCompleted").textContent =
    tasks.filter(t => t.status==="completed").length;
}

document.querySelectorAll(".task-filter").forEach(button => {
  button.addEventListener("click",() => {
    taskFilter = button.dataset.filter;

    document.querySelectorAll(".task-filter").forEach(b =>
      b.classList.remove("active")
    );

    button.classList.add("active");
    renderTasks();
  });
});


/* ============================================================
   TASK ACTIONS
============================================================ */

async function taskAction(action,id) {
  const task = tasks.find(t => t.id===id);
  if (!task) return;

  if (action==="quick-complete") {
    if (task.priority !== "low" && !localStorage.getItem("nexa_quick_complete_low")) return;
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    task.proofDataUrl = null;
    save(KEYS.TASKS,tasks);
    renderAll();
    toast("Task completed — proof wasn’t required for this low-stakes task.");
    return;
  }

  if (action==="proof") openProofModal(task);

  if (action==="view-proof") openProofViewer(task);

  if (action==="focus") startFocusFromTaskId(id);

  if (action==="calendar") {
    createCalendarEvent(task);
    toast("Google Calendar event opened.");
  }

  if (action==="edit") openTaskModal(task);

  if (action==="duplicate") {
    const copy = {
      ...task,
      id:crypto.randomUUID(),
      title:task.title+" (Copy)",
      status:"pending",
      proofDataUrl:null,
      completedAt:null,
      remindedAt:null,
      createdAt:new Date().toISOString()
    };

    tasks.unshift(copy);
    save(KEYS.TASKS,tasks);
    renderAll();
    toast("Task duplicated.");
  }

  if (action==="delete") {
    if (!(await nexaConfirm(`Delete "${task.title}"?`, {title:"Delete task",kicker:"TASK",danger:true}))) return;

    tasks = tasks.filter(t => t.id!==id);
    save(KEYS.TASKS,tasks);
    renderAll();
    toast("Task deleted.");
  }
}


/* ============================================================
   GOOGLE CALENDAR FALLBACK
============================================================ */

function calendarDate(date,time) {
  const [y,m,d]=date.split("-");
  const [h,min]=time.split(":");
  return `${y}${m}${d}T${h}${min}00`;
}

function add30(time) {
  let [h,m]=time.split(":").map(Number);
  let total=h*60+m+30;
  total%=1440;
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}

function createCalendarEvent(task) {
  if (!task.reminderDate || !task.reminderTime) {
    void nexaAlert("Set a reminder date and time first.", {title:"Reminder details", kicker:"CALENDAR"});
    return;
  }

  const start=calendarDate(task.reminderDate,task.reminderTime);
  const end=calendarDate(task.reminderDate,add30(task.reminderTime));

  const url=new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action","TEMPLATE");
  url.searchParams.set("text",task.title);
  url.searchParams.set("dates",`${start}/${end}`);
  url.searchParams.set(
    "details",
    task.description || "Task reminder from Naveen Workspace."
  );

  window.open(url.toString(),"_blank","noopener,noreferrer");
}


/* ============================================================
   PROOF SYSTEM
============================================================ */

function openProofModal(task, replacing=false) {
  proofTaskId=task.id;
  proofData=null;
  $("proofInput").value="";
  $("proofPreview").style.display="none";
  $("submitProof").disabled=true;
  $("submitProof").textContent=replacing?"Replace Proof":"Submit Proof";
  $("proofModalTitle").textContent=replacing?"Replace the proof.":"Show the work.";
  $("proofModalHelp").textContent=replacing
    ? "Upload a clearer or newer piece of evidence for this completed task."
    : "Upload the evidence that proves the task is done.";
  $("proofModal").style.display="grid";
}

function closeProofModal() {
  $("proofModal").style.display="none";
  proofTaskId=null;
  proofData=null;
}

$("closeProofModal").onclick=closeProofModal;
$("cancelProof").onclick=closeProofModal;

$("proofInput").addEventListener("change",event => {
  const file=event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    void nexaAlert("Please select a valid image file.", {title:"Invalid proof", kicker:"PROOF"});
    return;
  }
  if (file.size>5*1024*1024) {
    void nexaAlert("Please keep the proof image below 5 MB.", {title:"Image too large", kicker:"PROOF"});
    return;
  }
  const reader=new FileReader();
  reader.onload=async e => {
    try {
      proofData = await compressProofImage(e.target.result);
      $("proofPreview").src = proofData;
      $("proofPreview").style.display = "block";
      $("submitProof").disabled = false;
    } catch (error) {
      console.error("Proof image compression failed:", error);
      proofData = null;
      $("proofPreview").style.display = "none";
      $("submitProof").disabled = true;
      toast("Could not process that proof image.", "error");
    }
  };
  reader.readAsDataURL(file);
});

$("submitProof").onclick = async () => {
  const completedId = proofTaskId;
  if (!completedId || !proofData) return;
  const completedAt = new Date().toISOString();
  const isReplacing = $("proofModalTitle").textContent.includes("Replace");
  $("submitProof").disabled=true;
  $("submitProof").textContent=isReplacing?"Replacing…":"Saving…";

  tasks = tasks.map(task =>
    task.id === completedId
      ? { ...task, status:"completed", proofDataUrl:proofData, completedAt }
      : task
  );

  const completedTask = tasks.find(task => task.id === completedId);
  if (!completedTask) { closeProofModal(); return; }

  if (completedTask.recurring && completedTask.recurring !== "none" && !isReplacing) {
    const base = new Date(completedTask.dueDate || todayKey()+"T00:00:00");
    base.setDate(base.getDate() + (completedTask.recurring === "weekly" ? 7 : 1));
    const nextDate = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}-${String(base.getDate()).padStart(2,"0")}`;
    const next = {
      ...completedTask,
      id: crypto.randomUUID(),
      status: "pending",
      proofDataUrl: null,
      proofPath: null,
      completedAt: null,
      remindedAt: null,
      dueDate: nextDate,
      reminderDate: nextDate,
      createdAt: new Date().toISOString(),
      subtasks: (completedTask.subtasks || []).map(s => ({ ...s, done:false }))
    };
    tasks.unshift(next);
  }

  save(KEYS.TASKS, tasks);
  // Give the cloud bridge one chance to persist the proof immediately; localStorage remains the fallback.
  try{
    if(window.NEXA_SYNC_PROOF_NOW) await window.NEXA_SYNC_PROOF_NOW(completedTask);
  }catch(error){
    console.warn("Immediate proof sync skipped; background sync will retry.",error);
    toast(friendlyCloudError(error),"error");
  }
  closeProofModal();
  renderAll();
  toast(isReplacing?"Proof replaced successfully.":(completedTask.recurring&&completedTask.recurring!=="none"?`Proof submitted. Next ${completedTask.recurring} task scheduled.`:"Proof submitted. Task completed."));
};

function openProofViewer(task) {
  if (!task?.proofDataUrl) return;
  $("proofLargeImage").src=task.proofDataUrl;
  $("proofViewerTitle").textContent=task.title||"Proof";
  $("proofViewerMeta").textContent=`${task.category||"Project"} · ${task.completedAt?new Date(task.completedAt).toLocaleString():"Completed"}`;
  $("proofViewerReplace").onclick=()=>{ $("proofViewer").style.display="none"; openProofModal(task,true); };
  $("proofViewerDelete").onclick=()=>deleteProofForTask(task);
  $("proofViewer").style.display="grid";
}

async function deleteProofForTask(task){
  if(!task)return;
  const ok=await nexaConfirm(`Delete the proof for “${task.title||"this task"}”? The task will remain completed, but its evidence will be removed.`,{title:"Delete proof",kicker:"PROOFS",danger:true});
  if(!ok)return;
  try{
    if(window.NEXA_DELETE_PROOF_CLOUD) await window.NEXA_DELETE_PROOF_CLOUD(task);
  }catch(error){
    console.warn("Cloud proof delete failed",error);
    toast(friendlyCloudError(error),"error");
    return;
  }
  task.proofDataUrl=null;
  task.proofPath=null;
  save(KEYS.TASKS,tasks);
  $("proofViewer").style.display="none";
  renderAll();
  toast("Proof deleted.");
}

$("closeProofViewer").onclick=() => { $("proofViewer").style.display="none"; };



/* ============================================================
   BRAINSTORMING
============================================================ */


/* ============================================================
   BRAINSTORMING — FIRST VERSION BOARD
============================================================ */

const BRAIN_KEY = KEYS.NOTES;
const CONNECTOR_KEY = KEYS.CONNECTORS;

let brainNotes = notes;
let brainConnectors = connectors;
let selectedId = null;
let dragging = null;
let activeTool = "select";
let connectFrom = null;
let zoom = 1;
let panX = 0;
let panY = 0;
let panMode = false;
let history = [];
let historyIndex = -1;
let textPosition = null;

function saveBrainScene(silent=true){
  notes = brainNotes;
  connectors = brainConnectors;
  save(BRAIN_KEY, brainNotes);
  save(CONNECTOR_KEY, brainConnectors);
  if(!silent) toast("Canvas saved.");
}

function loadFirstBrainSeed(){
  if(brainNotes.length) return;
  brainNotes = [
    {id:"sample-dsa",x:95,y:80,color:"brain-ref-yellow",rot:"-2.5",text:"DSA Roadmap\n☑ Arrays\n☑ Two Pointers\n☑ Sliding Window\n☐ Tree\n☐ Graph"},
    {id:"sample-goal",x:405,y:88,color:"brain-ref-pink",rot:"1.0",text:"Current Goal\nSolve 150 DSA\nproblems before\nend of this year."},
    {id:"sample-project",x:720,y:95,color:"brain-ref-green",rot:"1.5",text:"Project Ideas\n• AI Study Planner\n• Habit Tracker\n• Notes Sharing App"},
    {id:"sample-why",x:80,y:330,color:"brain-ref-blue",rot:"-4.2",text:"Why DSA?\nDSA is the base for\nproblem solving and\ncracking interviews."},
    {id:"sample-focus",x:410,y:315,color:"brain-ref-yellow",rot:"3.0",text:"Today's Focus\nSliding Window\nProblems\n(5 Questions)"},
    {id:"sample-resources",x:750,y:330,color:"brain-ref-blue",rot:"2.0",text:"Resources\n• NeetCode\n• Striver A2Z Sheet\n• LeetCode Explore"},
    {id:"sample-reminders",x:260,y:555,color:"brain-ref-purple",rot:"-1.5",text:"Reminders\nRevise concepts\nweekly and keep\nconsistency."},
    {id:"sample-end",x:585,y:555,color:"brain-ref-pink",rot:"1.2",text:"End Goal\nBecome a Software\nEngineer & build\nimpactful products."}
  ];
  brainConnectors = [
    {id:"c1",a:"sample-dsa",b:"sample-goal"},
    {id:"c2",a:"sample-goal",b:"sample-project"},
    {id:"c3",a:"sample-why",b:"sample-dsa"},
    {id:"c4",a:"sample-why",b:"sample-focus"},
    {id:"c5",a:"sample-focus",b:"sample-resources"},
    {id:"c6",a:"sample-project",b:"sample-resources"},
    {id:"c7",a:"sample-why",b:"sample-reminders"},
    {id:"c8",a:"sample-reminders",b:"sample-end"}
  ];
  notes = brainNotes;
  connectors = brainConnectors;
  saveBrainScene();
}

function normalizeBrainColors(){
  const map={
    "note-yellow":"brain-ref-yellow","note-pink":"brain-ref-pink","note-green":"brain-ref-green",
    "note-blue":"brain-ref-blue","note-purple":"brain-ref-purple",
    "yellow":"brain-ref-yellow","pink":"brain-ref-pink","green":"brain-ref-green",
    "blue":"brain-ref-blue","purple":"brain-ref-purple"
  };
  brainNotes.forEach(n=>{ if(map[n.color]) n.color=map[n.color]; });
}

function createBrainNote(x=100,y=90,color="brain-ref-yellow",text="New idea\nWrite your thought here."){
  return {
    id:crypto.randomUUID(),
    x,y,color,
    rot:(Math.random()*5-2.5).toFixed(1),
    text
  };
}

function brainSnapshot(){
  return JSON.stringify({notes:brainNotes,connectors:brainConnectors});
}
function restoreBrainSnapshot(s){
  const obj=JSON.parse(s);
  brainNotes=obj.notes||[];
  brainConnectors=obj.connectors||[];
  saveBrainScene();
  render();
}
function pushHistory(){
  history=history.slice(0,historyIndex+1);
  history.push(brainSnapshot());
  historyIndex++;
  if(history.length>50){history.shift();historyIndex--;}
  $("undoButton").disabled=historyIndex<=0;
  $("redoButton").disabled=historyIndex>=history.length-1;
}

function selectTool(tool){
  activeTool=tool;
  // Choosing a canvas tool always exits explicit hand/pan mode so the UI
  // cannot get stuck in a persistent pan state.
  if(typeof panMode!=="undefined" && panMode){
    panMode=false;
    const panBtn=$("panButton");
    if(panBtn){
      panBtn.classList.remove("active");
      panBtn.style.background="transparent";
      panBtn.style.color="#4d4337";
      panBtn.setAttribute("aria-pressed","false");
    }
  }
  document.querySelectorAll("[data-tool]").forEach(b=>{
    b.classList.toggle("active",b.dataset.tool===tool);
  });
  connectFrom=null;
  if(tool!=="select" && typeof selectedDrawId!=="undefined"){
    selectedDrawId=null;
    if(typeof renderDrawStrokes==="function") renderDrawStrokes();
  }
}

function noteCenter(n){
  return {x:n.x+110,y:n.y+78};
}

function render(){
  const layer=$("stickyLayer");
  if(!layer) return;
  layer.innerHTML="";

  brainNotes.forEach(n=>{
    const el=document.createElement("div");
    el.className=`brain-ref-sticky ${n.color}${n.id===selectedId?" selected":""}`;
    el.dataset.id=n.id;
    el.style.left=n.x+"px";
    el.style.top=n.y+"px";
    el.style.setProperty("--rot",`${n.rot}deg`);

    const lines=n.text.split("\n");
    const title=lines[0]||"Idea";
    const body=lines.slice(1).join("\n");
    const tapeClass=(n.id==="sample-resources"||n.id==="sample-reminders")?"taped":"";

    el.innerHTML=`
      <div class="brain-ref-pin ${tapeClass}"></div>
      <div class="brain-ref-link-point"></div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body||"Double-click to edit.")}</p>
      <div class="brain-ref-sticky-actions">
        <button data-action="task" title="Create task">✓</button>
        <button data-action="color" title="Change color">●</button>
        <button data-action="delete" title="Delete">×</button>
      </div>
    `;

    el.addEventListener("pointerdown",e=>{
      if(e.target.closest(".brain-ref-sticky-actions")) return;
      selectedId=n.id;

      if(activeTool==="connector"){
        if(!connectFrom){
          connectFrom=n.id;
          toast("Now choose the sticky to connect.");
        }else if(connectFrom!==n.id){
          if(!brainConnectors.some(c=>
            (c.a===connectFrom&&c.b===n.id)||
            (c.a===n.id&&c.b===connectFrom)
          )){
            brainConnectors.push({id:crypto.randomUUID(),a:connectFrom,b:n.id});
            pushHistory();
            saveBrainScene();
            render();
            toast("Ideas connected.");
          }
          connectFrom=null;
        }
        return;
      }

      if(activeTool==="select"&&!panMode){
        if(typeof selectedDrawId!=="undefined") selectedDrawId=null;
        if(typeof renderDrawStrokes==="function") renderDrawStrokes();
        const r=$("board").getBoundingClientRect();
        dragging={
          id:n.id,
          dx:(e.clientX-r.left-n.x*zoom-panX),
          dy:(e.clientY-r.top-n.y*zoom-panY)
        };
        el.setPointerCapture?.(e.pointerId);
      }
      render();
    });

    el.addEventListener("dblclick",e=>{
      e.stopPropagation();
      editBrainNote(n);
    });

    el.querySelectorAll("[data-action]").forEach(btn=>{
      btn.onclick=e=>{
        e.stopPropagation();
        const action=btn.dataset.action;
        if(action==="delete"){
          brainNotes=brainNotes.filter(x=>x.id!==n.id);
          brainConnectors=brainConnectors.filter(c=>c.a!==n.id&&c.b!==n.id);
          selectedId=null;
          pushHistory();saveBrainScene();render();
        }else if(action==="task"){
          createTaskFromBrainNote(n);
        }else if(action==="color"){
          openColorMenu(n.id,e.clientX,e.clientY);
        }
      };
    });

    layer.appendChild(el);
  });

  drawWires();
  drawMinimap();
}

async function editBrainNote(n){
  const text=await nexaPrompt("Edit sticky note", n.text, {title:"Edit sticky", kicker:"BRAINSTORM"});
  if(text===null) return;
  n.text=text.trim()||"Idea";
  pushHistory();saveBrainScene();render();
}

function addSticky(){
  const r=$("board").getBoundingClientRect();
  const z=Math.max(zoom,.01);
  const centerX=(r.width/2-panX)/z;
  const centerY=(r.height/2-panY)/z;
  const n=createBrainNote(
    centerX-110+(Math.random()*120-60),
    centerY-80+(Math.random()*100-50),
    ["brain-ref-yellow","brain-ref-pink","brain-ref-green","brain-ref-blue","brain-ref-purple"][brainNotes.length%5]
  );
  brainNotes.push(n);
  selectedId=n.id;
  pushHistory();saveBrainScene();render();
  editBrainNote(n);
}

function createTaskFromBrainNote(n){
  switchView("tasks");
  openTaskModal();
  const lines=n.text.split("\n");
  $("taskTitle").value=lines[0].slice(0,120);
  $("taskDescription").value=lines.slice(1).join("\n").trim();
  toast("Idea loaded into Create Task.");
}

function openColorMenu(id,x,y){
  const menu=$("colorMenu");
  menu.dataset.noteId=id;
  menu.style.display="flex";
  menu.style.left=Math.min(x,window.innerWidth-180)+"px";
  menu.style.top=Math.min(y,window.innerHeight-60)+"px";
}

function drawWires(){
  const svg=$("wires");
  if(!svg)return;
  svg.innerHTML=`
    <defs>
      <marker id="arrowHeadBrain" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#5b5247"></path>
      </marker>
    </defs>
  `;
  brainConnectors.forEach(c=>{
    const a=brainNotes.find(n=>n.id===c.a);
    const b=brainNotes.find(n=>n.id===c.b);
    if(!a||!b)return;
    const p1=noteCenter(a),p2=noteCenter(b);
    const curve=Math.max(50,Math.abs(p2.x-p1.x)*.45);
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",`M ${p1.x} ${p1.y} C ${p1.x+curve} ${p1.y}, ${p2.x-curve} ${p2.y}, ${p2.x} ${p2.y}`);
    path.setAttribute("fill","none");
    path.setAttribute("stroke","#5b5247");
    path.setAttribute("stroke-width","2.3");
    path.setAttribute("marker-end","url(#arrowHeadBrain)");
    svg.appendChild(path);
  });
  svg.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;
  svg.style.transformOrigin="0 0";
}

function drawMinimap(){
  const m=$("minimapInner");
  if(!m)return;
  m.innerHTML="";
  const colors={
    "brain-ref-yellow":"#f0cf67",
    "brain-ref-pink":"#efb0ad",
    "brain-ref-green":"#b9d77e",
    "brain-ref-blue":"#9ccbe7",
    "brain-ref-purple":"#cdb5de"
  };
  const board=$("board").getBoundingClientRect();
  brainNotes.forEach(n=>{
    const d=document.createElement("div");
    d.className="brain-ref-mini-dot";
    d.style.background=colors[n.color]||colors["brain-ref-yellow"];
    d.style.left=(8+(n.x/(Math.max(board.width,1)))*130)+"px";
    d.style.top=(6+(n.y/(Math.max(board.height,1)))*88)+"px";
    m.appendChild(d);
  });
}

function setZoom(value){
  zoom=Math.max(.05,Math.min(6,value));
  $("zoomValue").textContent=Math.round(zoom*100)+"%";
  const worldTransform=`translate(${panX}px,${panY}px) scale(${zoom})`;
  $("stickyLayer").style.transform=worldTransform;
  $("stickyLayer").style.transformOrigin="0 0";
  const grid=$(".brain-ref-canvas-grid");
  if(grid){
    grid.style.backgroundPosition=`${panX}px ${panY}px`;
    grid.style.backgroundSize=`${24*zoom}px ${24*zoom}px`;
  }
  drawWires();
  window.__renderInfiniteDraw?.();
}

function closeText(){
  $("brainTextModal").style.display="none";
  textPosition=null;
}

document.querySelectorAll("[data-tool]").forEach(b=>{
  b.onclick=()=>{
    const tool=b.dataset.tool;
    if(tool==="sticky"){ addSticky(); return; }
    if(tool==="eraser"){
      if(selectedId){
        const target=brainNotes.find(n=>n.id===selectedId);
        if(target){
          brainNotes=brainNotes.filter(n=>n.id!==selectedId);
          brainConnectors=brainConnectors.filter(c=>c.a!==selectedId&&c.b!==selectedId);
          selectedId=null; connectFrom=null;
          pushHistory(); saveBrainScene(); render(); toast("Sticky deleted."); return;
        }
      }
      toast("Select a sticky to erase.","error"); return;
    }
    selectTool(tool);
  };
});

$("colorButton").onclick=()=>{
  if(!selectedId){toast("Select a sticky first.","error");return;}
  const r=$("colorButton").getBoundingClientRect();
  openColorMenu(selectedId,r.left,r.bottom+6);
};
$("moreButton").onclick=()=>{
  void nexaAlert("E — Eraser\nT — Text\nMouse wheel — Zoom\nHand — Pan\nDouble-click — Edit sticky", {title:"Brainstorm shortcuts", kicker:"BRAINSTORM"});
};
$("addSticky").onclick=addSticky;
$("createTask").onclick=()=>{
  const n=brainNotes.find(x=>x.id===selectedId)||brainNotes[0];
  if(!n){toast("Create or select a sticky first.","error");return;}
  createTaskFromBrainNote(n);
};

$("zoomIn").onclick=()=>setZoom(zoom+.1);
$("zoomOut").onclick=()=>setZoom(zoom-.1);
$("fitButton").onclick=()=>{
  zoom=1;panX=0;panY=0;setZoom(1);toast("Canvas reset.");
};
function setPanMode(enabled){
  panMode=!!enabled;
  const panBtn=$("panButton");
  if(panBtn){
    panBtn.classList.toggle("active",panMode);
    panBtn.style.background=panMode?"#24211d":"transparent";
    panBtn.style.color=panMode?"#f7ecdc":"#4d4337";
    panBtn.setAttribute("aria-pressed",panMode?"true":"false");
  }
}
$("panButton").onclick=(e)=>{
  e.preventDefault();
  e.stopPropagation();
  setPanMode(!panMode);
  if(panMode){
    activeTool="select";
    document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("active",b.dataset.tool==="select"));
    connectFrom=null;
  }
};
$("panButton").setAttribute("aria-pressed","false");

let lastPan=null;
let spaceDown=false;
let panPointerId=null;
$("workspace").addEventListener("pointerdown",e=>{
  const wantsPan=panMode || spaceDown || e.button===1;
  if(!wantsPan)return;
  e.preventDefault();
  panPointerId=e.pointerId;
  e.currentTarget.setPointerCapture?.(e.pointerId);
  lastPan={x:e.clientX,y:e.clientY};
});
window.addEventListener("pointermove",e=>{
  if(dragging){
    const n=brainNotes.find(x=>x.id===dragging.id);
    if(n){
      const r=$("board").getBoundingClientRect();
      n.x=(e.clientX-r.left-panX-dragging.dx)/Math.max(zoom,.01);
      n.y=(e.clientY-r.top-panY-dragging.dy)/Math.max(zoom,.01);
      render();
    }
  }
  if(!lastPan)return;
  panX+=e.clientX-lastPan.x;
  panY+=e.clientY-lastPan.y;
  lastPan={x:e.clientX,y:e.clientY};
  $("stickyLayer").style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;
  const grid=$(".brain-ref-canvas-grid");
  if(grid){
    grid.style.backgroundPosition=`${panX}px ${panY}px`;
    grid.style.backgroundSize=`${24*zoom}px ${24*zoom}px`;
  }
  drawWires();
  window.__renderInfiniteDraw?.();
});
window.addEventListener("pointerup",()=>{
  if(dragging){
    dragging=null;
    pushHistory();
    saveBrainScene();
  }
  lastPan=null;
  panPointerId=null;
});

$("workspace").addEventListener("wheel",e=>{
  if(activeView!=="brainstorm")return;
  e.preventDefault();
  const r=$("board").getBoundingClientRect();
  const beforeX=(e.clientX-r.left-panX)/Math.max(zoom,.01);
  const beforeY=(e.clientY-r.top-panY)/Math.max(zoom,.01);
  const next=Math.max(.05,Math.min(6,zoom+(e.deltaY<0?.1:-.1)));
  zoom=next;
  panX=e.clientX-r.left-beforeX*zoom;
  panY=e.clientY-r.top-beforeY*zoom;
  setZoom(zoom);
},{passive:false});

document.addEventListener("keydown",e=>{
  if(activeView!=="brainstorm")return;
  const tag=(e.target?.tagName||"").toLowerCase();
  if(tag==="input"||tag==="textarea"||tag==="select")return;
  if(e.code==="Space"){
    spaceDown=true;
    document.body.classList.add("brain-space-pan");
    e.preventDefault();
  }
});
document.addEventListener("keyup",e=>{
  if(e.code==="Space"){
    spaceDown=false;
    document.body.classList.remove("brain-space-pan");
  }
});

$("workspace").addEventListener("dblclick",e=>{
  if(activeTool!=="text")return;
  const r=$("board").getBoundingClientRect();
  textPosition={
    x:(e.clientX-r.left-panX)/zoom,
    y:(e.clientY-r.top-panY)/zoom
  };
  $("textValue").value="";
  $("brainTextModal").style.display="flex";
  setTimeout(()=>$("textValue").focus(),30);
});
$("closeText").onclick=closeText;
$("cancelText").onclick=closeText;
$("saveText").onclick=()=>{
  const text=$("textValue").value.trim();
  if(!text||!textPosition)return;
  const n=createBrainNote(textPosition.x,textPosition.y,"brain-ref-blue",text);
  n.rot=0;
  brainNotes.push(n);
  pushHistory();saveBrainScene();render();closeText();
};

document.querySelectorAll("[data-color]").forEach(b=>{
  b.onclick=()=>{
    const id=$("colorMenu").dataset.noteId;
    const n=brainNotes.find(x=>x.id===id);
    if(n){
      n.color=b.dataset.color;
      pushHistory();saveBrainScene();render();
      toast("Sticky color updated.");
    }
    $("colorMenu").style.display="none";
  };
});

document.addEventListener("click",e=>{
  if(!e.target.closest("#colorMenu")&&!e.target.closest('[data-action="color"]')){
    $("colorMenu").style.display="none";
  }
});

$("undoButton").onclick=()=>{
  if(historyIndex<=0)return;
  historyIndex--;
  restoreBrainSnapshot(history[historyIndex]);
  $("undoButton").disabled=historyIndex<=0;
  $("redoButton").disabled=historyIndex>=history.length-1;
};
$("redoButton").onclick=()=>{
  if(historyIndex>=history.length-1)return;
  historyIndex++;
  restoreBrainSnapshot(history[historyIndex]);
  $("undoButton").disabled=historyIndex<=0;
  $("redoButton").disabled=historyIndex>=history.length-1;
};

$("newBoardButton").onclick=async()=>{
  if(!(await nexaConfirm("Your current board will stay saved, but the active canvas will start empty.", {title:"Start a new board?", kicker:"BRAINSTORM"})))return;
  brainNotes=[];
  brainConnectors=[];
  selectedId=null;
  history=[];historyIndex=-1;pushHistory();
  saveBrainScene();render();toast("New board created.");
};

const fullscreenBrainButton=$("fullscreenBrainButton");
if(fullscreenBrainButton){
  fullscreenBrainButton.onclick=async()=>{
    const shell=document.querySelector(".brain-ref-shell");
    if(!shell)return;
    try{
      if(document.fullscreenElement) await document.exitFullscreen();
      else await shell.requestFullscreen();
    }catch{ toast("Fullscreen is not available in this browser.","error"); }
  };
  document.addEventListener("fullscreenchange",()=>{
    const active=!!document.fullscreenElement;
    fullscreenBrainButton.textContent=active?"✕ Exit Fullscreen":"⛶ Fullscreen";
  });
}

$("shareButton").onclick=async()=>{
  const url=location.href.split("#")[0];
  try{
    await navigator.clipboard.writeText(url);
    toast("Workspace link copied.");
  }catch{
    toast("Copy the current page URL to share.","error");
  }
};
$("howButton").onclick=()=>{
  void nexaAlert(`• Sticky — create visual ideas
• Select — move notes
• Connect — click two notes to link them
• Double click — edit a sticky
• Delete — remove selected note
• Mouse wheel — zoom
• Hand — pan
• Create Task — turn an idea into work`, {title:"How brainstorming works", kicker:"BRAINSTORMING"});
};

loadFirstBrainSeed();
normalizeBrainColors();
notes=brainNotes;
connectors=brainConnectors;
saveBrainScene();
history=[];historyIndex=-1;pushHistory();
render();
setZoom(1);
window.addEventListener("resize",drawMinimap);

/* ============================================================
   PROOFS
============================================================ */

function renderProofs() {
  const done=tasks.filter(t=>t.status==="completed" && t.proofDataUrl);
  const grid=$("proofGrid");
  const empty=$("proofEmpty");
  if(!grid||!empty)return;

  if (!done.length) {
    grid.innerHTML="";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  const groups={};
  done.forEach(task=>{
    const dateKey=task.completedAt
      ? new Date(task.completedAt).toLocaleDateString(undefined,{month:"long",day:"2-digit",year:"numeric"}).toUpperCase()
      : "COMPLETED";
    if(!groups[dateKey]) groups[dateKey]=[];
    groups[dateKey].push(task);
  });

  grid.innerHTML=Object.entries(groups).map(([date,list])=>`
    <div style="grid-column:1/-1">
      <p class="kicker" style="color:#a79d8e;margin:5px 2px 8px">${escapeHtml(date)}</p>
      <div class="proof-grid">
        ${list.map(task=>`
          <article class="proof-card" data-proof-card-id="${task.id}">
            <div class="proof-image-wrap">
              <img src="${task.proofDataUrl}" alt="Proof for ${escapeHtml(task.title)}" data-proof-card="${task.id}">
              <span class="proof-view-chip">View evidence</span>
            </div>
            <div class="proof-card-body">
              <h3>${escapeHtml(task.title)}</h3>
              <p>${task.completedAt?`Completed ${escapeHtml(formatTime(task.completedAt))}`:"Completed"}</p>
              <div class="proof-meta-v5">
                <span>${escapeHtml(task.category||"Project")}</span>
                <span>${escapeHtml(task.priority||"medium")}</span>
                ${task.dueDate?`<span>Due ${escapeHtml(formatShortDate(task.dueDate))}</span>`:""}
              </div>
              <div class="proof-actions-v5">
                <button data-proof-action="view" data-id="${task.id}">View</button>
                <button data-proof-action="replace" data-id="${task.id}">Replace</button>
                <button class="danger" data-proof-action="delete" data-id="${task.id}">Delete</button>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `).join("");

  grid.querySelectorAll('[data-proof-action="view"], [data-proof-card]').forEach(el=>{
    el.onclick=()=>{
      const task=tasks.find(t=>t.id===el.dataset.id||t.id===el.dataset.proofCard);
      if(task)openProofViewer(task);
    };
  });
  grid.querySelectorAll('[data-proof-action="replace"]').forEach(btn=>btn.onclick=()=>{
    const task=tasks.find(t=>t.id===btn.dataset.id); if(task)openProofModal(task,true);
  });
  grid.querySelectorAll('[data-proof-action="delete"]').forEach(btn=>btn.onclick=async()=>{
    const task=tasks.find(t=>t.id===btn.dataset.id); if(task)await deleteProofForTask(task);
  });
}



/* ============================================================
   CALENDAR
============================================================ */

let calendarCursor=new Date();
let calendarViewMode="month";

function calendarModeLabel(){
  return calendarViewMode.charAt(0).toUpperCase()+calendarViewMode.slice(1);
}
function tasksForDateKey(key){
  return tasks.filter(t=>t && (t.reminderDate===key||t.dueDate===key)).sort((a,b)=>{
    return (taskScheduleDate(a)?.getTime()||Infinity)-(taskScheduleDate(b)?.getTime()||Infinity);
  });
}
function calendarTaskChip(t){
  const priority=(t.priority||"medium").toLowerCase();
  const cls=priority==="high"?"chip-high":priority==="low"?"chip-low":"chip-medium";
  const time=t.reminderDate&&t.reminderTime?formatCalendarTime(t.reminderTime):"";
  return `<button type="button" class="calendar-event-v11 ${cls}" data-calendar-task="${escapeHtml(t.id)}" title="Open ${escapeHtml(t.title||"Task")}"><span>${escapeHtml(t.title||"Untitled")}</span>${time?`<small>${escapeHtml(time)}</small>`:""}</button>`;
}
function formatCalendarTime(time){
  if(!time)return "";
  const [h,m]=String(time).split(":").map(Number);
  if(Number.isNaN(h)||Number.isNaN(m))return time;
  const suffix=h>=12?"PM":"AM"; const hh=(h%12)||12;
  return `${hh}:${String(m).padStart(2,"0")} ${suffix}`;
}
function renderCalendarMini(){
  const year=calendarCursor.getFullYear();
  const month=calendarCursor.getMonth();
  const title=$("calendarMiniMonth");
  if(title)title.textContent=calendarCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const grid=$("calendarMiniGrid"); if(!grid)return;
  const first=new Date(year,month,1);
  const start=(first.getDay()+6)%7;
  const daysInMonth=new Date(year,month+1,0).getDate();
  const heads=["S","M","T","W","T","F","S"];
  let html=heads.map(d=>`<div class="calendar-mini-headcell-v11">${d}</div>`).join("");
  const prevDays=new Date(year,month,0).getDate();
  for(let i=start-1;i>=0;i--){
    const d=prevDays-i; html+=`<button type="button" class="calendar-mini-day-v11 muted" tabindex="-1">${d}</button>`;
  }
  for(let d=1;d<=daysInMonth;d++){
    const key=[year,String(month+1).padStart(2,"0"),String(d).padStart(2,"0")].join("-");
    const selected=key===todayKey();
    const has=tasksForDateKey(key).length>0;
    html+=`<button type="button" class="calendar-mini-day-v11 ${selected?"today":""} ${has?"has-event":""}" data-mini-date="${key}">${d}</button>`;
  }
  const totalCells=Math.max(35,Math.ceil((start+daysInMonth)/7)*7);
  const filled=start+daysInMonth;
  for(let d=1;d<=totalCells-filled;d++)html+=`<button type="button" class="calendar-mini-day-v11 muted" tabindex="-1">${d}</button>`;
  grid.innerHTML=html;
  grid.querySelectorAll('[data-mini-date]').forEach(btn=>btn.addEventListener('click',()=>{
    const [y,m,d]=btn.dataset.miniDate.split("-").map(Number); calendarCursor=new Date(y,m-1,d); renderCalendar();
  }));
}
function renderUpcomingCalendar(){
  const agenda=$("calendarAgenda"); if(!agenda)return;
  const upcoming=tasks.filter(t=>t.status!=="completed"&&taskScheduleDate(t)).sort((a,b)=>taskScheduleDate(a)-taskScheduleDate(b)).slice(0,4);
  if(!upcoming.length){
    agenda.innerHTML='<div class="calendar-empty-v11"><strong>No plans yet</strong><span>Add a task or reminder to start building your schedule.</span><button type="button" id="calendarEmptyAddTask">+ Add task</button></div>';
    const add=$('calendarEmptyAddTask');
    if(add) add.addEventListener('click',()=>{switchView('tasks');openTaskModal();});
    return;
  }
  agenda.innerHTML=upcoming.map(t=>{
    const dt=taskScheduleDate(t); const priority=(t.priority||"medium").toLowerCase();
    const dot=priority==="high"?"dot-high":priority==="low"?"dot-low":"dot-medium";
    const when=dt.toLocaleDateString(undefined,{month:"short",day:"numeric"});
    const time=t.reminderTime?formatCalendarTime(t.reminderTime):"";
    return `<button type="button" class="calendar-upcoming-item-v11" data-agenda-task="${escapeHtml(t.id)}"><i class="upcoming-dot-v11 ${dot}"></i><span class="upcoming-copy-v11"><strong>${escapeHtml(t.title||"Untitled")}</strong><small>${escapeHtml(when)}${time?`, ${escapeHtml(time)}`:""}</small></span></button>`;
  }).join("");
  agenda.querySelectorAll('[data-agenda-task]').forEach(btn=>btn.addEventListener('click',()=>{const t=tasks.find(x=>x.id===btn.dataset.agendaTask);if(t)openTaskModal(t);}));
}
function weekStart(date){const d=new Date(date); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d;}
function dateKey(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
function renderMonthCalendar(){
  const grid=$("calendarGrid"); if(!grid)return;
  const year=calendarCursor.getFullYear(), month=calendarCursor.getMonth();
  const first=new Date(year,month,1); const start=(first.getDay()+6)%7; const daysInMonth=new Date(year,month+1,0).getDate();
  const heads=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  let html=heads.map(d=>`<div class="calendar-day-head-v11">${d}</div>`).join("");
  const prevDays=new Date(year,month,0).getDate();
  for(let i=start-1;i>=0;i--){const d=prevDays-i; html+=`<div class="calendar-cell-v11 muted"><span class="calendar-day-num-v11">${d}</span></div>`;}
  for(let d=1;d<=daysInMonth;d++){
    const key=[year,String(month+1).padStart(2,"0"),String(d).padStart(2,"0")].join("-");
    const list=tasksForDateKey(key); const today=key===todayKey();
    html+=`<div class="calendar-cell-v11 ${today?"today":""}" data-calendar-date="${key}"><div class="calendar-cell-top-v11"><span class="calendar-day-num-v11">${d}</span><span class="calendar-cell-actions-v11"><button type="button" class="calendar-add-day-v11" data-calendar-add="${key}" aria-label="Add task for ${key}">+</button>${today?'<span class="calendar-today-dot-v11"></span>':""}</span></div><div class="calendar-events-v11">${list.slice(0,4).map(calendarTaskChip).join("")}${list.length>4?`<button type="button" class="calendar-more-v11" data-calendar-more="${key}">+${list.length-4} more</button>`:""}</div></div>`;
  }
  const total=Math.ceil((start+daysInMonth)/7)*7; for(let d=1;d<=total-(start+daysInMonth);d++)html+=`<div class="calendar-cell-v11 muted"><span class="calendar-day-num-v11">${d}</span></div>`;
  grid.innerHTML=html;
}
function renderWeekCalendar(){
  const grid=$("calendarGrid"); if(!grid)return;
  const start=weekStart(calendarCursor); const heads=[]; for(let i=0;i<7;i++){const d=new Date(start); d.setDate(start.getDate()+i); heads.push(d);} 
  let html=heads.map(d=>`<div class="calendar-week-head-v11 ${dateKey(d)===todayKey()?"today":""}"><small>${d.toLocaleDateString(undefined,{weekday:"short"})}</small><strong>${d.getDate()}</strong></div>`).join("");
  html+=heads.map(d=>{const key=dateKey(d); const list=tasksForDateKey(key); return `<div class="calendar-week-cell-v11 ${key===todayKey()?"today":""}" data-calendar-date="${key}"><div class="calendar-events-v11">${list.map(calendarTaskChip).join("")}${!list.length?'<span class="calendar-empty-slot-v11">No tasks</span>':""}</div></div>`;}).join("");
  grid.innerHTML=html;
}
function renderDayCalendar(){
  const grid=$("calendarGrid"); if(!grid)return; const key=dateKey(calendarCursor); const list=tasksForDateKey(key);
  grid.innerHTML=`<div class="calendar-day-view-v11 ${key===todayKey()?"today":""}"><div class="calendar-day-view-head-v11"><div><small>${calendarCursor.toLocaleDateString(undefined,{weekday:"long"})}</small><strong>${calendarCursor.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})}</strong></div><span>${list.length} scheduled</span></div><div class="calendar-day-view-list-v11">${list.length?list.map(calendarTaskChip).join(""):'<div class="calendar-empty-slot-v11">Nothing scheduled for this day.</div>'}</div></div>`;
}
function renderCalendar(){
  const title=$("calendarMonth"), sub=$("calendarSubhead");
  if(title){
    if(calendarViewMode==="month")title.textContent=calendarCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
    if(calendarViewMode==="week"){const s=weekStart(calendarCursor),e=new Date(s);e.setDate(s.getDate()+6);title.textContent=`${s.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${e.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;}
    if(calendarViewMode==="day")title.textContent=calendarCursor.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});
  }
  if(sub)sub.textContent=calendarViewMode==="month"?"Your scheduled reminders.":calendarModeLabel()+" view · click a task to edit it.";
  renderCalendarMini(); renderUpcomingCalendar();
  if(calendarViewMode==="month")renderMonthCalendar();
  if(calendarViewMode==="week")renderWeekCalendar();
  if(calendarViewMode==="day")renderDayCalendar();
  document.querySelectorAll('[data-calendar-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.calendarMode===calendarViewMode));
  const grid=$("calendarGrid"); if(!grid)return;
  grid.querySelectorAll('[data-calendar-task]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();const t=tasks.find(x=>x.id===el.dataset.calendarTask);if(t)openTaskModal(t);}));
  grid.querySelectorAll('[data-calendar-add]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    const date=btn.dataset.calendarAdd;
    switchView("tasks");
    openTaskModal();
    if($("taskDueDate"))$("taskDueDate").value=date;
    if($("taskReminderDate"))$("taskReminderDate").value=date;
  }));
  grid.querySelectorAll('[data-calendar-date]').forEach(el=>el.addEventListener('dblclick',()=>{const date=el.dataset.calendarDate;switchView("tasks");openTaskModal();if($("taskDueDate"))$("taskDueDate").value=date;if($("taskReminderDate"))$("taskReminderDate").value=date;}));
  if(window.lucide?.createIcons)window.lucide.createIcons();
}
$('calendarToday').onclick=()=>{calendarCursor=new Date();renderCalendar();};
function moveCalendar(amount){
  if(calendarViewMode==="month")calendarCursor.setMonth(calendarCursor.getMonth()+amount);
  else if(calendarViewMode==="week")calendarCursor.setDate(calendarCursor.getDate()+amount*7);
  else calendarCursor.setDate(calendarCursor.getDate()+amount);
  renderCalendar();
}
$("calendarPrev").onclick=()=>moveCalendar(-1);
$("calendarNext").onclick=()=>moveCalendar(1);
$("calendarMiniPrev").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar();};
$("calendarMiniNext").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar();};
$("calendarFullView").onclick=()=>{
  const shell=document.querySelector("#view-calendar .calendar-shell-v11");
  if(!shell)return;
  shell.classList.toggle("full-calendar-v11");
  const full=shell.classList.contains("full-calendar-v11");
  const btn=$("calendarFullView");
  if(btn)btn.innerHTML=full?'Show agenda <span>←</span>':'View full calendar <span>→</span>';
  const main=shell.querySelector(".calendar-main-v11");
  if(full&&main)main.scrollIntoView({behavior:"smooth",block:"start"});
};
document.querySelectorAll('[data-calendar-mode]').forEach(btn=>btn.addEventListener('click',()=>{calendarViewMode=btn.dataset.calendarMode;renderCalendar();}));


/* ============================================================
   SUMMARY / DASHBOARD
============================================================ */

function updateSummary() {
  const today=todayKey();

  const todayCount=tasks.filter(
    t=>t.dueDate===today || t.reminderDate===today
  ).length;

  const pending=tasks.filter(t=>t.status!=="completed").length;
  const overdue=tasks.filter(isOverdue).length;
  const completed=tasks.filter(t=>t.status==="completed").length;

  $("dashToday").textContent=todayCount;
  $("dashPending").textContent=pending;
  $("dashOverdue").textContent=overdue;
  $("dashCompleted").textContent=completed;

  $("taskToday").textContent=todayCount;
  $("taskPending").textContent=pending;
  $("taskOverdue").textContent=overdue;
  $("taskCompleted").textContent=completed;
}

function renderDashboard() {
  updateSummary();

  const upcoming=tasks
    .filter(t=>t.status!=="completed")
    .sort((a,b)=>{
      const aTime=reminderDate(a)?.getTime() || Infinity;
      const bTime=reminderDate(b)?.getTime() || Infinity;
      return aTime-bTime;
    })
    .slice(0,4);

  renderTaskList("dashboardTaskList",upcoming);
}


/* ============================================================
   BROWSER NOTIFICATIONS
============================================================ */

async function requestNotifications() {
  if (!("Notification" in window)) {
    void nexaAlert("This browser does not support notifications.", {title:"Notifications unavailable", kicker:"NOTIFICATIONS"});
    return;
  }

  const permission=
    await Notification.requestPermission();

  if (permission==="granted") {
    localStorage.setItem("nexa_settings_preferences_v1",JSON.stringify({...(()=>{try{return JSON.parse(localStorage.getItem("nexa_settings_preferences_v1")||"{}")}catch{return {}}})(),browser_notifications:true}));
    new Notification("Newla",{
      body:"Browser task reminders are enabled."
    });
  } else if(permission==="denied") {
    localStorage.setItem("nexa_settings_preferences_v1",JSON.stringify({...(()=>{try{return JSON.parse(localStorage.getItem("nexa_settings_preferences_v1")||"{}")}catch{return {}}})(),browser_notifications:false}));
  }
}

$("settingsNotify").onclick=requestNotifications;

function checkReminders() {
  if (!("Notification" in window) || Notification.permission!=="granted") return;
  const now=Date.now();
  let changed=false;
  tasks=tasks.map(task=>{
    const target=reminderDate(task);
    if(task.status==="completed"||!target)return task;
    const diff=now-target.getTime();
    // Notify once when the reminder time is reached, and recover gracefully if the page was briefly asleep.
    if(diff>=0 && diff<=5*60*1000){
      const stamp=target.toISOString();
      if(task.remindedAt===stamp)return task;
      new Notification(`Reminder: ${task.title}`,{body:task.description||"Your scheduled task reminder."});
      changed=true;
      return {...task,remindedAt:stamp};
    }
    return task;
  });
  if(changed){save(KEYS.TASKS,tasks);renderAll();}
}
setInterval(checkReminders,30000);
setTimeout(checkReminders,5000);
setInterval(checkReminders,15000);


/* ============================================================
   SETTINGS / DATA
============================================================ */

$("clearAllData").onclick = () => {
  const modal=document.getElementById("clearDataModal");
  if(modal){modal.classList.add("show");modal.setAttribute("aria-hidden","false");}
};


/* ============================================================
   QUICK LINKS
============================================================ */

$("dashboardTasks").onclick=()=>switchView("tasks");
$("dashboardOpenBrainstorm").onclick=()=>switchView("brainstorm");
$("dashboardBrainstorm").onclick=()=>switchView("brainstorm");


/* ============================================================
   KEYBOARD SHORTCUTS
============================================================ */

document.addEventListener("keydown",event=>{
  const tag=event.target.tagName;
  const typing=
    tag==="INPUT" ||
    tag==="TEXTAREA" ||
    tag==="SELECT";

  if (typing) return;

  const key=event.key.toLowerCase();

  if(key==="n"){
    switchView("tasks");
    openTaskModal();
  }

  if(key==="e" && activeView==="brainstorm"){
    brainTool="eraser";
  }

  if(key==="t" && activeView==="brainstorm"){
    brainTool="text";
  }
});



/* ============================================================
   COMMAND PALETTE / SIDEBAR / FOCUS EVENTS
============================================================ */

initSidebar();

$("sidebarToggle").onclick=toggleSidebar;

document.addEventListener("keydown",event=>{
  const tag=event.target.tagName;
  const typing=tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT";

  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
    event.preventDefault();
    openCommandPalette();
    return;
  }

  if(event.key==="Escape"){
    closeCommandPalette();
    return;
  }

  if(!typing && event.key.toLowerCase()==="n"){
    switchView("tasks");
    openTaskModal();
  }

  if(!typing && activeView==="brainstorm"){
    if(event.key.toLowerCase()===" "){
      // Space is reserved for canvas pan interaction.
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="d" && selectedId){
      const note=brainNotes.find(n=>n.id===selectedId);
      if(note){
        const copy={...note,id:crypto.randomUUID(),x:note.x+25,y:note.y+25,text:note.text+" (Copy)"};
        brainNotes.push(copy);
        selectedId=copy.id;
        saveBrainScene();
        render();
        toast("Sticky duplicated.");
      }
    }
    if(event.key==="Delete"&&selectedId){
      brainNotes=brainNotes.filter(n=>n.id!==selectedId);
      brainConnectors=brainConnectors.filter(c=>c.a!==selectedId&&c.b!==selectedId);
      selectedId=null;
      saveBrainScene();
      render();
      toast("Sticky deleted.");
    }
  }
});

$("commandInput").addEventListener("input",()=>{
  commandIndex=0;
  renderCommands($("commandInput").value);
});

$("commandInput").addEventListener("keydown",event=>{
  const matches=renderCommands($("commandInput").value);

  if(event.key==="ArrowDown"){
    event.preventDefault();
    commandIndex=Math.min(commandIndex+1,matches.length-1);
    renderCommands($("commandInput").value);
  }

  if(event.key==="ArrowUp"){
    event.preventDefault();
    commandIndex=Math.max(commandIndex-1,0);
    renderCommands($("commandInput").value);
  }

  if(event.key==="Enter"){
    event.preventDefault();
    const item=matches[commandIndex];
    if(item){
      closeCommandPalette();
      item.action();
    }
  }
});

$("commandPalette").addEventListener("click",event=>{
  if(event.target===$("commandPalette")) closeCommandPalette();
});

$("focusStart").onclick=()=>{
  if(focusRunning) pauseFocus();
  else startFocus();
};

$("focusReset").onclick=resetFocus;

$("focusClose").onclick=()=>{
  pauseFocus();
  $("focusModal").style.display="none";
};

$("focusModal").addEventListener("click",event=>{
  if(event.target===$("focusModal")){
    pauseFocus();
    $("focusModal").style.display="none";
  }
});

updateFocusDisplay();


/* ============================================================
   RENDER ALL
============================================================ */

function renderAll() {
  renderTasks();
  renderDashboard();
  renderProofs();
  renderCalendar();
  render();
  updateGreeting();
}

renderAll();

if(location.hash==="#brainstorm"){
  switchView("brainstorm");
}


/* ============================================================
   MODAL BACKDROPS
============================================================ */

document.querySelectorAll(".modal").forEach(modal=>{
  modal.addEventListener("click",event=>{
    if(event.target!==modal)return;

    modal.style.display="none";
  });
});




/* Source inline script 2 */

/* ============================================================
   WORKSPACE V2 BEHAVIOUR
   Adds dashboard analytics, richer tasks, notes, achievements,
   focus tracking and task search without removing the original app.
============================================================ */
(function(){
  const V2 = {
    FOCUS:"naveen_focus_sessions_v1",
    NOTES:"naveen_knowledge_notes_v1",
    STREAK:"naveen_productivity_streak_v1"
  };
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  let v2Notes=read(V2.NOTES,[]);
  let activeV2Note=null;
  let searchTerm="";
  let categoryFilter="all";
  let priorityFilter="all";
  let focusStartedAt=null;

  function esc(v){return escapeHtml(v==null?"":v)}

  /* -------- Rich task fields -------- */
  const originalOpenTaskModal=window.openTaskModal;
  window.openTaskModal=function(task=null){
    originalOpenTaskModal(task);
    setTimeout(()=>{
      if($("taskCategory")) $("taskCategory").value=task?.category||"Coding";
      if($("taskRecurring")) $("taskRecurring").value=task?.recurring||"none";
      if($("taskSubtasks")) $("taskSubtasks").value=(task?.subtasks||[]).map(s=>typeof s==="string"?s:s.text).join("\n");
    },0);
  };

  const taskForm=$("taskForm");
  if(taskForm){
    taskForm.addEventListener("submit",()=>{
      setTimeout(()=>{
        const id=window.editingTaskId || $("taskId")?.value || tasks[0]?.id;
        const t=tasks.find(x=>x.id===id);
        if(!t)return;
        const lines=($("taskSubtasks")?.value||"").split("\n").map(x=>x.trim()).filter(Boolean);
        const previous=t.subtasks||[];
        t.category=$("taskCategory")?.value||"Coding";
        t.recurring=$("taskRecurring")?.value||"none";
        t.subtasks=lines.map((s,i)=>{
          const old=previous[i];
          return typeof old==="object"?{...old,text:s}:{id:crypto.randomUUID(),text:s,done:false};
        });
        save(KEYS.TASKS,tasks);
        renderAll();
        renderV2Dashboard();
      },20);
    });
  }

  /* -------- Search + filters -------- */
  const search=$("taskSearch"), cat=$("taskCategoryFilter"), pri=$("taskPriorityFilter");
  search?.addEventListener("input",()=>{searchTerm=search.value.toLowerCase();renderTasks()});
  cat?.addEventListener("change",()=>{categoryFilter=cat.value;renderTasks()});
  pri?.addEventListener("change",()=>{priorityFilter=pri.value;renderTasks()});

  window.filteredTasks=function(){
    return tasks.filter(task=>{
      if(taskFilter==="pending" && task.status==="completed")return false;
      if(taskFilter==="completed" && task.status!=="completed")return false;
      if(searchTerm && !(`${task.title} ${task.description||""} ${task.category||""}`.toLowerCase().includes(searchTerm)))return false;
      if(categoryFilter!=="all" && (task.category||"Coding")!==categoryFilter)return false;
      if(priorityFilter!=="all" && (task.priority||"medium")!==priorityFilter)return false;
      return true;
    }).sort((a,b)=>{
      if(a.status!==b.status)return a.status==="completed"?1:-1;
      const pa={high:0,medium:1,low:2}; const p=(pa[a.priority]??1)-(pa[b.priority]??1);
      if(p)return p;
      return (reminderDate(a)?.getTime()||Infinity)-(reminderDate(b)?.getTime()||Infinity);
    });
  };

  window.taskCard=function(task){
    const overdue=isOverdue(task);
    const subs=task.subtasks||[];
    const doneSubs=subs.filter(s=>s.done).length;
    return `<article class="task-card ${task.status==="completed"?"completed":""}">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <h3 class="task-title">${esc(task.title)}</h3>
          ${task.description?`<p class="task-desc">${esc(task.description)}</p>`:""}
        </div>
        <span class="badge ${priorityClass(task.priority)}">${task.priority||"medium"}</span>
      </div>
      <div class="task-meta">
        <span class="badge task-category">● ${esc(task.category||"Coding")}</span>
        <span class="badge">Due: ${task.dueDate?formatShortDate(task.dueDate):"—"}</span>
        <span class="badge">${task.recurring&&task.recurring!=="none"?"↻ "+task.recurring:"One time"}</span>
        ${task.status==="completed"?`<span class="badge done">✓ ${formatTime(task.completedAt)}</span>`:`<span class="badge ${overdue?"overdue":""}">${countdown(task)}</span>`}
        ${overdue?`<span class="badge overdue">OVERDUE</span>`:""}
      </div>
      ${subs.length?`<div class="subtask-list-v2"><div class="subtask-v2" style="font-weight:700;margin-bottom:2px">${doneSubs}/${subs.length} subtasks</div>
        ${subs.map((s,i)=>`<label class="subtask-v2 ${s.done?"done":""}"><input type="checkbox" data-subtask="${task.id}" data-sub-index="${i}" ${s.done?"checked":""}>${esc(s.text)}</label>`).join("")}
      </div>`:""}
      ${task.proofDataUrl?`<div style="display:flex;align-items:center;gap:8px;margin-top:9px;color:#8f877b;font-size:9px">Proof:
        <img class="task-thumb" src="${task.proofDataUrl}" data-proof-view="${task.id}" alt="Proof">
        <span class="proof-extra-v2">${task.completedAt?new Date(task.completedAt).toLocaleDateString():"Saved"}</span>
      </div>`:""}
      <div class="task-actions">
        ${task.status==="completed"?`<button class="task-action proof" data-action="view-proof" data-id="${task.id}">View Proof</button>`:`<button class="task-action proof" data-action="proof" data-id="${task.id}">Upload Proof</button>`}
        <button class="task-action" data-action="focus" data-id="${task.id}">Focus</button>
        <button class="task-action" data-action="calendar" data-id="${task.id}">Set Reminder</button>
        <button class="task-action" data-action="duplicate" data-id="${task.id}">Duplicate</button>
        <button class="task-action" data-action="edit" data-id="${task.id}">Edit</button>
        <button class="task-action danger" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    </article>`;
  };

  const oldRenderTaskList=window.renderTaskList;
  window.renderTaskList=function(targetId,list){
    oldRenderTaskList(targetId,list);
    const el=$(targetId); if(!el)return;
    el.querySelectorAll("[data-subtask]").forEach(cb=>{
      cb.onchange=()=>{
        const t=tasks.find(x=>x.id===cb.dataset.subtask); if(!t)return;
        t.subtasks=t.subtasks||[];
        if(t.subtasks[Number(cb.dataset.subIndex)])t.subtasks[Number(cb.dataset.subIndex)].done=cb.checked;
        save(KEYS.TASKS,tasks); renderTasks(); renderDashboard(); renderV2Dashboard();
      };
    });
  };

  /* Re-render with the upgraded card renderer. */
  window.renderTasks=function(){
    renderTaskList("mainTaskList",filteredTasks());
    const today=todayKey();
    $("taskToday").textContent=tasks.filter(t=>t.dueDate===today||t.reminderDate===today).length;
    $("taskPending").textContent=tasks.filter(t=>t.status!=="completed").length;
    $("taskOverdue").textContent=tasks.filter(isOverdue).length;
    $("taskCompleted").textContent=tasks.filter(t=>t.status==="completed").length;
  };

  /* -------- Dashboard analytics -------- */
  function dayKeyOffset(offset){
    const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function streak(){
    const completedDates=new Set(tasks.filter(t=>t.status==="completed"&&t.completedAt).map(t=>todayKeyFromDate(t.completedAt)));
    let cursor=new Date(); cursor.setHours(0,0,0,0);
    let count=0;
    while(completedDates.has(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`)){
      count++; cursor.setDate(cursor.getDate()-1);
    }
    return count;
  }
  function todayKeyFromDate(iso){
    const d=new Date(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function sessionDate(s){ return s?.startedAt || s?.date || s?.started_at || null; }
  function focusMinutes(){
    const sessions=read(V2.FOCUS,[]);
    const today=todayKey();
    return Math.round(sessions.filter(s=>sessionDate(s)&&todayKeyFromDate(sessionDate(s))===today).reduce((a,s)=>a+(Number(s.minutes)||0),0));
  }
  function weekFocusMinutes(){
    const sessions=read(V2.FOCUS,[]);
    const keys=new Set(Array.from({length:7},(_,i)=>dayKeyOffset(-i)));
    return Math.round(sessions.filter(s=>sessionDate(s)&&keys.has(todayKeyFromDate(sessionDate(s)))).reduce((a,s)=>a+(Number(s.minutes)||0),0));
  }
  function weeklyCounts(){
    const arr=[];
    for(let i=6;i>=0;i--){
      const key=dayKeyOffset(-i);
      arr.push({key,count:tasks.filter(t=>t.status==="completed"&&t.completedAt&&todayKeyFromDate(t.completedAt)===key).length});
    }
    return arr;
  }
  function achievements(){
    const completed=tasks.filter(t=>t.status==="completed").length;
    const proofs=tasks.filter(t=>t.proofDataUrl).length;
    const focus=read(V2.FOCUS,[]).reduce((a,s)=>a+(Number(s.minutes)||0),0);
    const streakVal=streak();
    return [
      {icon:"🎯",ok:completed>=10,title:"10 tasks"},
      {icon:"🔥",ok:streakVal>=7,title:"7-day streak"},
      {icon:"⚡",ok:completed>=50,title:"50 tasks"},
      {icon:"🧠",ok:focus>=6000,title:"100 focus hours"},
      {icon:"📸",ok:proofs>=30,title:"30 proofs"}
    ];
  }
  function renderV2Dashboard(){
    const total=tasks.length, completed=tasks.filter(t=>t.status==="completed").length;
    const pct=total?Math.round(completed/total*100):0;
    if($("dashCompletion"))$("dashCompletion").textContent=pct+"%";
    if($("dashProgressBar"))$("dashProgressBar").style.width=pct+"%";
    if($("dashProgressText"))$("dashProgressText").textContent=`${completed} / ${total} completed`;
    if($("dashStreak"))$("dashStreak").textContent=streak();
    if($("dashFocusTime"))$("dashFocusTime").textContent=focusMinutes()>=60?`${Math.floor(focusMinutes()/60)}h ${focusMinutes()%60}m`:`${focusMinutes()}m`;

    const week=weeklyCounts(), max=Math.max(1,...week.map(x=>x.count));
    if($("weeklyChart")){
      $("weeklyChart").innerHTML=week.map((x,i)=>{
        const d=new Date(); d.setDate(d.getDate()-(6-i));
        return `<div class="v2-bar-col ${i===6?"today":""}" title="${x.count} completed"><div class="v2-bar" style="height:${Math.max(5,x.count/max*88)}%"></div><span>${d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,2)}</span></div>`;
      }).join("");
    }
    const rate=total?Math.round(completed/total*100):0;
    if($("dashWeekRate"))$("dashWeekRate").textContent=rate+"% overall";
    const weekStartKey=dayKeyOffset(-6),weekEndKey=dayKeyOffset(0);
    const weekCompleted=tasks.filter(t=>t.status==="completed"&&t.completedAt).filter(t=>{const k=todayKeyFromDate(t.completedAt);return k>=weekStartKey&&k<=weekEndKey});
    const weekDue=tasks.filter(t=>(t.dueDate||t.reminderDate)&&String(t.dueDate||t.reminderDate)>=weekStartKey&&String(t.dueDate||t.reminderDate)<=weekEndKey);
    const activeDays=new Set(weekCompleted.map(t=>todayKeyFromDate(t.completedAt))).size;
    const weekFocus=weekFocusMinutes();
    const weekCompletion=weekDue.length?Math.round(weekCompleted.length/weekDue.length*100):0;
    if($("dashWeekFocus"))$("dashWeekFocus").textContent=weekFocus>=60?`${Math.floor(weekFocus/60)}h ${weekFocus%60}m`:`${weekFocus}m`;
    if($("dashWeekCompleted"))$("dashWeekCompleted").textContent=weekCompleted.length;
    if($("dashWeekCompletion"))$("dashWeekCompletion").textContent=weekCompletion+"%";
    if($("dashActiveDays"))$("dashActiveDays").textContent=`${activeDays} / 7`;
    if($("dashAvgFocus"))$("dashAvgFocus").textContent=`${Math.round(weekFocus/7)}m`;
    const attention=[];
    const overdue=tasks.filter(t=>t.status!=="completed"&&isOverdue(t)).length;
    const dueToday=tasks.filter(t=>t.status!=="completed"&&(t.dueDate===todayKey()||t.reminderDate===todayKey())).length;
    const highPending=tasks.filter(t=>t.status!=="completed"&&String(t.priority||t.tag||t.priorityLevel||"").toLowerCase().includes("high")).length;
    if(overdue)attention.push(`<div class="v2-attention-item danger"><span class="dot"></span><span><strong>${overdue}</strong> overdue task${overdue===1?"":"s"} need attention.</span></div>`);
    if(dueToday)attention.push(`<div class="v2-attention-item"><span class="dot"></span><span><strong>${dueToday}</strong> task${dueToday===1?"":"s"} scheduled for today.</span></div>`);
    if(highPending)attention.push(`<div class="v2-attention-item"><span class="dot"></span><span><strong>${highPending}</strong> high-priority task${highPending===1?"":"s"} still open.</span></div>`);
    if(!attention.length)attention.push(`<div class="v2-attention-item good"><span class="dot"></span><span>Nothing urgent. Your workspace is clear.</span></div>`);
    if($("dashAttention"))$("dashAttention").innerHTML=attention.join("");
    const ach=achievements();
    if($("achievementCount"))$("achievementCount").textContent=`${ach.filter(a=>a.ok).length} / ${ach.length}`;
    if($("achievementRow"))$("achievementRow").innerHTML=ach.map(a=>`<div class="achievement ${a.ok?"unlocked":""}" title="${a.title}">${a.icon}</div>`).join("");
    $("dashToday") && ($("dashToday").textContent=tasks.filter(t=>t.dueDate===todayKey()||t.reminderDate===todayKey()).length);
    $("dashPending") && ($("dashPending").textContent=tasks.filter(t=>t.status!=="completed").length);
    $("dashOverdue") && ($("dashOverdue").textContent=tasks.filter(isOverdue).length);
    $("dashCompleted") && ($("dashCompleted").textContent=completed);
  }
  window.renderDashboard=function(){ renderV2Dashboard(); const upcoming=tasks.filter(t=>t.status!=="completed").sort((a,b)=>(reminderDate(a)?.getTime()||Infinity)-(reminderDate(b)?.getTime()||Infinity)).slice(0,4); renderTaskList("dashboardTaskList",upcoming); };

  $("dashboardFocus")?.addEventListener("click",()=>startFocusFromTask());

  /* -------- Focus session tracking -------- */
  const originalStartFocus=window.startFocus, originalPauseFocus=window.pauseFocus;
  window.startFocus=function(){
    if(!focusStartedAt)focusStartedAt=Date.now();
    originalStartFocus();
  };
  window.pauseFocus=function(){
    if(focusStartedAt){
      const elapsed=Math.max(0,Math.floor((Date.now()-focusStartedAt)/60000));
      if(elapsed>0){
        const sessions=read(V2.FOCUS,[]);
        sessions.push({startedAt:new Date(Date.now()-elapsed*60000).toISOString(),completedAt:new Date().toISOString(),minutes:elapsed});
        write(V2.FOCUS,sessions);
      }
      focusStartedAt=null;
    }
    originalPauseFocus();
    renderV2Dashboard();
  };

  /* -------- Knowledge vault -------- */
  function notePreview(md){
    let s=esc(md);
    s=s.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h3>$1</h3>").replace(/^# (.*)$/gm,"<h3>$1</h3>");
    s=s.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/`([^`]+)`/g,"<code>$1</code>");
    return s;
  }
  function ensureNote(){
    if(v2Notes.length && (!activeV2Note || !v2Notes.some(n=>n.id===activeV2Note))){
      activeV2Note=v2Notes[0].id;
    }
  }
  function renderNotes(){
    ensureNote();
    const list=$("notesListV2"); if(!list)return;
    list.innerHTML=v2Notes.length
      ? v2Notes.map(n=>`<div class="note-list-item-v2 ${n.id===activeV2Note?"active":""}" data-note-v2="${n.id}"><strong>${esc(n.title||"Untitled")}</strong><small>${esc(n.tags||"No tags")}</small></div>`).join("")
      : `<div class="notes-empty-v2">No notes yet.<br>Click <strong>+ New</strong> to create one.</div>`;
    const n=v2Notes.find(x=>x.id===activeV2Note);
    const hasNote=!!n;
    $("noteTitleV2").value=hasNote?(n.title||""):"";
    $("noteTagsV2").value=hasNote?(n.tags||""):"";
    $("noteBodyV2").value=hasNote?(n.body||""):"";
    $("notePreviewV2").innerHTML=hasNote?notePreview(n.body||""):"";
    [$('noteTitleV2'),$('noteTagsV2'),$('noteBodyV2'),$('saveNoteButton'),$('deleteNoteButton')].forEach(el=>{if(el)el.disabled=!hasNote});
    list.querySelectorAll("[data-note-v2]").forEach(el=>el.onclick=()=>{activeV2Note=el.dataset.noteV2;renderNotes()});
  }
  function saveActiveNote(){
    const n=v2Notes.find(x=>x.id===activeV2Note); if(!n)return;
    n.title=$("noteTitleV2").value.trim()||"Untitled";
    n.tags=$("noteTagsV2").value.trim();
    n.body=$("noteBodyV2").value;
    write(V2.NOTES,v2Notes); renderNotes(); toast("Note saved.");
  }
  $("noteBodyV2")?.addEventListener("input",()=>{$("notePreviewV2").innerHTML=notePreview($("noteBodyV2").value)});
  $("noteTitleV2")?.addEventListener("input",()=>{});
  $("saveNoteButton")?.addEventListener("click",saveActiveNote);
  $("newNoteButton")?.addEventListener("click",()=>{
    const n={id:crypto.randomUUID(),title:"New Note",tags:"",body:""};
    v2Notes.unshift(n);activeV2Note=n.id;write(V2.NOTES,v2Notes);renderNotes();toast("New note created.");
  });
  $("deleteNoteButton")?.addEventListener("click",async ()=>{
    const n=v2Notes.find(x=>x.id===activeV2Note);
    if(!n)return;
    if(!(await nexaConfirm(`Delete "${n.title||"Untitled"}"? This cannot be undone.`,{title:"Delete note",kicker:"NOTES",danger:true})))return;
    v2Notes=v2Notes.filter(x=>x.id!==activeV2Note);
    activeV2Note=v2Notes[0]?.id||null;
    write(V2.NOTES,v2Notes);
    renderNotes();
    toast("Note deleted.");
  });

  /* -------- Proof metadata / timeline -------- */
  const oldRenderProofs=window.renderProofs;
  window.renderProofs=function(){
    oldRenderProofs();
    $("proofGrid")?.querySelectorAll(".proof-card").forEach(card=>{
      const title=card.querySelector("h3")?.textContent;
      const t=tasks.find(x=>x.title===title);
      if(t){
        const extra=document.createElement("p"); extra.className="proof-extra-v2";
        extra.textContent=`${t.category||"Coding"} · ${t.completedAt?new Date(t.completedAt).toLocaleString():"Completed"}`;
        card.appendChild(extra);
      }
    });
  };

  /* -------- View hook -------- */
  const oldSwitchView=window.switchView;
  window.switchView=function(view){
    oldSwitchView(view);
    if(view==="notes")renderNotes();
    if(view==="dashboard")renderV2Dashboard();
  };

  /* -------- Command palette additions -------- */
  if(typeof commandItems!=="undefined"){
    commandItems.push(
      {label:"Open Knowledge Vault",detail:"Notes",action:()=>switchView("notes")},
      {label:"Start Focus Session",detail:"25 minutes",action:()=>startFocusFromTask()},
      {label:"Add Task",detail:"Create",action:()=>{switchView("tasks");openTaskModal()}}
    );
  }

  /* -------- Keyboard shortcuts -------- */
  document.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommandPalette();return;}
    if(e.key==="Escape"){ if($("notes")?.style.display==="block"){} }
  });


  /* -------- Multiple brainstorm boards + attachments + exports -------- */
  const BOARD_KEY="naveen_brainstorm_boards_v2";
  let v2Boards=read(BOARD_KEY,[]);
  let currentBoardId=localStorage.getItem("naveen_current_board_v2")||"main";

  function saveCurrentBoardSnapshot(nameOverride){
    const name=nameOverride||v2Boards.find(b=>b.id===currentBoardId)?.name||"Main Board";
    const existing=v2Boards.find(b=>b.id===currentBoardId);
    const data={id:currentBoardId,name,notes:brainNotes,connectors:brainConnectors,updatedAt:new Date().toISOString()};
    if(existing)Object.assign(existing,data); else v2Boards.push(data);
    write(BOARD_KEY,v2Boards);
  }
  function ensureBoards(){
    if(!v2Boards.length){
      v2Boards=[{id:"main",name:"Main Board",notes:brainNotes,connectors:brainConnectors,updatedAt:new Date().toISOString()}];
      write(BOARD_KEY,v2Boards);
    }
    if(!v2Boards.some(b=>b.id===currentBoardId))currentBoardId=v2Boards[0].id;
    localStorage.setItem("naveen_current_board_v2",currentBoardId);
  }
  function renderBoardPicker(){
    ensureBoards();
    const box=$("boardListV2"); if(!box)return;
    box.innerHTML=v2Boards.map(b=>`<div class="board-item-v2">
      <div><strong>${esc(b.name)}</strong><small>${(b.notes||[]).length} ideas · ${new Date(b.updatedAt||Date.now()).toLocaleDateString()}</small></div>
      <div style="display:flex;gap:6px">
        <button data-load-board="${b.id}">Open</button>
        <button data-rename-board="${b.id}">Rename</button>
        ${v2Boards.length>1?`<button data-delete-board="${b.id}">Delete</button>`:""}
      </div>
    </div>`).join("");
    box.querySelectorAll("[data-load-board]").forEach(b=>b.onclick=()=>{
      saveCurrentBoardSnapshot();
      const board=v2Boards.find(x=>x.id===b.dataset.loadBoard); if(!board)return;
      currentBoardId=board.id; localStorage.setItem("naveen_current_board_v2",currentBoardId);
      brainNotes=JSON.parse(JSON.stringify(board.notes||[])); brainConnectors=JSON.parse(JSON.stringify(board.connectors||[]));
      saveBrainScene(); render(); setZoom(1); $("boardPickerModal").style.display="none"; toast(`Opened ${board.name}.`);
    });
    box.querySelectorAll("[data-rename-board]").forEach(b=>b.onclick=async()=>{
      const board=v2Boards.find(x=>x.id===b.dataset.renameBoard); if(!board)return;
      const name=await nexaPrompt("Board name",board.name,{title:"Rename board",kicker:"BRAINSTORM"}); if(name===null)return;
      board.name=name.trim(); board.updatedAt=new Date().toISOString(); write(BOARD_KEY,v2Boards); renderBoardPicker();
    });
    box.querySelectorAll("[data-delete-board]").forEach(b=>b.onclick=async()=>{
      if(v2Boards.length<=1)return;
      const board=v2Boards.find(x=>x.id===b.dataset.deleteBoard); if(!board)return;
      if(!(await nexaConfirm(`Delete "${board.name}"? This cannot be undone.`,{title:"Delete board",kicker:"BRAINSTORM",danger:true})))return;
      v2Boards=v2Boards.filter(x=>x.id!==board.id); write(BOARD_KEY,v2Boards);
      if(currentBoardId===board.id){
        currentBoardId=v2Boards[0].id; const next=v2Boards[0];
        brainNotes=JSON.parse(JSON.stringify(next.notes||[])); brainConnectors=JSON.parse(JSON.stringify(next.connectors||[]));
        saveBrainScene(); render();
      }
      renderBoardPicker();
    });
  }
  ensureBoards();
  $("boardsButton")?.addEventListener("click",()=>{$("boardPickerModal").style.display="flex";renderBoardPicker()});
  $("closeBoards")?.addEventListener("click",()=>{$("boardPickerModal").style.display="none"});
  $("boardPickerModal")?.addEventListener("click",e=>{if(e.target===$("boardPickerModal"))$("boardPickerModal").style.display="none"});

  const originalNewBoard=$("newBoardButton")?.onclick;
  $("newBoardButton")?.addEventListener("click",async()=>{
    saveCurrentBoardSnapshot();
    const name=await nexaPrompt("Choose a name for your new brainstorming board.","Untitled Board",{title:"New board",kicker:"BRAINSTORM"});
    if(name===null)return;
    const b={id:crypto.randomUUID(),name:name.trim(),notes:[],connectors:[],updatedAt:new Date().toISOString()};
    v2Boards.push(b);write(BOARD_KEY,v2Boards);
    currentBoardId=b.id;localStorage.setItem("naveen_current_board_v2",currentBoardId);
    brainNotes=[];brainConnectors=[];selectedId=null;history=[];historyIndex=-1;pushHistory();saveBrainScene();render();renderBoardPicker();
    toast(`Created ${b.name}.`);
  });
  /* Disable the original destructive New Board click handler when V2 listener is used. */
  if($("newBoardButton") && originalNewBoard)$("newBoardButton").onclick=null;

  $("attachBrainButton")?.addEventListener("click",()=>{
    if(!selectedId){toast("Select a sticky first.","error");return}
    $("brainAttachmentInput").click();
  });
  $("brainAttachmentInput")?.addEventListener("change",e=>{
    const file=e.target.files?.[0], n=brainNotes.find(x=>x.id===selectedId);
    if(!file||!n)return;
    if(file.size>4*1024*1024){toast("Keep attachments below 4 MB.","error");return}
    const reader=new FileReader();
    reader.onload=ev=>{
      n.attachment={name:file.name,type:file.type,data:ev.target.result};
      pushHistory();saveBrainScene();saveCurrentBoardSnapshot();render();toast("Attachment added.");
    };
    reader.readAsDataURL(file);
    e.target.value="";
  });

  const oldRenderBrain=window.render;
  window.render=function(){
    oldRenderBrain();
    document.querySelectorAll("#stickyLayer .brain-ref-sticky").forEach(el=>{
      const n=brainNotes.find(x=>x.id===el.dataset.id); if(!n?.attachment)return;
      const a=document.createElement("div"); a.className="brain-attachment-v2";
      if(n.attachment.type?.startsWith("image/"))a.innerHTML=`<img src="${n.attachment.data}" alt="">${esc(n.attachment.name)}`;
      else a.textContent=`📎 ${n.attachment.name}`;
      el.appendChild(a);
    });
  };

  function exportBrainPNG(){
    const board=$("board"); if(!board)return;
    const canvas=document.createElement("canvas"), rect=board.getBoundingClientRect();
    canvas.width=Math.max(1000,Math.round(rect.width)); canvas.height=Math.max(650,Math.round(rect.height));
    const c=canvas.getContext("2d"); c.fillStyle="#f6eddc"; c.fillRect(0,0,canvas.width,canvas.height);
    c.strokeStyle="#d6cab4"; c.globalAlpha=.5;
    for(let x=0;x<canvas.width;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,canvas.height);c.stroke()}
    for(let y=0;y<canvas.height;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(canvas.width,y);c.stroke()}
    const colors={"brain-ref-yellow":"#f0cf67","brain-ref-pink":"#efb0ad","brain-ref-green":"#b9d77e","brain-ref-blue":"#9ccbe7","brain-ref-purple":"#cdb5de"};
    c.globalAlpha=1;
    brainConnectors.forEach(link=>{
      const a=brainNotes.find(n=>n.id===link.a),b=brainNotes.find(n=>n.id===link.b);if(!a||!b)return;
      c.strokeStyle="#5b5247";c.lineWidth=2;c.beginPath();c.moveTo(a.x+110,a.y+78);c.lineTo(b.x+110,b.y+78);c.stroke();
    });
    brainNotes.forEach(n=>{
      c.fillStyle=colors[n.color]||"#f0cf67";c.fillRect(n.x,n.y,220,160);
      const lines=n.text.split("\n"); c.fillStyle="#342e25"; c.font="bold 18px Georgia"; c.fillText(lines[0]||"Idea",n.x+18,n.y+28);
      c.font="13px sans-serif"; lines.slice(1,8).forEach((line,i)=>c.fillText(line,n.x+18,n.y+52+i*18));
    });
    const a=document.createElement("a");a.download=`${(v2Boards.find(b=>b.id===currentBoardId)?.name||"brainstorm").replace(/\s+/g,"-")}.png`;a.href=canvas.toDataURL("image/png");a.click();toast("Brainstorm exported as PNG.");
  }
  $("exportBrainPng")?.addEventListener("click",exportBrainPNG);
  $("exportBrainPdf")?.addEventListener("click",()=>{saveCurrentBoardSnapshot();window.print();});

  /* Expose Knowledge renderer so cloud/auth bridge can call it safely. */
  window.renderNotes=renderNotes;

  /* -------- Init -------- */
  setTimeout(()=>{
    renderAll();
    renderV2Dashboard();
    if(activeView==="notes")renderNotes();
    if($("focusStart"))$("focusStart").onclick=()=>{
      if(focusRunning) window.pauseFocus(); else window.startFocus();
    };
    if($("focusReset"))$("focusReset").onclick=()=>{ focusStartedAt=null; resetFocus(); };
  },50);
})();


/* Source inline script 3 */

/* ============================================================
   BRAINSTORM — FREEFORM DRAWING LAYER (Excalidraw-style)
   Sits above the sticky-note canvas. Pen / Line / Rect / Ellipse /
   Arrow / Erase. Shares pan+zoom with the sticky layer, and shares
   Undo/Redo history with the sticky board.
============================================================ */
(function(){
  const DRAW_KEY = "naveen_spa_draw_v3";
  let canvasW = 1, canvasH = 1, dpr = 1;
  const SHAPE_TOOLS = ["pen","line","rect","ellipse","arrow"];
  const ERASE_TOOL = "drawEraser";

  let drawStrokes = (typeof load === "function") ? load(DRAW_KEY, []) : [];
  let currentStrokeColor = "#24211d";
  let currentStrokeWidth = 2;
  let activeStroke = null;
  let isErasing = false;
  let drawCtx = null;
  let drawSaveTimer = null;
  let selectedDrawId = null;
  let draggingDraw = null;

  function uid(){
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "s"+Date.now()+Math.random().toString(16).slice(2);
  }

  /* ---------- setup ---------- */
  function resizeDrawLayer(force=false){
    const canvas = document.getElementById("drawLayer");
    const workspace = document.getElementById("workspace");
    if(!canvas || !workspace) return;
    const rect=workspace.getBoundingClientRect();
    const nextW=Math.max(1,Math.round(rect.width));
    const nextH=Math.max(1,Math.round(rect.height));
    const nextDpr=window.devicePixelRatio||1;
    if(!force && nextW===canvasW && nextH===canvasH && nextDpr===dpr) return;
    canvasW=nextW; canvasH=nextH; dpr=nextDpr;
    canvas.style.width=canvasW+"px";
    canvas.style.height=canvasH+"px";
    canvas.width=Math.max(1,Math.round(canvasW*dpr));
    canvas.height=Math.max(1,Math.round(canvasH*dpr));
    drawCtx=canvas.getContext("2d");
    renderDrawStrokes();
  }

  function initDrawLayer(){
    const canvas = document.getElementById("drawLayer");
    if(!canvas) return;
    resizeDrawLayer(true);
    canvas.addEventListener("pointerdown", onDrawPointerDown);
    canvas.addEventListener("pointermove", onDrawPointerMove);
    window.addEventListener("pointerup", onDrawPointerUp);
    window.addEventListener("resize", ()=>resizeDrawLayer(true));
    if("ResizeObserver" in window){
      const ro=new ResizeObserver(()=>resizeDrawLayer());
      const ws=document.getElementById("workspace");
      if(ws) ro.observe(ws);
    }
  }

  function applyDrawTransform(){
    resizeDrawLayer();
    renderDrawStrokes();
  }

  function syncDrawToolUI(){
    const canvas = document.getElementById("drawLayer");
    const bar = document.getElementById("drawOptionsBar");
    if(!canvas) return;
    const isDraw = SHAPE_TOOLS.includes(activeTool) || activeTool===ERASE_TOOL;
    canvas.classList.toggle("brain-draw-active", isDraw);
    canvas.classList.toggle("brain-draw-erase", activeTool===ERASE_TOOL);
    if(bar) bar.classList.toggle("show", isDraw);
  }

  /* ---------- hook into existing globals (safe: same pattern app already uses) ---------- */
  if(typeof selectTool === "function"){
    const origSelectTool = selectTool;
    selectTool = function(tool){
      origSelectTool(tool);
      syncDrawToolUI();
    };
  }
  if(typeof setZoom === "function"){
    const origSetZoom = setZoom;
    setZoom = function(value){
      origSetZoom(value);
      applyDrawTransform();
    };
  }
  if(typeof brainSnapshot === "function"){
    brainSnapshot = function(){
      return JSON.stringify({notes:brainNotes, connectors:brainConnectors, strokes:drawStrokes});
    };
  }
  if(typeof restoreBrainSnapshot === "function"){
    restoreBrainSnapshot = function(s){
      const obj = JSON.parse(s);
      brainNotes = obj.notes||[];
      brainConnectors = obj.connectors||[];
      drawStrokes = obj.strokes||[];
      saveBrainScene();
      save(DRAW_KEY, drawStrokes);
      render();
      renderDrawStrokes();
    };
  }
  window.addEventListener("pointermove", ()=>{ if(typeof panMode!=="undefined" && panMode) applyDrawTransform(); });

  /* ---------- coordinate helpers ---------- */
  function toBoardCoords(e){
    const r = document.getElementById("board").getBoundingClientRect();
    return {
      x: (e.clientX - r.left - panX) / zoom,
      y: (e.clientY - r.top - panY) / zoom
    };
  }

  /* ---------- drawing lifecycle ---------- */
  function onDrawPointerDown(e){
    if(activeView!=="brainstorm") return;
    const isShape = SHAPE_TOOLS.includes(activeTool);
    const isErase = activeTool===ERASE_TOOL;
    if(!isShape && !isErase) return;
    e.preventDefault();
    const pt = toBoardCoords(e);
    e.target.setPointerCapture?.(e.pointerId);

    if(isErase){
      isErasing = true;
      eraseStrokesNear(pt);
      return;
    }
    isErasing = false;
    activeStroke = {
      id: uid(),
      type: activeTool==="pen" ? "freehand" : activeTool,
      color: currentStrokeColor,
      width: currentStrokeWidth,
      points: activeTool==="pen" ? [pt] : [pt, {x:pt.x,y:pt.y}]
    };
  }

  function onDrawPointerMove(e){
    if(activeView!=="brainstorm") return;
    if(isErasing){
      if(e.buttons===1) eraseStrokesNear(toBoardCoords(e));
      return;
    }
    if(!activeStroke) return;
    const pt = toBoardCoords(e);
    if(activeStroke.type==="freehand") activeStroke.points.push(pt);
    else activeStroke.points[1] = pt;
    renderDrawStrokes(activeStroke);
  }

  function onDrawPointerUp(){
    if(isErasing){
      isErasing = false;
      pushHistory();
      scheduleDrawSave();
      return;
    }
    if(!activeStroke) return;
    const s = activeStroke;
    const a = s.points[0], b = s.points[s.points.length-1];
    const dist = Math.hypot((b?.x??0)-(a?.x??0), (b?.y??0)-(a?.y??0));
    const tooSmall = s.type==="freehand" ? s.points.length<2 : dist<3;
    if(!tooSmall){
      drawStrokes.push(s);
      pushHistory();
      scheduleDrawSave();
    }
    activeStroke = null;
    renderDrawStrokes();
  }

  function scheduleDrawSave(){
    clearTimeout(drawSaveTimer);
    drawSaveTimer = setTimeout(()=>{ save(DRAW_KEY, drawStrokes); }, 400);
  }

  /* ---------- erase ---------- */
  function eraseStrokesNear(pt){
    const THRESH = 14;
    const before = drawStrokes.length;
    drawStrokes = drawStrokes.filter(s=>!strokeNearPoint(s, pt, THRESH));
    if(drawStrokes.length!==before) renderDrawStrokes();
  }
  function strokeNearPoint(s, pt, thresh){
    if(s.type==="freehand") return s.points.some(p=>Math.hypot(p.x-pt.x,p.y-pt.y)<thresh);
    const [a,b] = s.points;
    if(s.type==="rect"||s.type==="ellipse"){
      const minX=Math.min(a.x,b.x)-thresh, maxX=Math.max(a.x,b.x)+thresh;
      const minY=Math.min(a.y,b.y)-thresh, maxY=Math.max(a.y,b.y)+thresh;
      return pt.x>=minX&&pt.x<=maxX&&pt.y>=minY&&pt.y<=maxY;
    }
    return distToSegment(pt,a,b) < thresh;
  }
  function distToSegment(p,a,b){
    const l2 = (b.x-a.x)**2+(b.y-a.y)**2;
    if(l2===0) return Math.hypot(p.x-a.x,p.y-a.y);
    let t = ((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/l2;
    t = Math.max(0,Math.min(1,t));
    return Math.hypot(p.x-(a.x+t*(b.x-a.x)), p.y-(a.y+t*(b.y-a.y)));
  }

  /* ---------- rendering ---------- */
  function renderDrawStrokes(previewStroke){
    const canvas=document.getElementById("drawLayer");
    if(!drawCtx || !canvas) return;
    const rect=document.getElementById("workspace")?.getBoundingClientRect();
    if(!rect) return;
    const w=Math.max(1,Math.round(rect.width));
    const h=Math.max(1,Math.round(rect.height));
    if(w!==canvasW || h!==canvasH || (window.devicePixelRatio||1)!==dpr){
      resizeDrawLayer(true);
      return;
    }
    drawCtx.setTransform(dpr,0,0,dpr,0,0);
    drawCtx.clearRect(0,0,canvasW,canvasH);
    drawCtx.save();
    drawCtx.translate(panX,panY);
    drawCtx.scale(zoom,zoom);
    drawStrokes.forEach(s=>{
      paintStroke(drawCtx,s);
      if(s.id===selectedDrawId) paintSelectionOutline(drawCtx,s);
    });
    if(previewStroke) paintStroke(drawCtx, previewStroke);
    drawCtx.restore();
  }
  window.__renderInfiniteDraw=renderDrawStrokes;

  function paintStroke(ctx, s){
    if(!s.points || !s.points.length) return;
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if(s.type==="freehand"){
      if(s.points.length<2){ ctx.restore(); return; }
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for(let i=1;i<s.points.length;i++){
        const p0=s.points[i-1], p1=s.points[i];
        ctx.quadraticCurveTo(p0.x,p0.y,(p0.x+p1.x)/2,(p0.y+p1.y)/2);
      }
      ctx.stroke();
    } else if(s.type==="rect"){
      const [a,b]=s.points;
      ctx.strokeRect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y));
    } else if(s.type==="ellipse"){
      const [a,b]=s.points;
      const cx=(a.x+b.x)/2, cy=(a.y+b.y)/2, rx=Math.abs(b.x-a.x)/2, ry=Math.abs(b.y-a.y)/2;
      ctx.beginPath();
      ctx.ellipse(cx,cy,Math.max(rx,.1),Math.max(ry,.1),0,0,Math.PI*2);
      ctx.stroke();
    } else if(s.type==="line"){
      const [a,b]=s.points;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    } else if(s.type==="arrow"){
      const [a,b]=s.points;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      const angle = Math.atan2(b.y-a.y,b.x-a.x);
      const headLen = 8+s.width*2;
      ctx.beginPath();
      ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x-headLen*Math.cos(angle-Math.PI/7), b.y-headLen*Math.sin(angle-Math.PI/7));
      ctx.lineTo(b.x-headLen*Math.cos(angle+Math.PI/7), b.y-headLen*Math.sin(angle+Math.PI/7));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }


  function paintSelectionOutline(ctx,s){
    if(!s?.points?.length) return;
    ctx.save();
    ctx.strokeStyle = "rgba(240,207,103,.95)";
    ctx.lineWidth = Math.max(3,(s.width||2)+4);
    ctx.setLineDash([6,5]);
    ctx.lineCap="round";
    ctx.lineJoin="round";
    if(s.type==="freehand"){
      if(s.points.length<2){ctx.restore();return;}
      ctx.beginPath();
      ctx.moveTo(s.points[0].x,s.points[0].y);
      for(let i=1;i<s.points.length;i++){
        const p0=s.points[i-1],p1=s.points[i];
        ctx.quadraticCurveTo(p0.x,p0.y,(p0.x+p1.x)/2,(p0.y+p1.y)/2);
      }
      ctx.stroke();
    }else if(s.type==="rect"){
      const [a,b]=s.points;
      ctx.strokeRect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y));
    }else if(s.type==="ellipse"){
      const [a,b]=s.points;
      const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,rx=Math.abs(b.x-a.x)/2,ry=Math.abs(b.y-a.y)/2;
      ctx.beginPath();ctx.ellipse(cx,cy,Math.max(rx,.1),Math.max(ry,.1),0,0,Math.PI*2);ctx.stroke();
    }else{
      const [a,b]=s.points;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    ctx.restore();
  }

  function selectDrawStrokeAt(pt){
    const threshold = 14 / Math.max(zoom,.01);
    for(let i=drawStrokes.length-1;i>=0;i--){
      if(strokeNearPoint(drawStrokes[i],pt,threshold)){
        selectedDrawId=drawStrokes[i].id;
        selectedId=null;
        renderDrawStrokes();
        if(typeof render==="function") render();
        return true;
      }
    }
    return false;
  }

  function moveStrokeBy(stroke, dx, dy){
    if(!stroke?.points) return;
    stroke.points = stroke.points.map(p=>({x:p.x+dx,y:p.y+dy}));
  }

  function beginDrawDrag(pt, pointerId){
    if(!selectedDrawId) return false;
    const stroke=drawStrokes.find(s=>s.id===selectedDrawId);
    if(!stroke) return false;
    draggingDraw={
      id:stroke.id,
      lastX:pt.x,
      lastY:pt.y,
      pointerId
    };
    return true;
  }

  function updateDrawDrag(pt){
    if(!draggingDraw) return;
    const stroke=drawStrokes.find(s=>s.id===draggingDraw.id);
    if(!stroke){ draggingDraw=null; return; }
    const dx=pt.x-draggingDraw.lastX;
    const dy=pt.y-draggingDraw.lastY;
    if(dx===0 && dy===0) return;
    moveStrokeBy(stroke,dx,dy);
    draggingDraw.lastX=pt.x;
    draggingDraw.lastY=pt.y;
    renderDrawStrokes();
  }

  function endDrawDrag(){
    if(!draggingDraw) return;
    draggingDraw=null;
    pushHistory();
    scheduleDrawSave();
    renderDrawStrokes();
  }

  function deleteSelectedDraw(){
    if(!selectedDrawId) return false;
    const before=drawStrokes.length;
    drawStrokes=drawStrokes.filter(s=>s.id!==selectedDrawId);
    if(drawStrokes.length===before) return false;
    selectedDrawId=null;
    pushHistory();
    scheduleDrawSave();
    renderDrawStrokes();
    toast("Drawing deleted.");
    return true;
  }

  /* ---------- toolbar wiring ---------- */
  function wireDrawToolbar(){
    document.querySelectorAll("[data-draw-color]").forEach(btn=>{
      btn.onclick = ()=>{
        currentStrokeColor = btn.dataset.drawColor;
        document.querySelectorAll("[data-draw-color]").forEach(b=>b.classList.toggle("active", b===btn));
      };
    });
    document.querySelectorAll("[data-draw-width]").forEach(btn=>{
      btn.onclick = ()=>{
        currentStrokeWidth = parseInt(btn.dataset.drawWidth,10);
        document.querySelectorAll("[data-draw-width]").forEach(b=>b.classList.toggle("active", b===btn));
      };
    });
    document.getElementById("clearDrawingBtn")?.addEventListener("click", async ()=>{
      if(!drawStrokes.length){ toast("Drawing is already empty.","error"); return; }
      if(!(await nexaConfirm("Clear all drawings from this canvas? Sticky notes will not be affected.",{title:"Clear drawings?",kicker:"BRAINSTORM",danger:true,confirmText:"Clear drawings"}))) return;
      drawStrokes = [];
      pushHistory();
      scheduleDrawSave();
      renderDrawStrokes();
      toast("Drawing cleared.");
    });
  }


  function wireDrawSelectionControls(){
    const ws=document.getElementById("workspace");
    if(!ws) return;

    ws.addEventListener("pointerdown",e=>{
      if(activeView!=="brainstorm" || activeTool!=="select" || panMode) return;
      if(e.button!==0) return;
      if(e.target.closest(".brain-ref-sticky")) return;
      const pt=toBoardCoords(e);
      if(selectDrawStrokeAt(pt)){
        beginDrawDrag(pt,e.pointerId);
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    window.addEventListener("pointermove",e=>{
      if(!draggingDraw || draggingDraw.pointerId!==e.pointerId) return;
      updateDrawDrag(toBoardCoords(e));
      e.preventDefault();
    }, true);

    window.addEventListener("pointerup",e=>{
      if(!draggingDraw || draggingDraw.pointerId!==e.pointerId) return;
      endDrawDrag();
    }, true);

    document.addEventListener("keydown",e=>{
      if(activeView!=="brainstorm") return;
      const tag=(e.target?.tagName||"").toLowerCase();
      if(tag==="input"||tag==="textarea"||tag==="select") return;
      if(e.key==="Delete" || e.key==="Backspace"){
        if(selectedDrawId){
          e.preventDefault();
          deleteSelectedDraw();
        }
      }
    });

    document.getElementById("deleteSelectedDrawBtn")?.addEventListener("click",()=>{
      if(!deleteSelectedDraw()){
        toast("Select a drawing first.","error");
      }
    });

    document.getElementById("drawEraserBtn")?.addEventListener("click",()=>{
      if(typeof selectTool==="function") selectTool("drawEraser");
      if(typeof syncDrawToolUI==="function") syncDrawToolUI();
    });
  }

  /* ---------- init ---------- */
  function boot(){
    if(typeof $ !== "function" || !document.getElementById("drawLayer")) { setTimeout(boot, 60); return; }
    initDrawLayer();
    wireDrawToolbar();
    wireDrawSelectionControls();
    syncDrawToolUI();
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded", ()=>setTimeout(boot,80));
  } else {
    setTimeout(boot,80);
  }
})();


/* Source inline script 4 */

(function(){
  const CFG={url:"https://ueyivshnnbfnzjoqhwzs.supabase.co",key:"sb_publishable_buUiXmdH8BEHrynIL0el0w_nOYf86xB"};
  let client=null, authMode="login", booting=true;
  // Cloud sync is intentionally queued so rapid local writes cannot be dropped.
  // Each logical key is coalesced, retried with backoff, and flushed again if a
  // local change arrives while an earlier request is in flight.
  const CLOUD_KEYS=new Set([
    'naveen_spa_tasks_v3','naveen_knowledge_notes_v1','naveen_spa_notes_v3',
    'naveen_spa_connectors_v3','naveen_brainstorm_boards_v2','naveen_focus_sessions_v1',
    'naveen_spa_theme_v3','nexa_settings_preferences_v1'
  ]);
  const syncQueue=new Set();
  let syncTimer=null, syncInFlight=false, syncBackoff=0;
  const originalSetItem=localStorage.setItem.bind(localStorage);
  const originalRemoveItem=localStorage.removeItem.bind(localStorage);
  window.NEXA_DISPLAY_NAME="there";
  window.NEXA_BACKEND={client:null};

  const $n=(id)=>document.getElementById(id);
  const localJson=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const saveJson=(k,v)=>originalSetItem(k,JSON.stringify(v));
  const authGate=$n('nexaAuthGate');
  const app=document.querySelector('.app');
  function markAuthReady(){document.documentElement.classList.add('nexa-auth-ready')}
  function authShow(){app?.classList.add('auth-hidden');authGate.style.display='flex';markAuthReady();}
  function appShow(){app?.classList.remove('auth-hidden');authGate.style.display='none';markAuthReady();try{if(typeof renderAll==='function')renderAll();if(typeof window.renderNotes==='function')window.renderNotes();if(typeof window.renderV2Dashboard==='function')window.renderV2Dashboard();}catch(e){console.warn(e)}}
  function authStatus(msg,err=false){const el=$n('nexaAuthStatus');if(el){el.textContent=msg||'';el.classList.toggle('nexa-auth-status-error',!!err);el.style.color=err?'#e7a59d':'#e2c182'}}
  function clearAuthError(){const form=$n('nexaAuthForm'),card=form?.closest('.nexa-auth-card'),status=$n('nexaAuthStatus'),email=$n('nexaAuthEmail'),password=$n('nexaAuthPassword'),btn=$n('nexaAuthSubmit');card?.classList.remove('nexa-login-error');email?.removeAttribute('aria-invalid');password?.removeAttribute('aria-invalid');if(email)email.classList.remove('nexa-input-error');if(password)password.classList.remove('nexa-input-error');btn?.classList.remove('nexa-auth-submit-error');status?.classList.remove('nexa-auth-status-error')}
  function showAuthError(message='Invalid email or password. Please try again.'){const form=$n('nexaAuthForm'),card=form?.closest('.nexa-auth-card'),email=$n('nexaAuthEmail'),password=$n('nexaAuthPassword'),btn=$n('nexaAuthSubmit');authStatus(message,true);email?.setAttribute('aria-invalid','true');password?.setAttribute('aria-invalid','true');card?.classList.remove('nexa-login-error');email?.classList.remove('nexa-input-error');password?.classList.remove('nexa-input-error');void (email?.offsetWidth);void (password?.offsetWidth);email?.classList.add('nexa-input-error');password?.classList.add('nexa-input-error');card?.classList.add('nexa-login-error');btn?.classList.add('nexa-auth-submit-error');setTimeout(()=>{email?.classList.remove('nexa-input-error');password?.classList.remove('nexa-input-error');btn?.classList.remove('nexa-auth-submit-error')},650)}
  function setMode(mode){
    authMode=mode;
    clearAuthError();
    const card=$n('nexaAuthForm')?.closest('.nexa-auth-card');
    card?.classList.toggle('recovery-request',mode==='recovery-request');
    card?.classList.toggle('recovery-mode',mode==='recovery');
    $n('nexaLoginTab').classList.toggle('active',mode==='login');
    $n('nexaSignupTab').classList.toggle('active',mode==='signup');
    $n('nexaNameWrap').style.display=mode==='signup'?'block':'none';
    $n('nexaForgotRow').style.display=mode==='login'?'flex':'none';
    $n('nexaResetConfirmWrap').style.display=mode==='recovery'?'block':'none';
    $n('nexaResetBackWrap').style.display=(mode==='recovery-request'||mode==='recovery')?'flex':'none';
    const pwd=$n('nexaAuthPassword');
    const confirm=$n('nexaAuthPasswordConfirm');
    const email=$n('nexaAuthEmail');
    if(pwd){
      pwd.autocomplete=(mode==='signup'||mode==='recovery')?'new-password':'current-password';
      pwd.minLength=(mode==='signup'||mode==='recovery')?8:6;
      pwd.placeholder=(mode==='recovery'||mode==='signup')?'At least 8 characters':'••••••••';
      pwd.required=mode!=='recovery-request';
    }
    if(confirm){confirm.value='';confirm.required=mode==='recovery';confirm.autocomplete='new-password';}
    if(email){email.required=mode!=='recovery';email.disabled=false;}
    $n('nexaAuthTitle').textContent=
      mode==='login'?'Welcome back 👋':
      mode==='signup'?'Create your Newla account':
      mode==='recovery-request'?'Reset your password':'Set a new password';
    $n('nexaAuthSubtitle').textContent=
      mode==='login'?'Login to continue to Newla.':
      mode==='signup'?'Create your workspace account.':
      mode==='recovery-request'?'Enter your email and we’ll send a secure reset link.':'Choose a new password for your Newla account.';
    $n('nexaAuthSubmit').textContent=
      mode==='login'?'Enter Newla':
      mode==='signup'?'Create Newla account':
      mode==='recovery-request'?'Send reset link':'Update password';
    $n('nexaPasswordLabel').textContent=mode==='recovery'?'New password':'Password';
    $n('nexaAuthDivider').style.display=(mode==='login'||mode==='signup')?'flex':'none';
    $n('nexaGoogleBtn').style.display=(mode==='login'||mode==='signup')?'flex':'none';
    authStatus('');
  }

  function openPasswordResetRequest(){
    const email=$n('nexaAuthEmail');
    if(email && !email.value.trim()) email.focus();
    setMode('recovery-request');
  }

  function openPasswordRecovery(){
    setMode('recovery');
    $n('nexaAuthPassword')?.focus();
  }
  function priorityNorm(v){const s=String(v||'medium').toLowerCase();return ['urgent','high','medium','low'].includes(s)?s:'medium'}
  function statusNorm(v){return v==='completed'?'completed':v==='in_progress'?'in_progress':'todo'}
  function mapTaskFromDb(t){return {id:t.id,title:t.title,description:t.description||'',priority:priorityNorm(t.priority),dueDate:t.due_date||'',reminderDate:t.reminder_date||'',reminderTime:t.reminder_time||'',category:t.category||'Project',recurring:t.recurring||'none',subtasks:Array.isArray(t.subtasks)?t.subtasks:[],status:statusNorm(t.status),proofDataUrl:null,proofPath:t.proof_path||null,completedAt:t.completed_at||null,remindedAt:null,createdAt:t.created_at||new Date().toISOString(),updatedAt:t.updated_at||t.created_at||new Date().toISOString()}}
  async function syncProofRecord(task, proofPath, blob){
    if(!client||!window.NEXA_USER||!task||!proofPath)return;
    const uid=window.NEXA_USER.id;
    const fileName=`${(task.title||'Newla Proof').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'')||'Newla-Proof'}.jpg`;
    const {data:existing,error:findError}=await client.from('proofs').select('id').eq('user_id',uid).eq('file_path',proofPath).maybeSingle();
    if(findError)throw findError;
    const row={user_id:uid,file_name:fileName,file_path:proofPath,file_url:null,file_type:'image/jpeg',file_size:blob?.size||null};
    if(existing?.id){
      const {error}=await client.from('proofs').update(row).eq('id',existing.id).eq('user_id',uid);
      if(error)throw error;
    }else{
      const {error}=await client.from('proofs').insert(row);
      if(error)throw error;
    }
  }
  window.NEXA_SYNC_PROOF_NOW=async function(task){
    if(!client||!window.NEXA_USER||!task?.proofDataUrl)return;
    const uid=window.NEXA_USER.id;
    let proofPath=task.proofPath||`${uid}/task-proof-${task.id}.jpg`;
    const blob=await (await fetch(task.proofDataUrl)).blob();
    const up=await client.storage.from('nexa-files').upload(proofPath,blob,{upsert:true,contentType:'image/jpeg',cacheControl:'3600'});
    if(up.error)throw up.error;
    await syncProofRecord(task,proofPath,blob);
    task.proofPath=proofPath;
    const signed=await client.storage.from('nexa-files').createSignedUrl(proofPath,3600);
    if(signed.data?.signedUrl)task.proofDataUrl=signed.data.signedUrl;
  };
  window.NEXA_DELETE_PROOF_CLOUD=async function(task){
    if(!client||!window.NEXA_USER||!task)return;
    const uid=window.NEXA_USER.id;
    const paths=[];
    if(task.proofPath)paths.push(task.proofPath);
    if(!paths.length)paths.push(`${uid}/task-proof-${task.id}.jpg`);
    const {error:storageError}=await client.storage.from('nexa-files').remove(paths);
    if(storageError)throw storageError;
    const {error:proofError}=await client.from('proofs').delete().eq('user_id',uid).in('file_path',paths);
    if(proofError)throw proofError;
    // Keep the task record itself, but clear its proof_path.
    const {error:taskError}=await client.from('tasks').update({proof_path:null}).eq('id',task.id).eq('user_id',uid);
    if(taskError)throw taskError;
  };
  async function syncProofsFromTasks(rows){
    if(!client||!window.NEXA_USER)return;
    const uid=window.NEXA_USER.id;
    const currentPaths=new Set();
    for(const t of rows){
      if(!t.proofPath && !(t.proofDataUrl&&String(t.proofDataUrl).startsWith('data:image/')))continue;
      let proofPath=t.proofPath||`${uid}/task-proof-${t.id}.jpg`;
      let blob=null;
      if(t.proofDataUrl&&String(t.proofDataUrl).startsWith('data:image/')){
        try{blob=await (await fetch(t.proofDataUrl)).blob()}catch(e){blob=null}
        if(blob){
          const up=await client.storage.from('nexa-files').upload(proofPath,blob,{upsert:true,contentType:'image/jpeg',cacheControl:'3600'});
          if(up.error)throw up.error;
        }
      }
      currentPaths.add(proofPath);
      await syncProofRecord(t,proofPath,blob);
    }
    const {data:remoteProofs,error:proofReadError}=await client.from('proofs').select('id,file_path').eq('user_id',uid);
    if(proofReadError)throw proofReadError;
    const staleRows=(remoteProofs||[]).filter(p=>p.file_path&&!currentPaths.has(p.file_path));
    if(staleRows.length){
      const staleIds=staleRows.map(p=>p.id);
      const stalePaths=staleRows.map(p=>p.file_path).filter(Boolean);
      const {error:deleteRowsError}=await client.from('proofs').delete().eq('user_id',uid).in('id',staleIds);
      if(deleteRowsError)throw deleteRowsError;
      if(stalePaths.length){
        const {error:deleteFilesError}=await client.storage.from('nexa-files').remove(stalePaths);
        if(deleteFilesError)console.warn('Stale proof file cleanup skipped',deleteFilesError);
      }
    }
    const folder=await client.storage.from('nexa-files').list(uid,{limit:1000});
    if(!folder.error){
      const staleFiles=(folder.data||[]).filter(x=>x.id!==null).map(x=>`${uid}/${x.name}`).filter(path=>path.startsWith(`${uid}/task-proof-`)&&!currentPaths.has(path));
      if(staleFiles.length){
        const {error}=await client.storage.from('nexa-files').remove(staleFiles);
        if(error)console.warn('Stale proof storage cleanup skipped',error);
      }
    }
  }
  async function upsertTasks(tasks){
    if(!client||!window.NEXA_USER)return;
    const uid=window.NEXA_USER.id;
    for(const t of tasks){
      let proofPath=t.proofPath||null;
      if(t.proofDataUrl&&String(t.proofDataUrl).startsWith('data:image/')&&!proofPath){
        try{
          const blob=await (await fetch(t.proofDataUrl)).blob();
          proofPath=`${uid}/task-proof-${t.id}.jpg`;
          const up=await client.storage.from('nexa-files').upload(proofPath,blob,{upsert:true,contentType:'image/jpeg',cacheControl:'3600'});
          if(up.error)throw up.error;
        }catch(e){console.warn('Task proof upload skipped',e)}
      }
      const row={id:t.id,user_id:uid,title:t.title||'Untitled',description:t.description||null,priority:priorityNorm(t.priority),status:statusNorm(t.status),due_date:t.dueDate||null,reminder_date:t.reminderDate||null,reminder_time:t.reminderTime||null,category:t.category||'Project',recurring:t.recurring||'none',subtasks:Array.isArray(t.subtasks)?t.subtasks:[],proof_path:proofPath,completed_at:t.status==='completed'?(t.completedAt||new Date().toISOString()):null};
      const {error}=await client.from('tasks').upsert(row,{onConflict:'id'});
      if(error)throw error;
      if(proofPath){
        t.proofPath=proofPath;
        if(t.proofDataUrl&&t.proofDataUrl.startsWith('data:')){try{const signed=await client.storage.from('nexa-files').createSignedUrl(proofPath,3600);if(signed.data?.signedUrl)t.proofDataUrl=signed.data.signedUrl}catch(e){}}
      }
    }
    const localIds=new Set(tasks.map(t=>t.id));
    const {data:remote,error:readError}=await client.from('tasks').select('id').eq('user_id',uid);
    if(readError)throw readError;
    const stale=(remote||[]).map(r=>r.id).filter(id=>!localIds.has(id));
    if(stale.length){
      const {error}=await client.from('tasks').delete().eq('user_id',uid).in('id',stale);
      if(error)throw error;
    }
    await syncProofsFromTasks(tasks);
    saveJson('naveen_spa_tasks_v3',tasks);
  }
  async function syncNotes(rows){
    if(!client||!window.NEXA_USER)return;
    const uid=window.NEXA_USER.id;
    for(const n of rows){
      const row={id:n.id,user_id:uid,title:n.title||'Untitled',content:n.body||'',category:n.tags||null};
      const {error}=await client.from('notes').upsert(row,{onConflict:'id'});
      if(error)throw error;
    }
    // Keep Supabase in exact lock-step with the local Newla notes list.
    // This makes the Delete button delete the cloud record too.
    const localIds=new Set(rows.map(n=>n.id));
    const {data:remoteRows,error:readError}=await client.from('notes').select('id').eq('user_id',uid);
    if(readError)throw readError;
    const staleIds=(remoteRows||[]).map(r=>r.id).filter(id=>!localIds.has(id));
    if(staleIds.length){
      const {error:deleteError}=await client.from('notes').delete().eq('user_id',uid).in('id',staleIds);
      if(deleteError)throw deleteError;
    }
  }
  window.NEXA_DELETE_NOTE_CLOUD=async function(noteId){
    if(!client||!window.NEXA_USER||!noteId)return;
    const {error}=await client.from('notes').delete().eq('id',noteId).eq('user_id',window.NEXA_USER.id);
    if(error)throw error;
  };
  async function syncBrain(){if(!client||!window.NEXA_USER)return;const payload={user_id:window.NEXA_USER.id,name:'Newla Main Board',canvas_data:{notes:localJson('naveen_spa_notes_v3',[]),connectors:localJson('naveen_spa_connectors_v3',[]),boards:localJson('naveen_brainstorm_boards_v2',[]),currentBoardId:localStorage.getItem('naveen_current_board_v2')||'main'},updated_at:new Date().toISOString()};const {data:existing,error:se}=await client.from('brainstorms').select('id').eq('user_id',window.NEXA_USER.id).limit(1).maybeSingle();if(se)throw se;if(existing?.id){const {error}=await client.from('brainstorms').update(payload).eq('id',existing.id).eq('user_id',window.NEXA_USER.id);if(error)throw error}else{const {error}=await client.from('brainstorms').insert(payload);if(error)throw error}}
  async function syncFocus(){
    if(!client||!window.NEXA_USER)return;
    const uid=window.NEXA_USER.id;
    const sessions=localJson('naveen_focus_sessions_v1',[]);
    const rows=sessions.filter(s=>s && (s.id||s.startedAt)).map(s=>({
      id:s.id||crypto.randomUUID(),
      user_id:uid,
      duration_seconds:Math.max(1,Math.round((s.minutes||25)*60)),
      session_type:'focus',
      started_at:s.startedAt?new Date(s.startedAt).toISOString():new Date().toISOString(),
      completed_at:s.completedAt?new Date(s.completedAt).toISOString():null
    }));
    if(rows.length){
      const {error}=await client.from('focus_sessions').upsert(rows,{onConflict:'id'});
      if(error)throw error;
    }
    const localIds=new Set(rows.map(r=>r.id));
    const {data:remote,error:readError}=await client.from('focus_sessions').select('id').eq('user_id',uid);
    if(readError)throw readError;
    const stale=(remote||[]).map(r=>r.id).filter(id=>!localIds.has(id));
    if(stale.length){
      const {error}=await client.from('focus_sessions').delete().eq('user_id',uid).in('id',stale);
      if(error)throw error;
    }
  }
  async function syncTheme(){
    if(!client||!window.NEXA_USER)return;
    const preferences=localJson('nexa_settings_preferences_v1',{});
    const {error}=await client.from('settings').upsert({user_id:window.NEXA_USER.id,theme:document.body.classList.contains('light')?'light':'dark',preferences,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error)throw error;
  }
  async function hydrate(){if(!client||!window.NEXA_USER)return;const uid=window.NEXA_USER.id;const [t,n,b,f,s]=await Promise.all([client.from('tasks').select('*').eq('user_id',uid).order('created_at',{ascending:false}),client.from('notes').select('*').eq('user_id',uid).order('updated_at',{ascending:false}),client.from('brainstorms').select('*').eq('user_id',uid).order('updated_at',{ascending:false}).limit(1).maybeSingle(),client.from('focus_sessions').select('id,duration_seconds,started_at,completed_at').eq('user_id',uid).eq('session_type','focus').order('started_at',{ascending:true}),client.from('settings').select('theme,preferences').eq('user_id',uid).maybeSingle()]);for(const r of [t,n,b,f,s])if(r.error)throw r.error;
    const hydratedTasks=(t.data||[]).map(mapTaskFromDb);
    for(const task of hydratedTasks){if(task.proofPath){try{const signed=await client.storage.from('nexa-files').createSignedUrl(task.proofPath,3600);if(signed.data?.signedUrl)task.proofDataUrl=signed.data.signedUrl}catch(e){}}}
    saveJson('naveen_spa_tasks_v3',hydratedTasks);
    const notesV2=(n.data||[]).map(x=>({id:x.id,title:x.title||'Untitled',tags:x.category||'',body:x.content||''}));saveJson('naveen_knowledge_notes_v1',notesV2);
    if(b.data?.canvas_data){const c=b.data.canvas_data;saveJson('naveen_spa_notes_v3',Array.isArray(c.notes)?c.notes:[]);saveJson('naveen_spa_connectors_v3',Array.isArray(c.connectors)?c.connectors:[]);saveJson('naveen_brainstorm_boards_v2',Array.isArray(c.boards)?c.boards:[]);if(c.currentBoardId)localStorage.setItem('naveen_current_board_v2',c.currentBoardId)}
    saveJson('naveen_focus_sessions_v1',(f.data||[]).map(x=>({id:x.id,minutes:Math.max(1,Math.round((x.duration_seconds||0)/60)),startedAt:x.started_at,completedAt:x.completed_at})));
    if(s.data?.theme)originalSetItem('naveen_spa_theme_v3',s.data.theme);
    if(s.data?.preferences && typeof s.data.preferences==='object'){
      originalSetItem('nexa_settings_preferences_v1',JSON.stringify(s.data.preferences));
      if(Object.prototype.hasOwnProperty.call(s.data.preferences,'quick_complete_low'))originalSetItem('nexa_quick_complete_low',s.data.preferences.quick_complete_low?'1':'0');
    }
    try{tasks=localJson('naveen_spa_tasks_v3',[]);notes=localJson('naveen_spa_notes_v3',[]);connectors=localJson('naveen_spa_connectors_v3',[]);brainNotes=notes;brainConnectors=connectors;v2NotesCache=localJson('naveen_knowledge_notes_v1',[])}catch(e){}
    const pn=$n('profileName');if(pn)pn.textContent=window.NEXA_DISPLAY_NAME||'Newla User';const hh=$n('heroHello');if(hh)hh.textContent=`Hello ${window.NEXA_DISPLAY_NAME||''} 👋`;if(window.renderAll)renderAll();if(window.renderNotes)renderNotes();if(window.renderV2Dashboard)renderV2Dashboard();
  }
  let v2NotesCache=[];
  function friendlyCloudError(error){
    const msg=String(error?.message||error||'').toLowerCase();
    if(!navigator.onLine || /network|fetch|failed to fetch|offline|timeout|timed out|connection/.test(msg)) return 'You’re offline. Newla saved this locally and will sync when you’re back online.';
    if(/jwt|session|token|auth/.test(msg)) return 'Your session needs attention. Please sign in again to continue cloud sync.';
    if(/storage|upload|bucket|object/.test(msg)) return 'The file could not be uploaded. Your local copy is still safe.';
    if(/permission|rls|not authorized|forbidden/.test(msg)) return 'Newla could not access that cloud resource. Your local copy is still here.';
    return 'Cloud sync is temporarily unavailable. Your local changes are saved on this device and will retry automatically.';
  }
  function showCloudError(error, options={}){
    const message=options.message||friendlyCloudError(error);
    try{ toast(message,'error'); }catch{}
    try{ setSyncIndicator('error',message); }catch{}
  }
  function showNetworkState(){
    if(navigator.onLine){
      if(client&&window.NEXA_USER&&!booting&&syncQueue?.size) scheduleCloudFlush(80);
      return;
    }
    try{ setSyncIndicator('offline'); }catch{}
    try{ toast('You’re offline. Newla will keep your changes locally and sync when you’re back online.','error'); }catch{}
  }

  function setSyncIndicator(state,message){
    const el=$n('notesSyncIndicator');
    if(!el)return;
    const map={
      saving:['loader-circle','Saving…','syncing-dot'],
      saved:['check-circle-2','Synced to your Newla account',''],
      offline:['cloud-off','Saved locally · will sync when available',''],
      error:['triangle-alert','Saved locally · cloud sync needs attention','']
    };
    const item=map[state]||map.saved;
    el.innerHTML=`<span class="sync-dot ${item[2]||''}"><i data-lucide="${item[0]}"></i></span> ${message||item[1]}`;
    try{if(typeof safeIcons==='function')safeIcons()}catch{}
  }
  function queueCloudSync(key){
    if(!CLOUD_KEYS.has(key))return;
    syncQueue.add(key);
    if(!booting) scheduleCloudFlush(80);
  }
  function scheduleCloudFlush(delay=120){
    if(syncTimer)clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>{syncTimer=null;flushCloudQueue()},Math.max(0,delay));
  }
  async function syncOneKey(key){
    if(key==='naveen_spa_tasks_v3')return upsertTasks(localJson(key,[]));
    if(key==='naveen_knowledge_notes_v1')return syncNotes(localJson(key,[]));
    if(key==='naveen_spa_notes_v3'||key==='naveen_spa_connectors_v3'||key==='naveen_brainstorm_boards_v2')return syncBrain();
    if(key==='naveen_focus_sessions_v1')return syncFocus();
    if(key==='naveen_spa_theme_v3'||key==='nexa_settings_preferences_v1')return syncTheme();
  }
  async function flushCloudQueue(){
    if(syncInFlight||booting||!client||!window.NEXA_USER||!syncQueue.size)return;
    syncInFlight=true;
    const batch=[...syncQueue];
    syncQueue.clear();
    setSyncIndicator('saving');
    try{
      for(const key of batch)await syncOneKey(key);
      syncBackoff=0;
      setSyncIndicator('saved');
    }catch(e){
      batch.forEach(k=>syncQueue.add(k));
      syncBackoff=Math.min(syncBackoff+1,5);
      const delay=Math.min(30000,1000*(2**syncBackoff));
      console.warn('Newla cloud sync failed; retry scheduled',e);
      showCloudError(e);
      scheduleCloudFlush(delay);
    }finally{
      syncInFlight=false;
      // A new local write can arrive while the batch is in flight.
      if(syncQueue.size)scheduleCloudFlush(80);
    }
  }
  localStorage.setItem=function(key,val){
    originalSetItem(key,val);
    queueCloudSync(key);
  };
  localStorage.removeItem=function(key){
    originalRemoveItem(key);
    queueCloudSync(key);
  };

  async function applySession(session){
    if(!session?.user){
      window.NEXA_USER=null;window.NEXA_DISPLAY_NAME='there';booting=false;authShow();return;
    }
    window.NEXA_USER=session.user;
    const {data:p,error:profileError}=await client.from('profiles').select('full_name').eq('id',session.user.id).maybeSingle();
    if(profileError) console.warn('Newla profile lookup failed',profileError);
    window.NEXA_DISPLAY_NAME=p?.full_name||session.user.user_metadata?.full_name||session.user.user_metadata?.name||session.user.email?.split('@')[0]||'there';
    // Keep the auth gate hidden while an existing session hydrates. Showing the login
    // form here causes a visible login flash on refresh even though the session is valid.
    try{await hydrate();}
    catch(e){
      console.error('Newla cloud hydrate failed',e);
      const msg=friendlyCloudError(e);
      authStatus(msg,true);
      showCloudError(e,{message:msg});
    }
    booting=false;
    appShow();
  }
  async function init(){
    setMode('login');
    // Boot state: hide both surfaces until Supabase resolves the persisted session.
    // This prevents the login form from flashing during a normal authenticated refresh.
    authGate.style.display='none';
    app?.classList.add('auth-hidden');
    client=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});window.NEXA_BACKEND.client=client;
    const recoveryFromUrl=/(^|[?&#])type=recovery(&|$)/.test(`${location.search}&${location.hash}`);
    const {data,error}=await client.auth.getSession();if(error)throw error;
    let appliedInitialSession=false;
    let recoveryFlow=recoveryFromUrl;
    client.auth.onAuthStateChange((_event,session)=>{
      if(_event==='SIGNED_OUT'){window.NEXA_USER=null;window.NEXA_DISPLAY_NAME='there';booting=false;setMode('login');authShow();authStatus('You’re signed out. Sign in again to continue.');return;}
      if(_event==='PASSWORD_RECOVERY'){
        recoveryFlow=true;
        booting=false;
        openPasswordRecovery();
        authShow();
        return;
      }
      // Avoid re-hydrating all cloud data on every token refresh.
      // INITIAL_SESSION is handled here only when getSession() did not already apply it.
      if(session?.user && _event==='INITIAL_SESSION' && !appliedInitialSession){
        appliedInitialSession=true;
        if(recoveryFlow){booting=false;openPasswordRecovery();authShow();return;}
        queueMicrotask(()=>applySession(session).catch(e=>{console.error(e);booting=false;authShow();}));
      }
      if(session?.user && _event==='SIGNED_IN'){
        queueMicrotask(()=>{
          if(recoveryFlow){booting=false;openPasswordRecovery();authShow();return;}
          applySession(session).catch(e=>{console.error(e);booting=false;authShow();});
        });
      }
    });
    if(data?.session?.user){
      appliedInitialSession=true;
      if(recoveryFlow){booting=false;openPasswordRecovery();authShow();}
      else await applySession(data.session);
    } else {
      booting=false;
      if(recoveryFlow){openPasswordRecovery();authShow();}
      else {setMode('login');authShow();}
    }
  }
  $n('nexaLoginTab').onclick=()=>setMode('login');
  $n('nexaSignupTab').onclick=()=>setMode('signup');
  $n('nexaForgotPassword').onclick=openPasswordResetRequest;
  $n('nexaResetBack').onclick=()=>setMode('login');
  [$n('nexaAuthEmail'),$n('nexaAuthPassword'),$n('nexaAuthPasswordConfirm')].forEach(input=>input?.addEventListener('input',()=>{if(input.value)clearAuthError()}));
  $n('nexaAuthForm').addEventListener('submit',async e=>{
    e.preventDefault();
    clearAuthError();
    const email=$n('nexaAuthEmail').value.trim(),password=$n('nexaAuthPassword').value,passwordConfirm=$n('nexaAuthPasswordConfirm').value,name=$n('nexaAuthName').value.trim(),btn=$n('nexaAuthSubmit');
    btn.disabled=true;
    if(authMode==='recovery-request'){authStatus('Sending reset link…');}
    else if(authMode==='recovery'){authStatus('Updating password…');}
    else btn.textContent=authMode==='login'?'Signing in…':'Creating your account…';
    try{
      if(authMode==='recovery-request'){
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
        if(error)throw error;
        authStatus('If an account exists for this email, we’ve sent a secure reset link.');
        return;
      }
      if(authMode==='recovery'){
        if(password.length<8){authStatus('Use at least 8 characters.',true);return;}
        if(password!==passwordConfirm){authStatus('Passwords do not match.',true);return;}
        const {error}=await client.auth.updateUser({password});
        if(error)throw error;
        authStatus('Password updated. Loading Newla…');
        recoveryFlow=false;
        const {data:sessionData}=await client.auth.getSession();
        if(sessionData?.session) await applySession(sessionData.session);
        else {setMode('login');authStatus('Password updated. Please sign in again.');}
        return;
      }
      if(authMode==='login'){
        const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
        authStatus('Signed in. Loading Newla…');
      }else{
        const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name:name||email.split('@')[0]},emailRedirectTo:location.origin}});
        if(error)throw error;
        if(!data.session)authStatus('Account created. Check your email, confirm it, then return to Newla.');
        else authStatus('Account created. Loading Newla…');
      }
    }catch(err){
      if(authMode==='login')showAuthError('Invalid email or password. Please try again.');
      else if(authMode==='recovery')authStatus(err?.message||'Could not update your password.',true);
      else if(authMode==='recovery-request')authStatus('We could not send the reset email. Please try again.',true);
      else authStatus(err?.message||'Authentication failed.',true);
    }finally{
      btn.disabled=false;
      if(authMode==='login'||authMode==='signup')btn.textContent=authMode==='login'?'Enter Newla':'Create Newla account';
    }
  });
  const googleBtn=$n('nexaGoogleBtn');
  if(googleBtn) googleBtn.addEventListener('click',async()=>{
    if(!client)return;
    googleBtn.disabled=true;authStatus('Connecting to Google…');
    try{
      const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin}});
      if(error)throw error;
    }catch(err){googleBtn.disabled=false;authStatus(err?.message||'Google sign-in failed.',true)}
  });
  window.NEXA_LOGOUT=async()=>{if(client)await client.auth.signOut()};
  window.NEXA_CLEAR_CLOUD=async()=>{if(!client||!window.NEXA_USER)return;const uid=window.NEXA_USER.id;const {data:proofRows}=await client.from('proofs').select('file_path').eq('user_id',uid);const proofPaths=(proofRows||[]).map(r=>r.file_path).filter(Boolean);if(proofPaths.length){const {error}=await client.storage.from('nexa-files').remove(proofPaths);if(error)throw error}for(const table of ['tasks','notes','proofs','focus_sessions','brainstorms']){const {error}=await client.from(table).delete().eq('user_id',uid);if(error)throw error}await client.from('settings').upsert({user_id:uid,theme:'dark',preferences:{},updated_at:new Date().toISOString()},{onConflict:'user_id'})};
  const oldLogout=document.getElementById('logoutButton'); if(oldLogout)oldLogout.addEventListener('click',()=>window.NEXA_LOGOUT());
  const settingsLogout=document.getElementById('settingsLogout'); if(settingsLogout)settingsLogout.addEventListener('click',()=>window.NEXA_LOGOUT()); const logoutNexa=document.getElementById('logoutNexa'); if(logoutNexa)logoutNexa.addEventListener('click',()=>window.NEXA_LOGOUT());
  const clearBtn=document.getElementById('clearAllData'); if(clearBtn){ /* guarded by confirmation modal */ }
  // Patch task/notes/brain/focus rendering identity.
  document.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b){const v=b.dataset.view;setTimeout(()=>{if(v==='dashboard'&&window.updateGreeting)window.updateGreeting();},0)}});
  window.addEventListener('offline',showNetworkState);
  window.addEventListener('online',()=>{
    try{ toast('You’re back online. Newla will retry cloud sync now.'); }catch{}
    if(client&&window.NEXA_USER&&!booting) scheduleCloudFlush(60);
  });
  if(!navigator.onLine) setTimeout(showNetworkState,120);

  const safeInit=()=>init().catch(error=>{
    console.error('Newla auth bootstrap failed',error);
    booting=false;
    window.NEXA_USER=null;
    window.NEXA_DISPLAY_NAME='there';
    authShow();
    authStatus('Could not restore your session. Please sign in again.',true);
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(safeInit,60));else setTimeout(safeInit,60);
})();


/* Source inline script 5 */

(function(){
  const $id = id => document.getElementById(id);
  const safeIcons = () => { try { if(window.lucide) window.lucide.createIcons(); } catch(e) {} };

  /* ============================================================
     Newla CUSTOM DIALOGS — safe alert / confirm / prompt replacement
     ============================================================ */
  (function(){
    const overlay=document.getElementById('nexaDialog');
    const card=document.getElementById('nexaDialogCard');
    const titleEl=document.getElementById('nexaDialogTitle');
    const msgEl=document.getElementById('nexaDialogMessage');
    const kickerEl=document.getElementById('nexaDialogKicker');
    const inputEl=document.getElementById('nexaDialogInput');
    const cancelEl=document.getElementById('nexaDialogCancel');
    const confirmEl=document.getElementById('nexaDialogConfirm');
    const iconEl=document.getElementById('nexaDialogIcon');
    if(!overlay||!card||!titleEl||!msgEl||!kickerEl||!inputEl||!cancelEl||!confirmEl||!iconEl)return;
    let activeMode='confirm',resolver=null,previousFocus=null;
    const finish=result=>{
      overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true');
      document.body.style.removeProperty('overflow');
      const resolve=resolver; resolver=null; if(resolve)resolve(result);
      if(previousFocus?.focus){try{previousFocus.focus({preventScroll:true})}catch(e){previousFocus.focus()}}
    };
    const openDialog=opts=>{
      opts=opts||{}; activeMode=opts.dialogMode||'confirm'; previousFocus=document.activeElement;
      titleEl.textContent=opts.title||'Newla'; msgEl.textContent=opts.message||''; kickerEl.textContent=opts.kicker||'Newla';
      card.classList.toggle('light',!!opts.light); card.classList.toggle('destructive-modal',!!opts.danger);
      inputEl.style.display=activeMode==='prompt'?'block':'none'; inputEl.value=opts.value??''; inputEl.placeholder=opts.placeholder||'';
      inputEl.setAttribute('aria-label',opts.inputLabel||'Value'); cancelEl.style.display=activeMode==='alert'?'none':'inline-flex';
      confirmEl.textContent=opts.confirmText||(activeMode==='prompt'?'Save':'OK'); cancelEl.textContent=opts.cancelText||'Cancel';
      confirmEl.classList.toggle('danger',!!opts.danger || opts.title==='Switch to Warm Light?');
      iconEl.innerHTML=`<i data-lucide="${opts.danger?'triangle-alert':activeMode==='prompt'?'pencil-line':activeMode==='alert'?'info':'message-circle'}"></i>`;
      overlay.classList.add('show'); overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
      try{window.lucide?.createIcons()}catch(e){}
      requestAnimationFrame(()=>{(activeMode==='prompt'?inputEl:confirmEl).focus(); if(activeMode==='prompt')inputEl.select()});
    };
    const run=opts=>new Promise(resolve=>{if(resolver)finish(false);resolver=resolve;openDialog(opts)});
    window.nexaAlert=(message,opts={})=>run({...opts,dialogMode:'alert',message});
    window.nexaConfirm=(message,opts={})=>run({...opts,dialogMode:'confirm',message});
    window.nexaPrompt=(message,value='',opts={})=>run({...opts,dialogMode:'prompt',message,value});
    confirmEl.addEventListener('click',()=>finish(activeMode==='prompt'?inputEl.value:true));
    cancelEl.addEventListener('click',()=>finish(activeMode==='prompt'?null:false));
    overlay.addEventListener('click',e=>{if(e.target===overlay&&activeMode!=='alert')finish(activeMode==='prompt'?null:false)});
    document.addEventListener('keydown',e=>{
      if(!overlay.classList.contains('show'))return;
      if(e.key==='Escape'){e.preventDefault();finish(activeMode==='prompt'?null:false);return}
      if(e.key==='Enter'&&activeMode==='prompt'&&document.activeElement===inputEl){e.preventDefault();finish(inputEl.value)}
    });
  })();
  const setModal = (id, show) => { const el=$id(id); if(!el)return; el.classList.toggle('show',show); el.setAttribute('aria-hidden', show?'false':'true'); };

  function syncEmptyMetric(id, value, hintId, emptyText, filledText){
    const v=$id(id), h=$id(hintId); if(!v)return;
    const n=Number(value)||0; v.textContent=n===0?'—':String(n);
    if(h) h.textContent=n===0?emptyText:filledText.replace('{n}',String(n));
  }

  // Dashboard empty-state polish layered over the existing renderer.
  const originalRenderV2Dashboard = window.renderV2Dashboard;
  if(typeof originalRenderV2Dashboard==='function'){
    window.renderV2Dashboard=function(){
      originalRenderV2Dashboard();
      const today=$id('dashToday'), pending=$id('dashPending'), overdue=$id('dashOverdue'), completed=$id('dashCompleted');
      syncEmptyMetric('dashToday', today?.textContent, 'dashTodayHint', 'No tasks yet — add your first one', '{n} task(s) planned');
      syncEmptyMetric('dashPending', pending?.textContent, 'dashPendingHint', 'Nothing pending — you are clear', '{n} task(s) to finish');
      syncEmptyMetric('dashOverdue', overdue?.textContent, 'dashOverdueHint', 'You are all clear', '{n} item(s) need attention');
      syncEmptyMetric('dashCompleted', completed?.textContent, 'dashCompletedHint', 'Complete your first task', '{n} completed');
      safeIcons();
    };
  }

  // Achievements explanation modal.
  $id('achievementInfoButton')?.addEventListener('click',()=>setModal('achievementInfoModal',true));
  $id('closeAchievementInfo')?.addEventListener('click',()=>setModal('achievementInfoModal',false));

  // Mobile More menu.
  const moreBtn=$id('mobileMoreButton'), moreMenu=$id('mobileMoreMenu');
  function toggleMore(force){ if(!moreMenu)return; const show=typeof force==='boolean'?force:!moreMenu.classList.contains('show'); moreMenu.classList.toggle('show',show); moreMenu.setAttribute('aria-hidden',show?'false':'true'); }
  moreBtn?.addEventListener('click',()=>toggleMore());
  moreMenu?.addEventListener('click',()=>toggleMore(false));
  document.addEventListener('click',e=>{if(moreMenu?.classList.contains('show') && !e.target.closest('#mobileMoreMenu') && !e.target.closest('#mobileMoreButton')) toggleMore(false);});

  // Quick-complete toggle (low-priority tasks only).
  const qc=$id('quickCompleteToggle');
  if(qc){ qc.checked=localStorage.getItem('nexa_quick_complete_low')==='1'; qc.addEventListener('change',()=>{
    localStorage.setItem('nexa_quick_complete_low',qc.checked?'1':'0');
    try{const prefs=JSON.parse(localStorage.getItem('nexa_settings_preferences_v1')||'{}');prefs.quick_complete_low=qc.checked;localStorage.setItem('nexa_settings_preferences_v1',JSON.stringify(prefs));}catch(e){}
    if(window.renderTasks)window.renderTasks();
  }); }

  // Notes sync indicator.
  const saveNote=$id('saveNoteButton'), sync=$id('notesSyncIndicator');
  if(saveNote && sync){
    saveNote.addEventListener('click',()=>{
      try{if(typeof setSyncIndicator==='function')setSyncIndicator('saving')}catch{}
    });
  }

  // Brainstorm tool groups.
  document.querySelectorAll('.brain-group-trigger').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const parent=btn.closest('.brain-tool-group'); document.querySelectorAll('.brain-tool-group.open').forEach(g=>{if(g!==parent)g.classList.remove('open')}); parent?.classList.toggle('open');}));
  document.addEventListener('click',()=>document.querySelectorAll('.brain-tool-group.open').forEach(g=>g.classList.remove('open')));
  document.querySelectorAll('.brain-tool-menu .brain-ref-tool').forEach(b=>b.addEventListener('click',()=>b.closest('.brain-tool-group')?.classList.remove('open')));

  // Clear workspace confirmation + cloud/local wipe through the existing backend bridge.
  $id('clearAllData')?.addEventListener('click',()=>setModal('clearDataModal',true));
  $id('closeClearData')?.addEventListener('click',()=>setModal('clearDataModal',false));
  $id('cancelClearData')?.addEventListener('click',()=>setModal('clearDataModal',false));
  $id('confirmClearData')?.addEventListener('click',async()=>{
    const btn=$id('confirmClearData'); if(!btn)return; btn.disabled=true; btn.textContent='Clearing…';
    try{
      if(window.NEXA_CLEAR_CLOUD) await window.NEXA_CLEAR_CLOUD();
      [
        'naveen_spa_tasks_v3','naveen_knowledge_notes_v1','naveen_spa_notes_v3','naveen_spa_connectors_v3','naveen_brainstorm_boards_v2','naveen_focus_sessions_v1','naveen_productivity_streak_v1','naveen_spa_draw_v3','nexa_settings_preferences_v1'
      ].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
      setModal('clearDataModal',false);
      location.reload();
    }catch(err){
      btn.disabled=false; btn.textContent='Yes, clear workspace';
      if(window.toast) window.toast('Could not clear workspace. Try again.'); else void nexaAlert('Could not clear the workspace. Please try again.',{title:'Could not clear workspace',kicker:'WORKSPACE'});
    }
  });

  // Restore icons after each major render pass.
  const oldRA=window.renderAll;
  if(typeof oldRA==='function') window.renderAll=function(){ const r=oldRA.apply(this,arguments); safeIcons(); return r; };

  // Global close for info modals on backdrop / Escape.
  document.addEventListener('click',e=>{ if(e.target.classList.contains('nexa-info-modal')) e.target.classList.remove('show'); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){document.querySelectorAll('.nexa-info-modal.show').forEach(m=>m.classList.remove('show')); document.querySelectorAll('.brain-tool-group.open').forEach(g=>g.classList.remove('open'));} });

  setTimeout(safeIcons,120);
})();


/* Source inline script 6 */

(function(){
  const gate=document.getElementById('nexaAuthGate');
  if(!gate) return;
  const root=document.documentElement;
  let tx=50,ty=50,cx=50,cy=50,raf=0;
  function move(e){tx=(e.clientX/window.innerWidth)*100;ty=(e.clientY/window.innerHeight)*100;if(!raf)raf=requestAnimationFrame(tick);}
  function tick(){cx+=(tx-cx)*.12;cy+=(ty-cy)*.12;gate.style.setProperty('--mx',cx+'%');gate.style.setProperty('--my',cy+'%');raf=0;}
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('blur',()=>{tx=50;ty=50;if(!raf)raf=requestAnimationFrame(tick);});
})();


/* Source inline script 7 */

(function(){
  const syncProfileVisual=()=>{
    const nameEl=document.getElementById('profileName');
    const avatar=document.querySelector('.profile .avatar');
    if(!nameEl||!avatar)return;
    const name=(nameEl.textContent||'N').trim();
    const initial=(name.replace(/[^A-Za-z0-9]/g,'').charAt(0)||'N').toUpperCase();
    avatar.textContent=initial;
    avatar.setAttribute('aria-label',`Signed in as ${name}`);
  };
  const profileName=document.getElementById('profileName');
  if(profileName){
    syncProfileVisual();
    new MutationObserver(syncProfileVisual).observe(profileName,{childList:true,characterData:true,subtree:true});
  }

  /* Keep nav state accessible without changing the existing navigation logic. */
  const markNav=()=>{
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn=>{
      btn.setAttribute('aria-current',btn.classList.contains('active')?'page':'false');
    });
  };
  markNav();
  new MutationObserver(markNav).observe(document.getElementById('sidebarNav')||document.body,{subtree:true,attributes:true,attributeFilter:['class']});

  /* Close the mobile menu when Escape is pressed. */
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      const menu=document.getElementById('mobileMoreMenu');
      const btn=document.getElementById('mobileMoreButton');
      if(menu?.classList.contains('show')){
        menu.classList.remove('show');
        menu.setAttribute('aria-hidden','true');
        btn?.focus({preventScroll:true});
      }
    }
  });

  /* Small resilience fix for very short viewports: keep profile/quote readable. */
  const fitSidebar=()=>{
    const sidebar=document.querySelector('.sidebar');
    if(!sidebar)return;
    const tight=sidebar.scrollHeight>sidebar.clientHeight;
    sidebar.classList.toggle('sidebar-tight',tight);
    sidebar.style.setProperty('--sidebar-tight',tight?'1':'0');
  };
  fitSidebar();
  window.addEventListener('resize',fitSidebar,{passive:true});
})();


/* Source inline script 8 */

/* ============================================================
   Newla STEP 4 — TASKS DEEP POLISH
============================================================ */
(function(){
  const STEP4_PREF_KEY="nexa_task_view_prefs_v1";
  const state=(()=>{try{return JSON.parse(localStorage.getItem(STEP4_PREF_KEY)||"{}")}catch{return {}}})();
  let step4Filter=state.filter||"all";
  let step4Sort=state.sort||"due";
  let searchTerm=(state.search||"").toLowerCase();
  let categoryFilter=state.category||"all";
  let priorityFilter=state.priority||"all";
  const search=document.getElementById("taskSearch");
  const cat=document.getElementById("taskCategoryFilter");
  const pri=document.getElementById("taskPriorityFilter");

  const writePrefs=()=>{
    try{localStorage.setItem(STEP4_PREF_KEY,JSON.stringify({
      filter:step4Filter,sort:step4Sort,search:searchTerm,category:categoryFilter,priority:priorityFilter
    }))}catch{}
  };
  const esc4=(v)=>typeof escapeHtml==="function"?escapeHtml(v==null?"":String(v)):String(v||"");
  const normSub=(s,i)=>typeof s==="string"?{id:"legacy-"+i,text:s,done:false}:Object.assign({id:"sub-"+i,text:"",done:false},s||{});
  const getSubtasks=(task)=>Array.isArray(task?.subtasks)?task.subtasks.map(normSub):[];
  const isToday=(task)=>task?.status!=="completed" && !!task?.dueDate && task.dueDate===todayKey();
  const sortTime=(task)=>{
    const r=typeof reminderDate==="function"?reminderDate(task):null;
    if(r?.getTime) return r.getTime();
    if(task?.dueDate) return new Date(task.dueDate+"T23:59:59").getTime();
    return Infinity;
  };
  const priorityRank={high:0,medium:1,low:2};

  function persistTaskView(){
    try{localStorage.setItem(STEP4_PREF_KEY,JSON.stringify({
      filter:step4Filter,sort:step4Sort,search:searchTerm,category:categoryFilter,priority:priorityFilter
    }))}catch{}
  }

  function ensureStep4Controls(){
    const toolbar=document.querySelector(".task-toolbar-v2");
    if(!toolbar)return;
    if(!$("taskSortStep4")){
      const select=document.createElement("select");
      select.id="taskSortStep4";
      select.className="step4-sort";
      select.innerHTML='<option value="due">Due soon</option><option value="priority">Priority</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="completed">Recently completed</option>';
      toolbar.appendChild(select);
      select.value=step4Sort;
      select.onchange=()=>{step4Sort=select.value;persistTaskView();window.renderTasks()};
    }
    const oldBar=document.querySelector(".task-filter-bar");
    if(oldBar&&!$("step4FilterPills")){
      const meta=document.createElement("div");
      meta.className="step4-toolbar-meta";
      meta.id="step4FilterPills";
      meta.innerHTML=`
        <button type="button" class="step4-filter-pill" data-step4-filter="all">All</button>
        <button type="button" class="step4-filter-pill" data-step4-filter="today">Today</button>
        <button type="button" class="step4-filter-pill" data-step4-filter="overdue">Overdue</button>
        <button type="button" class="step4-filter-pill" data-step4-filter="with-proof">With proof</button>
        <span class="step4-summary" id="step4Summary"></span>
        <span class="step4-save-state" id="step4SaveState"><span class="step4-save-dot"></span><span>Cloud-ready</span></span>
      `;
      oldBar.appendChild(meta);
      meta.querySelectorAll("[data-step4-filter]").forEach(btn=>{
        btn.addEventListener("click",()=>{
          step4Filter=btn.dataset.step4Filter;
          persistTaskView();
          syncFilterUI();
          window.renderTasks();
        });
      });
    }
    if(search&&!search.dataset.step4Bound){
      search.dataset.step4Bound="1";
      search.value=state.search||"";
    }
    if(cat&& !cat.dataset.step4Bound){
      cat.dataset.step4Bound="1";
      cat.value=categoryFilter;
    }
    if(pri&& !pri.dataset.step4Bound){
      pri.dataset.step4Bound="1";
      pri.value=priorityFilter;
    }
    syncFilterUI();
  }

  function syncFilterUI(){
    document.querySelectorAll("[data-step4-filter]").forEach(btn=>btn.classList.toggle("active",btn.dataset.step4Filter===step4Filter));
    const summary=$("step4Summary");
    if(summary){
      const all=tasks.length;
      const shown=window.filteredTasksStep4?window.filteredTasksStep4().length:all;
      summary.textContent=`Showing ${shown} of ${all}`;
    }
  }

  const originalFiltered=window.filteredTasks;
  window.filteredTasksStep4=function(){
    let list=Array.isArray(tasks)?tasks.slice():[];
    list=list.filter(task=>{
      if(taskFilter==="pending" && task.status==="completed")return false;
      if(taskFilter==="completed" && task.status!=="completed")return false;
      if(step4Filter==="today" && !isToday(task))return false;
      if(step4Filter==="overdue" && !isOverdue(task))return false;
      if(step4Filter==="with-proof" && !task.proofDataUrl) return false;
      const hay=`${task.title||""} ${task.description||""} ${task.category||""} ${(task.subtasks||[]).map(s=>typeof s==="string"?s:s.text||"").join(" ")}`.toLowerCase();
      if(searchTerm && !hay.includes(searchTerm))return false;
      if(categoryFilter!=="all" && (task.category||"Project")!==categoryFilter)return false;
      if(priorityFilter!=="all" && (task.priority||"medium")!==priorityFilter)return false;
      return true;
    });

    list.sort((a,b)=>{
      if(a.status!==b.status)return a.status==="completed"?1:-1;
      if(step4Sort==="priority"){
        const p=(priorityRank[a.priority]??1)-(priorityRank[b.priority]??1);
        if(p)return p;
        return sortTime(a)-sortTime(b);
      }
      if(step4Sort==="newest")return new Date(b.createdAt||0)-new Date(a.createdAt||0);
      if(step4Sort==="oldest")return new Date(a.createdAt||0)-new Date(b.createdAt||0);
      if(step4Sort==="completed")return new Date(b.completedAt||0)-new Date(a.completedAt||0);
      const at=sortTime(a),bt=sortTime(b);
      if(at!==bt)return at-bt;
      return (priorityRank[a.priority]??1)-(priorityRank[b.priority]??1);
    });
    return list;
  };

  function taskStatusText(task,overdue){
    if(task.status==="completed")return "Completed";
    if(overdue)return "Overdue";
    if(isToday(task))return "Due today";
    if(task.dueDate)return "Scheduled";
    return "No deadline";
  }

  function step4TaskCard(task){
    const overdue=typeof isOverdue==="function"&&isOverdue(task);
    const today=isToday(task);
    const subs=getSubtasks(task);
    const doneSubs=subs.filter(s=>s.done).length;
    const subPct=subs.length?Math.round(doneSubs/subs.length*100):0;
    const p=task.priority||"medium";
    const recurring=task.recurring&&task.recurring!=="none";
    const reminder=task.reminderDate?(task.reminderTime?`Reminder ${formatShortDate(task.reminderDate)} ${task.reminderTime}`:`Reminder ${formatShortDate(task.reminderDate)}`):"No reminder";
    const completed=task.status==="completed";
    const proofRequired=p!=="low" || localStorage.getItem("nexa_quick_complete_low")==="0";
    const primaryLabel=completed?"View Proof":(p==="low"&&localStorage.getItem("nexa_quick_complete_low")==="1"?"Complete":"Complete with proof");
    return `<article class="task-card ${completed?"completed ":""}${p} ${today?"today ":""}${overdue?"overdue":""}" data-step4-task-card="${task.id}">
      <div class="step4-card-head">
        <div class="step4-title-wrap">
          <h3 class="task-title step4-task-title" data-step4-open="${task.id}" title="Open task">${esc4(task.title||"Untitled")}</h3>
          ${task.description?`<p class="task-desc">${esc4(task.description)}</p>`:""}
          <div class="step4-status-line">
            <span class="badge"><span class="step4-priority-dot ${esc4(p)}"></span>${esc4(p)}</span>
            <span class="step4-status-text ${overdue?"overdue":today?"today":""}">${taskStatusText(task,overdue)}</span>
          </div>
        </div>
        ${recurring?`<span class="badge">↻ ${esc4(task.recurring)}</span>`:""}
      </div>

      <div class="task-meta">
        <span class="badge task-category">● ${esc4(task.category||"Project")}</span>
        <span class="badge">${task.dueDate?`Due: ${formatShortDate(task.dueDate)}`:"No due date"}</span>
        <span class="badge">${esc4(reminder)}</span>
        ${completed?`<span class="badge done">✓ ${task.completedAt?formatTime(task.completedAt):"Done"}</span>`:""}
        ${overdue&&!completed?`<span class="badge overdue">OVERDUE</span>`:""}
      </div>

      ${subs.length?`
        <div class="subtask-list-v2" style="margin-top:9px">
          <div class="step4-subtask-label" style="justify-content:space-between;padding-left:0;padding-right:0">
            <strong style="font-size:9px;color:#9a8f82">SUBTASKS</strong>
            <span style="font-size:9px;color:#8a8074">${doneSubs}/${subs.length}</span>
          </div>
          ${subs.map((s,i)=>`<label class="step4-subtask-label ${s.done?"done":""}">
            <input type="checkbox" data-step4-subtask="${task.id}" data-sub-index="${i}" ${s.done?"checked":""}>
            <span>${esc4(s.text||"Untitled")}</span>
          </label>`).join("")}
          <div class="step4-progress" aria-label="${doneSubs} of ${subs.length} subtasks complete"><span style="width:${subPct}%"></span></div>
        </div>`:""}

      ${!completed&&proofRequired?`<div class="step4-proof-state"><strong>Proof required</strong> — completion is confirmed by evidence. Low-stakes tasks can use Quick Complete.</div>`:""}
      ${task.proofDataUrl?`
        <div style="display:flex;align-items:center;gap:8px;margin-top:9px;color:#8f877b;font-size:9px">
          <span>Proof saved</span>
          <img class="task-thumb" src="${task.proofDataUrl}" data-proof-view="${task.id}" alt="Proof">
          <span class="proof-extra-v2">${task.completedAt?new Date(task.completedAt).toLocaleDateString():"Saved"}</span>
        </div>`:""}

      <div class="task-actions">
        <button class="task-action ${completed?"":"step4-primary-action"}" data-action="${completed?"view-proof":"proof"}" data-id="${task.id}">${primaryLabel}</button>
        ${!completed?`<button class="task-action" data-action="focus" data-id="${task.id}">Focus</button>`:`<button class="task-action" data-action="focus" data-id="${task.id}">Focus again</button>`}
        <button class="task-action" data-action="calendar" data-id="${task.id}">Set Reminder</button>
        <button class="task-action" data-action="edit" data-id="${task.id}">Edit</button>
        <button class="task-action danger step4-secondary-actions" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
      <div class="task-actions" style="margin-top:6px">
        <button class="task-action step4-complete-action" data-action="${completed?"duplicate":"duplicate"}" data-id="${task.id}">Duplicate</button>
        ${!completed&&p==="low"&&localStorage.getItem("nexa_quick_complete_low")==="1"?`<button class="task-action step4-complete-action" data-action="quick-complete" data-id="${task.id}">Quick complete</button>`:""}
      </div>
    </article>`;
  }

  function bindStep4TaskEvents(root){
    root.querySelectorAll("[data-step4-open]").forEach(el=>{
      el.addEventListener("click",()=>{const t=tasks.find(x=>x.id===el.dataset.step4Open);if(t)openTaskModal(t)});
    });
    root.querySelectorAll("[data-step4-subtask]").forEach(cb=>{
      cb.addEventListener("change",()=>{
        const t=tasks.find(x=>x.id===cb.dataset.step4Subtask); if(!t)return;
        t.subtasks=getSubtasks(t);
        const idx=Number(cb.dataset.subIndex);
        if(t.subtasks[idx]){
          t.subtasks[idx].done=cb.checked;
          save(KEYS.TASKS,tasks);
          window.renderTasks();
          if(window.renderDashboard)window.renderDashboard();
          if(window.renderV2Dashboard)window.renderV2Dashboard();
          showTaskSavedState();
        }
      });
    });
    root.querySelectorAll("[data-action]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        if(typeof taskAction==="function")taskAction(btn.dataset.action,btn.dataset.id);
      });
    });
    root.querySelectorAll("[data-proof-view]").forEach(img=>{
      img.addEventListener("click",()=>{
        const t=tasks.find(x=>x.id===img.dataset.proofView);
        if(t)openProofViewer(t);
      });
    });
  }

  function showTaskSavedState(){
    const el=$("step4SaveState");
    if(!el)return;
    el.innerHTML='<span class="step4-save-dot"></span><span>Saved · syncing</span>';
    clearTimeout(window.__nexaStep4SaveTimer);
    window.__nexaStep4SaveTimer=setTimeout(()=>{
      if(el)el.innerHTML='<span class="step4-save-dot"></span><span>Cloud-ready</span>';
    },900);
  }

  window.renderTasks=function(){
    ensureStep4Controls();
    const el=$("mainTaskList");
    if(el){
      const list=window.filteredTasksStep4();
      el.innerHTML=list.length?list.map(step4TaskCard).join(""):`<div class="step4-empty"><strong>Nothing on your plate.</strong><span>${step4Filter==="all"?"Create a task and make the next move.":"No tasks match these filters."}</span></div>`;
      bindStep4TaskEvents(el);
      const summary=$("step4Summary");if(summary)summary.textContent=`Showing ${list.length} of ${tasks.length}`;
    }
    const today=todayKey();
    if($("taskToday"))$("taskToday").textContent=tasks.filter(t=>t.dueDate===today||t.reminderDate===today).length;
    if($("taskPending"))$("taskPending").textContent=tasks.filter(t=>t.status!=="completed").length;
    if($("taskOverdue"))$("taskOverdue").textContent=tasks.filter(isOverdue).length;
    if($("taskCompleted"))$("taskCompleted").textContent=tasks.filter(t=>t.status==="completed").length;
    syncFilterUI();
  };

  /* Keep the richer legacy/V2 task UI controls in sync with Step 4. */
  function patchInputs(){
    if(search && !search.dataset.step4Search){
      search.dataset.step4Search="1";
      search.addEventListener("input",()=>{
        searchTerm=search.value.trim().toLowerCase();persistTaskView();window.renderTasks();
      });
      search.addEventListener("keydown",e=>{
        if(e.key==="Escape"){search.value="";searchTerm="";persistTaskView();window.renderTasks();search.blur();}
      });
      search.addEventListener("input",()=>{
        const wrap=search.closest(".task-search-wrap");
        if(wrap){
          let clear=wrap.querySelector(".step4-search-clear");
          if(!clear){
            clear=document.createElement("button");clear.type="button";clear.className="step4-search-clear";clear.textContent="×";wrap.appendChild(clear);
            clear.onclick=()=>{search.value="";searchTerm="";persistTaskView();window.renderTasks();search.focus()};
          }
          clear.style.display=search.value?"inline-block":"none";
        }
      });
    }
    if(cat && !cat.dataset.step4Cat){
      cat.dataset.step4Cat="1";
      cat.addEventListener("change",()=>{categoryFilter=cat.value;persistTaskView();window.renderTasks()});
    }
    if(pri && !pri.dataset.step4Pri){
      pri.dataset.step4Pri="1";
      pri.addEventListener("change",()=>{priorityFilter=pri.value;persistTaskView();window.renderTasks()});
    }
    const toggle=$("quickCompleteToggle");
    if(toggle){
      toggle.checked=localStorage.getItem("nexa_quick_complete_low")==="1";
      if(!toggle.dataset.step4Bound){
        toggle.dataset.step4Bound="1";
        toggle.addEventListener("change",()=>{localStorage.setItem("nexa_quick_complete_low",toggle.checked?"1":"0");window.renderTasks();showTaskSavedState()});
      }
    }
  }

  /* Validate reminders and preserve V2 fields before the original submit handler runs. */
  const taskForm=$("taskForm");
  if(taskForm&&!taskForm.dataset.step4Form){
    taskForm.dataset.step4Form="1";
    taskForm.addEventListener("submit",(event)=>{
      const reminderDate=$("taskReminderDate")?.value||"";
      const reminderTime=$("taskReminderTime")?.value||"";
      if((reminderDate&&!reminderTime)||(!reminderDate&&reminderTime)){
        event.preventDefault();
        event.stopImmediatePropagation();
        void nexaAlert("Choose both a reminder date and time, or leave both empty.",{title:"Reminder details",kicker:"TASK"});
        return;
      }
      const id=typeof editingTaskId!=="undefined"?editingTaskId:null;
      setTimeout(()=>{
        const target=id?tasks.find(t=>t.id===id):tasks[0];
        if(!target)return;
        target.category=$("taskCategory")?.value||target.category||"Coding";
        target.recurring=$("taskRecurring")?.value||target.recurring||"none";
        const lines=($("taskSubtasks")?.value||"").split("\n").map(v=>v.trim()).filter(Boolean);
        const prior=getSubtasks(target);
        target.subtasks=lines.map((line,i)=>prior[i]?{...prior[i],text:line}:{id:crypto.randomUUID(),text:line,done:false});
        save(KEYS.TASKS,tasks);
        window.renderTasks();
        window.renderV2Dashboard?.();
        showTaskSavedState();
      },40);
    },true);
  }

  /* Prevent partially entered reminder values from being persisted. */
  const baseOpen=window.openTaskModal;
  if(baseOpen&&!baseOpen.__step4Wrapped){
    const wrapped=function(task=null){
      baseOpen(task);
      setTimeout(()=>{
        if(!task)return;
        $("taskCategory")&&($("taskCategory").value=task.category||"Coding");
        $("taskRecurring")&&($("taskRecurring").value=task.recurring||"none");
        $("taskSubtasks")&&($("taskSubtasks").value=getSubtasks(task).map(s=>s.text).join("\n"));
      },0);
    };
    wrapped.__step4Wrapped=true;
    window.openTaskModal=wrapped;
  }

  function init(){
    ensureStep4Controls();
    patchInputs();
    window.renderTasks();
    window.renderV2Dashboard?.();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();


/* Source inline script 9 */

(function(){
  "use strict";

  const $ = (id)=>document.getElementById(id);
  const esc = (s)=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));

  /* ---------- Brainstorm Step 6 ---------- */
  let brainSaveTimer=null;
  let brainStatusEl=null;
  let boardNameEl=null;

  function setBrainStatus(state="saved",label){
    if(!brainStatusEl)return;
    brainStatusEl.className="brain-step6-status "+state;
    brainStatusEl.innerHTML='<span class="dot"></span><span>'+esc(label||({saved:"Saved",saving:"Saving…",error:"Save failed"}[state]||"Saved"))+'</span>';
  }

  function ensureBrainChrome(){
    const actions=document.querySelector("#view-brainstorm .brain-ref-top-actions");
    if(!actions)return;
    if(!boardNameEl){
      boardNameEl=document.createElement("span");
      boardNameEl.className="brain-step6-status";
      boardNameEl.style.marginLeft="auto";
      boardNameEl.innerHTML='<span class="dot"></span><span>Idea space</span>';
      actions.insertBefore(boardNameEl, actions.firstChild);
    }
    if(!brainStatusEl){
      brainStatusEl=document.createElement("span");
      brainStatusEl.className="brain-step6-status";
      brainStatusEl.innerHTML='<span class="dot"></span><span>Saved</span>';
      actions.insertBefore(brainStatusEl, actions.firstChild);
    }
    const boardName=(typeof currentBoardId!=="undefined"&&typeof v2Boards!=="undefined")
      ? (v2Boards.find(b=>b.id===currentBoardId)?.name||"Main Board") : "Idea space";
    boardNameEl.innerHTML='<span class="dot"></span><span>'+esc(boardName)+'</span>';
  }

  function safeBrainSnapshotSave(){
    try{
      if(typeof saveCurrentBoardSnapshot==="function") saveCurrentBoardSnapshot();
      if(typeof renderBoardPicker==="function") renderBoardPicker();
      ensureBrainChrome();
      setBrainStatus("saved","Saved");
    }catch(e){
      console.warn("Step6 board snapshot failed",e);
      ensureBrainChrome();
      setBrainStatus("error","Saved locally");
    }
  }

  if(typeof window.saveBrainScene==="function"){
    const origSaveBrainScene=window.saveBrainScene;
    window.saveBrainScene=function(silent=true){
      ensureBrainChrome();
      setBrainStatus("saving","Saving…");
      const result=origSaveBrainScene.apply(this,arguments);
      clearTimeout(brainSaveTimer);
      brainSaveTimer=setTimeout(safeBrainSnapshotSave,180);
      return result;
    };
  }

  function updateBoardIdentity(){
    ensureBrainChrome();
    if(typeof currentBoardId!=="undefined"&&typeof v2Boards!=="undefined"){
      const board=v2Boards.find(b=>b.id===currentBoardId);
      if(boardNameEl&&board)boardNameEl.innerHTML='<span class="dot"></span><span>'+esc(board.name)+'</span>';
    }
  }

  /* Keyboard productivity: delete, duplicate, nudge, escape connector/pan. */
  document.addEventListener("keydown",function(e){
    if(typeof activeView==="undefined"||activeView!=="brainstorm")return;
    const tag=(e.target?.tagName||"").toLowerCase();
    if(tag==="input"||tag==="textarea"||tag==="select")return;

    if(e.key==="Escape"){
      if(typeof setPanMode==="function")setPanMode(false);
      if(typeof connectFrom!=="undefined")connectFrom=null;
      if(typeof selectTool==="function"&&typeof activeTool!=="undefined"&&activeTool!=="select")selectTool("select");
      return;
    }

    if((e.key==="Delete"||e.key==="Backspace")&&typeof selectedId!=="undefined"&&selectedId){
      const n=typeof brainNotes!=="undefined"?brainNotes.find(x=>x.id===selectedId):null;
      if(n){
        e.preventDefault();
        brainNotes=brainNotes.filter(x=>x.id!==selectedId);
        brainConnectors=brainConnectors.filter(c=>c.a!==selectedId&&c.b!==selectedId);
        selectedId=null;
        pushHistory();saveBrainScene();render();toast("Sticky deleted.");
      }
      return;
    }

    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="d"&&typeof selectedId!=="undefined"&&selectedId){
      const n=brainNotes.find(x=>x.id===selectedId);
      if(n){
        e.preventDefault();
        const copy={...n,id:crypto.randomUUID(),x:n.x+28,y:n.y+28};
        brainNotes.push(copy);selectedId=copy.id;pushHistory();saveBrainScene();render();toast("Sticky duplicated.");
      }
      return;
    }

    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)&&selectedId&&!e.ctrlKey&&!e.metaKey){
      const n=brainNotes.find(x=>x.id===selectedId);
      if(n){
        e.preventDefault();
        const step=e.shiftKey?10:3;
        if(e.key==="ArrowUp")n.y-=step;
        if(e.key==="ArrowDown")n.y+=step;
        if(e.key==="ArrowLeft")n.x-=step;
        if(e.key==="ArrowRight")n.x+=step;
        render();saveBrainScene();
      }
    }
  });

  /* ---------- Knowledge Step 6 ---------- */
  let knowledgeSearch="";
  let noteSaveTimer=null;
  let knowledgeSaveEl=null;
  let knowledgeCountEl=null;
  let knowledgeWordsEl=null;

  function ensureKnowledgeChrome(){
    const listPanel=document.querySelector("#view-notes .notes-list-v2 .panel-head");
    if(!listPanel)return;
    const headDiv=listPanel.querySelector(":scope > div:first-child");
    const newBtn=$("newNoteButton");
    if(headDiv && !$("knowledgeStep6Tools")){
      const tools=document.createElement("div");
      tools.className="knowledge-step6-tools";
      tools.id="knowledgeStep6Tools";
      tools.innerHTML=`<input id="knowledgeStep6Search" class="knowledge-step6-search" type="search" placeholder="Search notes, tags, text…" autocomplete="off"><span class="knowledge-step6-count" id="knowledgeStep6Count"></span>`;
      headDiv.appendChild(tools);
      const search=$("knowledgeStep6Search");
      if(search){
        search.value=knowledgeSearch;
        search.addEventListener("input",()=>{knowledgeSearch=search.value.trim().toLowerCase(); renderKnowledgeFiltered();});
      }
    }
    const editorHead=document.querySelector("#view-notes .note-editor-v2 .panel-head");
    if(editorHead&&!$("knowledgeStep6Save")){
      const meta=document.createElement("div");
      meta.className="knowledge-step6-meta";
      meta.innerHTML='<span class="knowledge-step6-words" id="knowledgeStep6Words">0 words</span><span class="knowledge-step6-save" id="knowledgeStep6Save">Saved</span>';
      editorHead.appendChild(meta);
    }
    knowledgeSaveEl=$("knowledgeStep6Save");
    knowledgeWordsEl=$("knowledgeStep6Words");
    knowledgeCountEl=$("knowledgeStep6Count");
  }

  function getNotes(){return typeof v2Notes!=="undefined"?v2Notes:[];}
  function noteMatches(n){
    if(!knowledgeSearch)return true;
    const hay=[n.title,n.tags,n.body].map(x=>String(x||"").toLowerCase()).join(" ");
    return hay.includes(knowledgeSearch);
  }
  function updateKnowledgeMeta(){
    ensureKnowledgeChrome();
    const notes=getNotes();
    const active=notes.find(n=>n.id===activeV2Note);
    if(knowledgeWordsEl){
      const words=String(active?.body||"").trim().split(/\s+/).filter(Boolean).length;
      knowledgeWordsEl.textContent=`${words} word${words===1?"":"s"}`;
    }
    if(knowledgeCountEl){
      const visible=notes.filter(noteMatches).length;
      knowledgeCountEl.textContent=`${visible}/${notes.length}`;
    }
  }

  function renderKnowledgeFiltered(){
    ensureKnowledgeChrome();
    const list=$("notesListV2");
    if(!list)return;
    const items=list.querySelectorAll("[data-note-v2]");
    let shown=0;
    items.forEach(el=>{
      const id=el.dataset.noteV2;
      const n=getNotes().find(x=>x.id===id);
      const ok=!!n&&noteMatches(n);
      el.style.display=ok?"":"none";
      if(ok)shown++;
    });
    let empty=list.querySelector(".knowledge-step6-empty");
    if(!shown && knowledgeSearch){
      if(!empty){empty=document.createElement("div");empty.className="knowledge-step6-empty";list.appendChild(empty);}
      empty.innerHTML=`No notes match <strong>${esc(knowledgeSearch)}</strong>.<br>Try another word, tag, or phrase.`;
    }else if(empty){empty.remove();}
    updateKnowledgeMeta();
  }

  function syncKnowledgeEditorState(state,label){
    ensureKnowledgeChrome();
    if(!knowledgeSaveEl)return;
    knowledgeSaveEl.className="knowledge-step6-save "+(state||"");
    knowledgeSaveEl.textContent=label||({saved:"Saved",saving:"Saving…",error:"Save failed"}[state]||"Saved");
  }

  function silentPersistActiveNote(){
    if(typeof activeV2Note==="undefined")return;
    const n=getNotes().find(x=>x.id===activeV2Note); if(!n)return;
    n.title=$("noteTitleV2")?.value.trim()||"Untitled";
    n.tags=$("noteTagsV2")?.value.trim()||"";
    n.body=$("noteBodyV2")?.value||"";
    n.updatedAt=new Date().toISOString();
    try{
      const writeFn=(typeof write==="function")?write:null;
      if(writeFn)write(V2.NOTES,getNotes()); else localStorage.setItem(V2.NOTES,JSON.stringify(getNotes()));
      syncKnowledgeEditorState("saved","Saved");
      renderKnowledgeFiltered();
    }catch(e){
      console.warn(e);syncKnowledgeEditorState("error","Saved locally");
    }
  }

  function scheduleKnowledgeAutosave(){
    syncKnowledgeEditorState("saving","Saving…");
    clearTimeout(noteSaveTimer);
    noteSaveTimer=setTimeout(silentPersistActiveNote,700);
    updateKnowledgeMeta();
  }

  function patchNoteListLabels(){
    const list=$("notesListV2");if(!list)return;
    list.querySelectorAll("[data-note-v2]").forEach(el=>{
      const n=getNotes().find(x=>x.id===el.dataset.noteV2);if(!n)return;
      let tag=el.querySelector(".note-tag-v6");
      if(!tag){tag=document.createElement("span");tag.className="note-tag-v6";el.appendChild(tag)}
      tag.textContent=n.tags?`# ${n.tags}`:"";
    });
  }

  if(typeof window.renderNotes==="function"){
    const origRenderNotes=window.renderNotes;
    window.renderNotes=function(){
      const result=origRenderNotes.apply(this,arguments);
      ensureKnowledgeChrome();
      patchNoteListLabels();
      renderKnowledgeFiltered();
      updateKnowledgeMeta();
      return result;
    };
  }

  function wireKnowledgeInputs(){
    ensureKnowledgeChrome();
    ["noteTitleV2","noteTagsV2","noteBodyV2"].forEach(id=>{
      const el=$(id);if(!el||el.dataset.step6Bound)return;
      el.dataset.step6Bound="1";
      el.addEventListener("input",scheduleKnowledgeAutosave);
    });
    const saveBtn=$("saveNoteButton");
    if(saveBtn&&!saveBtn.dataset.step6Bound){
      saveBtn.dataset.step6Bound="1";
      saveBtn.addEventListener("click",()=>{clearTimeout(noteSaveTimer);silentPersistActiveNote();});
    }
    const newBtn=$("newNoteButton");
    if(newBtn&&!newBtn.dataset.step6Bound){
      newBtn.dataset.step6Bound="1";
      newBtn.addEventListener("click",()=>setTimeout(()=>{ensureKnowledgeChrome();wireKnowledgeInputs();syncKnowledgeEditorState("saved","Saved");},60));
    }
    const deleteBtn=$("deleteNoteButton");
    if(deleteBtn&&!deleteBtn.dataset.step6Bound){
      deleteBtn.dataset.step6Bound="1";
      deleteBtn.addEventListener("click",()=>setTimeout(()=>{updateKnowledgeMeta();},80));
    }
    patchNoteListLabels();updateKnowledgeMeta();
  }

  document.addEventListener("keydown",function(e){
    if(typeof activeView==="undefined"||activeView!=="notes")return;
    const tag=(e.target?.tagName||"").toLowerCase();
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){
      e.preventDefault();clearTimeout(noteSaveTimer);silentPersistActiveNote();toast("Note saved.");return;
    }
    if(tag==="input"||tag==="textarea"||tag==="select")return;
    if(e.key==="/"){
      e.preventDefault();ensureKnowledgeChrome();$("knowledgeStep6Search")?.focus();
    }
  });

  /* Initialize once the existing Step 5 DOM is ready. */
  setTimeout(()=>{
    ensureBrainChrome();
    ensureKnowledgeChrome();
    wireKnowledgeInputs();
    patchNoteListLabels();
    renderKnowledgeFiltered();
    updateBoardIdentity();
  },120);

  /* Re-assert chrome whenever the user navigates back to these views. */
  document.addEventListener("click",function(e){
    const viewBtn=e.target.closest("[data-view]");
    if(viewBtn){
      setTimeout(()=>{
        if(viewBtn.dataset.view==="notes"){ensureKnowledgeChrome();wireKnowledgeInputs();renderKnowledgeFiltered();}
        if(viewBtn.dataset.view==="brainstorm"){ensureBrainChrome();updateBoardIdentity();}
      },120);
    }
  });
})();


/* Source inline script 10 */

(function(){
  function wire(){
    const b=document.getElementById("sidebarLogoutBtn");
    if(!b || b.dataset.wired) return;
    b.dataset.wired="1";
    b.addEventListener("click",()=>window.NEXA_LOGOUT?.());
    try{ if(window.lucide?.createIcons) window.lucide.createIcons(); }catch{}
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(wire,80));
  else setTimeout(wire,80);
})();


/* Source inline script 11 */

(function(){
  const run=()=>{try{window.lucide?.createIcons?.();}catch{}};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(run,100));
  else setTimeout(run,100);
})();


/* Source inline script 12 */

/* ============================================================
   STEP 8 — FOCUS MODE / PRODUCTIVITY ENGINE
   Keeps existing UI/features intact and upgrades focus to:
   task-linked sessions, selectable duration, persistence,
   manual completion, history, and dashboard sync.
============================================================ */
(function(){
  const FOCUS_KEY="naveen_focus_sessions_v1";
  const STATE_KEY="naveen_focus_runtime_v2";
  const readFocus=()=>{try{return JSON.parse(localStorage.getItem(FOCUS_KEY)||"[]")}catch{return[]}};
  const writeFocus=(v)=>localStorage.setItem(FOCUS_KEY,JSON.stringify(v));
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STATE_KEY)||"null")}catch{return null}};
  const writeState=(v)=>localStorage.setItem(STATE_KEY,JSON.stringify(v));
  const clearState=()=>localStorage.removeItem(STATE_KEY);

  let runtimeTask=null;
  let runtimeDuration=25*60;
  let runtimeRemaining=25*60;
  let runtimeStartedAt=null;
  let runtimeRunning=false;
  let runtimeEndsAt=null;
  let runtimeInterval=null;

  function fmt(sec){
    sec=Math.max(0,Math.round(sec));
    return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
  }
  function todayKeyLocal(d=new Date()){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function sessionMinutes(s){
    return Math.max(0,Math.round((s.durationSeconds||0)/60) || Number(s.minutes||0) || 0);
  }
  function totalFocusMinutes(){
    return readFocus().reduce((a,s)=>a+sessionMinutes(s),0);
  }
  function setStatus(msg){ if($("focusStatus"))$("focusStatus").textContent=msg; }
  function setDurationUI(minutes){
    minutes=Math.max(5,Math.min(180,Math.round(Number(minutes)||25)));
    runtimeDuration=minutes*60;
    if(!runtimeRunning){runtimeRemaining=runtimeDuration;}
    document.querySelectorAll(".focus-duration-btn").forEach(b=>b.classList.toggle("active",Number(b.dataset.focusMinutes)===minutes));
    if($("focusCustomMinutes"))$("focusCustomMinutes").value=minutes;
    updateTimerUI();
  }
  function updateTimerUI(){
    if($("focusTimer"))$("focusTimer").textContent=fmt(runtimeRemaining);
    if($("focusStart"))$("focusStart").textContent=runtimeRunning?"Pause":"Start";
    if($("focusComplete"))$("focusComplete").disabled=!runtimeRunning && runtimeRemaining===runtimeDuration;
    if($("focusDurationRow"))$("focusDurationRow").style.opacity=runtimeRunning?"0.55":"1";
    if(runtimeRunning) setStatus("Focus in progress.");
  }
  function stopInterval(){
    if(runtimeInterval){clearInterval(runtimeInterval);runtimeInterval=null;}
  }
  function saveRuntime(){
    if(!runtimeStartedAt||!runtimeTask||!runtimeDuration)return;
    writeState({
      taskId:runtimeTask.id||null,
      taskTitle:runtimeTask.title||"Focus Session",
      taskDescription:runtimeTask.description||"",
      durationSeconds:runtimeDuration,
      remainingSeconds:runtimeRemaining,
      startedAt:runtimeStartedAt,
      endsAt:runtimeEndsAt,
      running:runtimeRunning,
      savedAt:new Date().toISOString()
    });
  }
  function restoreRuntime(){
    const s=readState();
    if(!s||!s.durationSeconds)return false;
    runtimeTask=tasks.find(t=>t.id===s.taskId)||{id:s.taskId,title:s.taskTitle,description:s.taskDescription};
    runtimeDuration=s.durationSeconds;
    runtimeStartedAt=s.startedAt||null;
    runtimeEndsAt=s.endsAt||null;
    runtimeRunning=!!s.running;
    if(runtimeRunning && runtimeEndsAt){
      runtimeRemaining=Math.max(0,Math.ceil((new Date(runtimeEndsAt).getTime()-Date.now())/1000));
      if(runtimeRemaining<=0){finishSession("completed");return false;}
    }else{
      runtimeRemaining=Math.max(0,Number(s.remainingSeconds)||runtimeDuration);
    }
    return true;
  }
  function appendSession(kind){
    if(!runtimeStartedAt)return null;
    const elapsed=Math.max(0,runtimeDuration-runtimeRemaining);
    const effective=kind==="completed"?runtimeDuration:elapsed;
    if(effective<60)return null;
    const session={
      id:crypto.randomUUID(),
      taskId:runtimeTask?.id||null,
      taskTitle:runtimeTask?.title||"Focus Session",
      durationSeconds:Math.round(effective),
      minutes:Math.max(1,Math.round(effective/60)),
      sessionType:"focus",
      startedAt:new Date(runtimeStartedAt).toISOString(),
      completedAt:kind==="completed"?new Date().toISOString():null,
      status:kind
    };
    const sessions=readFocus();
    sessions.push(session);
    writeFocus(sessions);
    try{ if(typeof syncFocus==="function") setTimeout(()=>syncFocus(),0); }catch{}
    return session;
  }
  function resetRuntime(){
    stopInterval();
    runtimeRunning=false;
    runtimeStartedAt=null;
    runtimeEndsAt=null;
    runtimeRemaining=runtimeDuration;
    clearState();
    setStatus("Ready to focus.");
    updateTimerUI();
  }
  function finishSession(kind="completed"){
    stopInterval();
    if(kind==="completed" && runtimeRemaining>0) runtimeRemaining=0;
    appendSession(kind);
    runtimeRunning=false;
    if(kind==="completed"){
      setStatus("Session complete. Nice work.");
      toast("Focus session complete. Nice work.");
    }else{
      setStatus("Session saved.");
      if(runtimeRemaining<runtimeDuration)toast("Focus progress saved.");
    }
    runtimeStartedAt=null;
    runtimeEndsAt=null;
    clearState();
    updateTimerUI();
    renderHistory();
    try{ if(typeof renderV2Dashboard==="function")renderV2Dashboard(); }catch{}
  }
  function tick(){
    if(!runtimeRunning)return;
    if(runtimeEndsAt){
      runtimeRemaining=Math.max(0,Math.ceil((new Date(runtimeEndsAt).getTime()-Date.now())/1000));
    }else if(runtimeRemaining>0){
      runtimeRemaining--;
    }
    updateTimerUI();
    saveRuntime();
    if(runtimeRemaining<=0)finishSession("completed");
  }
  function startRuntime(){
    if(runtimeRunning)return;
    if(!runtimeTask){runtimeTask=tasks.find(t=>t.status!=="completed")||null;}
    if(!runtimeTask){
      toast("No pending task to focus on.","error"); return;
    }
    if(runtimeRemaining<=0)runtimeRemaining=runtimeDuration;
    runtimeRunning=true;
    runtimeStartedAt=runtimeStartedAt||new Date().toISOString();
    runtimeEndsAt=new Date(Date.now()+runtimeRemaining*1000).toISOString();
    saveRuntime();
    stopInterval();
    runtimeInterval=setInterval(tick,1000);
    setStatus("Focus in progress.");
    updateTimerUI();
  }
  function pauseRuntime(){
    if(!runtimeRunning)return;
    tick();
    runtimeRunning=false;
    runtimeEndsAt=null;
    stopInterval();
    saveRuntime();
    setStatus("Paused.");
    updateTimerUI();
  }
  function openV8Focus(task){
    runtimeTask=task||tasks.find(t=>t.status!=="completed")||null;
    if(!runtimeTask){toast("No pending task to focus on.","error");return;}
    const restored=restoreRuntime() && (!task || runtimeTask?.id===task?.id);
    if(!restored){
      runtimeTask=task||runtimeTask;
      runtimeDuration=25*60;
      runtimeRemaining=runtimeDuration;
      runtimeStartedAt=null;
      runtimeRunning=false;
      clearState();
    }
    if($("focusTitle"))$("focusTitle").textContent=runtimeTask.title||"Focus Session";
    if($("focusDescription"))$("focusDescription").textContent=runtimeTask.description||"Stay with the next useful thing.";
    if($("focusTaskBadge")){$("focusTaskBadge").style.display=runtimeTask.id?"inline-flex":"none";$("focusTaskBadge").textContent=runtimeTask.id?"TASK":"FOCUS";}
    if($("focusCurrentTask"))$("focusCurrentTask").textContent=runtimeTask.id?"Linked to task":"";
    if(!runtimeRunning)setDurationUI(Math.round(runtimeDuration/60));
    $("focusModal").style.display="flex";
    renderHistory();
    updateTimerUI();
  }

  function renderHistory(){
    const list=$("focusHistoryList"); if(!list)return;
    const sessions=readFocus().slice().sort((a,b)=>new Date(b.completedAt||b.startedAt||0)-new Date(a.completedAt||a.startedAt||0));
    const todayTotal=sessions.filter(s=>todayKeyLocal(new Date(s.completedAt||s.startedAt||0))===todayKeyLocal()).reduce((a,s)=>a+sessionMinutes(s),0);
    if($("focusHistoryTotal"))$("focusHistoryTotal").textContent=`${todayTotal}m today`;
    list.innerHTML=sessions.length?sessions.slice(0,5).map(s=>{
      const mins=sessionMinutes(s);
      const date=new Date(s.completedAt||s.startedAt);
      return `<div class="focus-history-item">
        <div><strong>${escapeHtml(s.taskTitle||"Focus Session")}</strong><span> · ${date.toLocaleString()}</span></div>
        <span>${mins}m${s.status==="completed"?"":" saved"}</span>
      </div>`;
    }).join(""):`<div class="focus-history-empty">No focus sessions yet. Start with the next useful thing.</div>`;
  }

  window.openFocusModal=openV8Focus;
  window.startFocus=function(){startRuntime();};
  window.pauseFocus=function(){pauseRuntime();};
  window.resetFocus=function(){
    if(runtimeRunning)pauseRuntime();
    runtimeStartedAt=null; runtimeEndsAt=null; runtimeRemaining=runtimeDuration; clearState(); setStatus("Ready to focus."); updateTimerUI();
  };
  window.startFocusFromTask=function(){
    const task=tasks.find(t=>t.status!=="completed");
    if(task)openV8Focus(task); else toast("No pending task to focus on.","error");
  };
  window.startFocusFromTaskId=function(id){
    const task=tasks.find(t=>t.id===id);
    if(task)openV8Focus(task);
  };

  document.querySelectorAll(".focus-duration-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      if(runtimeRunning)return;
      setDurationUI(Number(btn.dataset.focusMinutes));
    });
  });
  $("focusCustomMinutes")?.addEventListener("change",()=>{
    if(runtimeRunning)return;
    setDurationUI(Number($("focusCustomMinutes").value||25));
  });
  $("focusCustomMinutes")?.addEventListener("keydown",e=>{
    if(e.key==="Enter"){e.preventDefault();e.target.blur();}
  });
  if($("focusStart"))$("focusStart").onclick=()=>runtimeRunning?pauseRuntime():startRuntime();
  if($("focusComplete"))$("focusComplete").onclick=()=>{if(runtimeRunning)finishSession("completed");};
  if($("focusReset"))$("focusReset").onclick=()=>resetFocus();
  if($("focusClose"))$("focusClose").onclick=()=>{if(runtimeRunning)pauseRuntime();$("focusModal").style.display="none";};

  /* Restore a running session after refresh. */
  const restored=restoreRuntime();
  if(restored){
    setTimeout(()=>{
      if(runtimeTask&&$("focusTitle"))openV8Focus(runtimeTask);
      if(runtimeRunning){stopInterval();runtimeInterval=setInterval(tick,1000);tick();}
    },80);
  }else{
    updateTimerUI();
    renderHistory();
  }

  /* Dashboard uses the richer session format. */
  const oldRenderV2=window.renderV2Dashboard;
  window.renderV2Dashboard=function(){
    try{ if(typeof oldRenderV2==="function")oldRenderV2(); }catch{}

    // Keep dashboard numbers and their supporting copy in sync.
    // The old UI had static empty-state text, which could remain visible
    // even when the metric itself showed a non-zero count.
    const today=todayKey();
    const metrics=[
      {
        valueId:"dashToday",
        hintId:"dashTodayHint",
        count:tasks.filter(t=>t.dueDate===today||t.reminderDate===today).length,
        empty:"No tasks yet — add your first one",
        filled:n=>`${n} task${n===1?"":"s"} planned`
      },
      {
        valueId:"dashPending",
        hintId:"dashPendingHint",
        count:tasks.filter(t=>t.status!=="completed").length,
        empty:"Nothing pending — you are clear",
        filled:n=>`${n} task${n===1?"":"s"} to finish`
      },
      {
        valueId:"dashOverdue",
        hintId:"dashOverdueHint",
        count:tasks.filter(isOverdue).length,
        empty:"You are all clear",
        filled:n=>`${n} item${n===1?"":"s"} ${n===1?"needs":"need"} attention`
      },
      {
        valueId:"dashCompleted",
        hintId:"dashCompletedHint",
        count:tasks.filter(t=>t.status==="completed").length,
        empty:"Complete your first task",
        filled:n=>`${n} completed`
      }
    ];

    metrics.forEach(({valueId,hintId,count,empty,filled})=>{
      const valueEl=$(valueId);
      const hintEl=$(hintId);
      if(valueEl) valueEl.textContent=count===0?"—":String(count);
      if(hintEl) hintEl.textContent=count===0?empty:filled(count);
    });

    const sessions=readFocus();
    const focusToday=todayKeyLocal();
    const mins=sessions.filter(s=>todayKeyLocal(new Date(s.completedAt||s.startedAt||0))===focusToday).reduce((a,s)=>a+sessionMinutes(s),0);
    if($("dashFocusTime"))$("dashFocusTime").textContent=mins>=60?`${Math.floor(mins/60)}h ${mins%60}m`:`${mins}m`;
  };

  renderHistory();
})();


/* Source inline script 13 */

(function(){
  const $ = (id)=>document.getElementById(id);
  function makeAction(label, id){
    const b=document.createElement('button');
    b.type='button'; b.className='newla-empty-action'; b.textContent=label;
    if(id) b.id=id;
    return b;
  }

  // Tasks: preserve existing renderer, add an actionable CTA without changing the renderer logic.
  const taskList=$('mainTaskList');
  if(taskList){
    const observer=new MutationObserver(()=>{
      const empty=taskList.querySelector('.task-empty');
      if(empty && !empty.querySelector('.newla-empty-action')){
        const b=makeAction('+ Add task','emptyAddTask');
        empty.appendChild(b);
        b.addEventListener('click',()=>{
          const trigger=$('newTaskButton') || document.querySelector('[data-new-task]');
          if(trigger) trigger.click();
          else document.dispatchEvent(new KeyboardEvent('keydown',{key:'n',code:'KeyN'}));
        });
      }
    });
    observer.observe(taskList,{childList:true,subtree:true});
  }

  // Knowledge / Notes: add a calmer first-note state and keep the existing + New action.
  const notesList=$('notesListV2');
  if(notesList){
    const observer=new MutationObserver(()=>{
      const empty=notesList.querySelector('.notes-empty-v2');
      if(empty){
        empty.classList.add('newla-empty');
        if(!empty.querySelector('.newla-empty-icon')){
          const icon=document.createElement('div'); icon.className='newla-empty-icon'; icon.textContent='✎';
          const strong=document.createElement('strong'); strong.textContent='Create your first note';
          const span=document.createElement('span'); span.textContent='Save ideas, study notes, snippets, and anything worth keeping.';
          const b=makeAction('+ New note','emptyNewNote');
          empty.textContent=''; empty.append(icon,strong,span,b);
          b.addEventListener('click',()=>{ const x=$('newNoteButton'); if(x) x.click(); });
        }
      }
    });
    observer.observe(notesList,{childList:true,subtree:true});
  }

  // Proofs: improve existing empty message with an actionable link to tasks.
  const proofEmpty=$('proofEmpty');
  if(proofEmpty && !proofEmpty.querySelector('.newla-empty-action')){
    proofEmpty.appendChild(makeAction('Go to Tasks','emptyProofTasks'));
    const b=proofEmpty.querySelector('.newla-empty-action');
    b.addEventListener('click',()=>{
      const nav=[...document.querySelectorAll('.nav-btn')].find(x=>/tasks/i.test(x.textContent||''));
      if(nav) nav.click();
    });
  }

  // Brainstorm: lightweight empty-state hint that disappears once the user adds a sticky/note.
  const workspace=$('workspace');
  if(workspace && !workspace.querySelector('.brain-empty-state')){
    const wrap=document.createElement('div'); wrap.className='brain-empty-state'; wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML='<div class="brain-empty-card"><strong>Start your first idea</strong><span>Add a sticky note, text box, or sketch to turn the canvas into your thinking space.</span><div class="brain-empty-hint">Tip: press N for a new idea</div></div>';
    workspace.appendChild(wrap);
    const refresh=()=>{
      const board=$('board');
      if(!board) return;
      const hasItems=!!board.querySelector('.sticky-note,[data-node],text,foreignObject,image') || (board.querySelector('svg') && board.querySelector('svg').childElementCount>0);
      wrap.classList.toggle('visible',!hasItems);
    };
    const observer=new MutationObserver(refresh);
    const board=$('board');
    if(board) observer.observe(board,{childList:true,subtree:true,attributes:true});
    setTimeout(refresh,300);
  }

  // Dashboard already has an empty hint; make sure its CTA message remains visible and clear.
  const dashHint=$('dashTodayHint');
  if(dashHint && !dashHint.textContent.trim()) dashHint.textContent='No tasks yet — add your first one';
})();
