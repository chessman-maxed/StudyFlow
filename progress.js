let savedPlan = localStorage.getItem('currentStudyPlan') || "";
let progressState = JSON.parse(localStorage.getItem('studyProgressState') || "{}");
let tasks = [];
let categories = [];
let progressChart = null;
let velocityChart = null;
let subjectChart = null;

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
        text: isDark ? '#e2e8f0' : '#1e293b',
        grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        done: '#10b981',
        remaining: isDark ? '#334155' : '#cbd5e1',
        line: isDark ? '#facc15' : '#d97706',
        fill: isDark ? 'rgba(250,204,21,0.15)' : 'rgba(217,119,6,0.15)',
        accent: '#3b82f6',
        accentFill: isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.3)'
    };
}

function renderSubjectChart() {
    if (subjectChart) subjectChart.destroy();
    const colors = getChartColors();
    const subCounts = {};
    
    tasks.forEach(t => {
        let match = t.text.match(/^\*\*(.*?)\*\*/);
        let sub = match ? match[1] : null;
        if (!sub) {
            match = t.text.match(/^([A-Za-z\s]+):/);
            if (match && match[1].length < 20) sub = match[1];
        }
        if (!sub) sub = t.category.match(/Day|Week|Phase/) ? "General" : t.category;
        sub = sub.trim().replace(/^[-*]+/, '');
        subCounts[sub] = (subCounts[sub] || 0) + 1;
    });

    const labels = Object.keys(subCounts);
    const data = Object.values(subCounts);

    const ctx = document.getElementById('subjectChart')?.getContext('2d');
    if (!ctx) return;

    subjectChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['No data'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: labels.length ? ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'] : ['#94a3b8'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderTasks() {
    const taskListEl = document.getElementById('taskList');
    if (!taskListEl) return;
    taskListEl.innerHTML = "";

    if (!savedPlan) {
        taskListEl.innerHTML = `
            <div class="empty-state text-center py-12">
                <i class="fas fa-clipboard-list text-5xl text-gray-600 mb-4"></i>
                <p class="text-gray-400 mb-4">No study plan found</p>
                <a href="planner.html" class="inline-block px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
                    Create Plan
                </a>
            </div>`;
        return;
    }

    let currentCat = "";
    tasks.forEach(task => {
        if (task.category !== currentCat) {
            currentCat = task.category;
            const header = document.createElement('div');
            header.className = "category-header mt-4 mb-2 px-3 py-2 rounded";
            header.innerHTML = `<span class="font-semibold text-amber-400"><i class="fas fa-calendar-day mr-2"></i>${currentCat}</span>`;
            taskListEl.appendChild(header);
        }

        const isChecked = progressState[task.id] || false;
        const item = document.createElement('div');
        item.className = `task-item flex items-center gap-4 p-4 rounded-lg ${isChecked ? 'completed' : ''}`;
        
        item.innerHTML = `
            <div class="checkbox-custom ${isChecked ? 'checked' : ''}" data-id="${task.id}"></div>
            <div class="flex-1">
                <p class="text-gray-200 ${isChecked ? 'line-through text-gray-500' : ''}">${task.text}</p>
            </div>
        `;
        taskListEl.appendChild(item);
    });

    document.querySelectorAll('.checkbox-custom').forEach(box => {
        if (box.hasAttribute('data-listener-added')) return;
        box.setAttribute('data-listener-added', 'true');
        box.addEventListener('click', function() {
            const id = this.dataset.id;
            const isChecked = !this.classList.contains('checked');
            this.classList.toggle('checked', isChecked);
            progressState[id] = isChecked;
            localStorage.setItem('studyProgressState', JSON.stringify(progressState));
            updateUI();
        });
    });
}

function renderFlowchart(cats) {
    const flowStepsEl = document.getElementById('flowSteps');
    if (!flowStepsEl) return;
    flowStepsEl.innerHTML = "";

    if (!cats.length) {
        flowStepsEl.innerHTML = '<div class="text-gray-500 text-sm w-full text-center">No milestones yet</div>';
        return;
    }

    cats.forEach((cat, index) => {
        const catTasks = tasks.filter(t => t.category === cat);
        const isComplete = catTasks.length > 0 && catTasks.every(t => progressState[t.id]);
        const isActive = catTasks.some(t => progressState[t.id]);

        const step = document.createElement('div');
        step.className = "flex flex-col items-center gap-2";
        step.innerHTML = `
            <div class="step-circle w-12 h-12 rounded-full flex items-center justify-center transition-all ${isComplete ? 'completed' : isActive ? 'active' : ''}">
                <i class="fas ${isComplete ? 'fa-check' : 'fa-circle'} text-white text-sm"></i>
            </div>
            <span class="text-xs ${isComplete ? 'text-green-400' : isActive ? 'text-amber-400' : 'text-gray-500'} font-medium text-center truncate max-w-[80px]">${cat}</span>
        `;
        flowStepsEl.appendChild(step);
    });
}

function updateUI() {
    const total = tasks.length;
    const completed = tasks.filter(t => progressState[t.id]).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update progress text
    const percentEl = document.getElementById('progressPercent');
    if (percentEl) percentEl.innerText = `${percent}%`;

    // Update ring
    const ring = document.getElementById('progressRing');
    if (ring) {
        const circumference = 351.86;
        ring.style.strokeDashoffset = circumference - (percent / 100) * circumference;
    }

    // Update counts
    document.getElementById('taskCount').innerText = `${total} tasks`;
    document.getElementById('completedCount').innerText = `${completed} / ${total} completed`;

    // Update charts
    if (velocityChart) {
        if (velocityChart.data.datasets[0].data.every(v => v === 0)) {
            velocityChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0, completed];
        } else {
            velocityChart.data.datasets[0].data.push(completed);
            if (velocityChart.data.datasets[0].data.length > 7) velocityChart.data.datasets[0].data.shift();
        }
        velocityChart.update();
    }

    renderFlowchart(categories);
    renderTasks();

    // Finish button
    const finishBtn = document.getElementById('finishBtn');
    if (finishBtn) {
        const canFinish = total > 0 && completed === total;
        finishBtn.disabled = !canFinish;
        if (canFinish) {
            finishBtn.onclick = () => {
                document.getElementById('congratsModal')?.classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('congratsContent')?.classList.remove('scale-95', 'opacity-0');
                    document.getElementById('congratsContent')?.classList.add('scale-100', 'opacity-100');
                }, 50);
            };
        }
    }
}

function loadPlanData() {
    const newPlan = localStorage.getItem('currentStudyPlan') || "";
    
    // Always load existing progress state first from localStorage
    const savedProgress = localStorage.getItem('studyProgressState');
    if (savedProgress) {
        progressState = JSON.parse(savedProgress);
    }
    
    // If we have a new plan and it's different, update savedPlan but preserve progress
    if (newPlan && newPlan !== savedPlan) {
        savedPlan = newPlan;
        localStorage.setItem('currentStudyPlan', savedPlan);
    } else if (!savedPlan && newPlan) {
        // If savedPlan was empty but there's a plan in storage, use it
        savedPlan = newPlan;
    }
    
    // Always save current progress state to ensure persistence
    localStorage.setItem('studyProgressState', JSON.stringify(progressState));

    if (!savedPlan) {
        renderTasks();
        return;
    }

    const lines = savedPlan.split('\n');
    tasks = [];
    categories = [];
    let currentCategory = "General";

    lines.forEach((line, lineIdx) => {
        line = line.trim();
        if (line.match(/^(Day \d+|Week \d+|###|Step \d+)/i) || (line.endsWith(':') && line.length < 30)) {
            currentCategory = line.replace(/[:#]/g, '').trim();
            if (!categories.includes(currentCategory)) categories.push(currentCategory);
        } else if (line.match(/^[-*•] /) || line.match(/^\d+\. /)) {
            let text = line.replace(/^[-*•\d+.]+ /, '').trim();
            const cleanText = text.replace(/[*_:]/g, '').trim();
            const isHeader = cleanText.match(/^(Day|Week|Phase) \d+$/i) ||
                cleanText.match(/^(Day|Week|Phase) \d+ Focus$/i) ||
                (cleanText.length < 15 && cleanText.match(/^(Day|Week|Phase)/i));

            if (text.length > 3 && !isHeader) {
                const uniqueId = `task_${lineIdx}_${btoa(text).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;
                tasks.push({
                    category: currentCategory,
                    text: text,
                    id: uniqueId
                });
                if (!categories.includes(currentCategory)) categories.push(currentCategory);
            }
        }
    });

    if (tasks.length === 0) {
        savedPlan.split('.').forEach((s, i) => {
            if (s.trim().length > 10) {
                tasks.push({ category: "Day " + (Math.floor(i / 3) + 1), text: s.trim(), id: "auto_" + i });
            }
        });
        categories = [...new Set(tasks.map(t => t.category))];
    }

    renderFlowchart(categories);
    renderTasks();
    renderSubjectChart();
    updateUI();
}

function initCharts() {
    const colors = getChartColors();

    if (velocityChart) velocityChart.destroy();
    const ctxVel = document.getElementById('velocityChart')?.getContext('2d');
    if (ctxVel) {
        velocityChart = new Chart(ctxVel, {
            type: 'line',
            data: {
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: colors.line,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: colors.fill,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { display: false },
                    x: { display: false }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    renderSubjectChart();
}

function updateChartsTheme() {
    initCharts();
    loadPlanData();
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof VANTA !== 'undefined') {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        VANTA.NET({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200, minWidth: 200,
            scale: 1, scaleMobile: 1,
            color: 0x14b8a6,
            backgroundColor: isLight ? 0xf8fafc : 0x0a1628
        });
    }

    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        document.getElementById('mobile-menu')?.classList.toggle('hidden');
    });

    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        document.getElementById('congratsContent')?.classList.replace('scale-100', 'scale-95');
        document.getElementById('congratsContent')?.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => document.getElementById('congratsModal')?.classList.add('hidden'), 200);
    });
    document.getElementById('congratsBackdrop')?.addEventListener('click', () => {
        document.getElementById('closeModalBtn')?.click();
    });

    initCharts();
    loadPlanData();

    setInterval(() => {
        const currentPlan = localStorage.getItem('currentStudyPlan') || "";
        if (currentPlan !== savedPlan && currentPlan !== "") loadPlanData();
    }, 5000);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            const currentPlan = localStorage.getItem('currentStudyPlan') || "";
            if (currentPlan !== savedPlan && currentPlan !== "") loadPlanData();
        }
    });

    new MutationObserver(() => setTimeout(updateChartsTheme, 100))
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
