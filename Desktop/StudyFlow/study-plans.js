// Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    const taskListEl = document.getElementById('taskList');
    const chatContainer = document.getElementById('chatContainer');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');

    // Load Plan and Parse into Tasks
    const savedPlan = localStorage.getItem('currentStudyPlan');
    const planMeta = localStorage.getItem('planMetaData');
    let progressState = JSON.parse(localStorage.getItem('studyProgressState') || "{}");

    function parsePlanIntoTasks(planText) {
        const tasks = [];
        const lines = planText.split('\n');
        let currentDay = "Day 1";
        
        lines.forEach(line => {
            line = line.trim();
            // Detect day headers - more flexible matching
            // Matches: ### Day 1, ## Day 1, Day 1, **Day 1**, Day 1 (January 15, 2026), etc.
            if (line.match(/^#{1,3}\s*Day/i) || 
                line.match(/^\*{1,2}\s*Day/i) || 
                line.match(/^Day\s*\d+/i) ||
                line.match(/Day\s+\d+/i)) {
                
                // Extract just "Day X" from the line, removing markdown, dates, etc.
                let dayMatch = line.match(/Day\s*\d+/i);
                if (dayMatch) {
                    currentDay = dayMatch[0]; // e.g., "Day 1"
                }
            }
            
            // Parse task items - check for bullet points, numbered lists, or subjects with dashes
            else if (line.match(/^[-*•]\s?/) || line.match(/^\d+\.\s?/) || line.match(/\*\*[A-Za-z]+.*\*\*:/)) {
                let text = line.replace(/^[-*•\d+.]+\s?/, '').trim();
                text = text.replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '').trim();
                
                // Extract duration if present
                let duration = "";
                const durationMatch = text.match(/(\d+\s*(hour|hr|min|minute)s?)/i);
                if (durationMatch) {
                    duration = durationMatch[0];
                    text = text.replace(durationMatch[0], '').trim();
                }
                
                // Clean up any remaining markdown
                text = text.replace(/\*\*/g, '').trim();
                
                if (text.length > 5 && !text.startsWith("Day") && !text.match(/^Lesson/i)) {
                    tasks.push({
                        id: btoa(text.substring(0, 30)).replace(/=/g, ''),
                        day: currentDay,
                        text: text,
                        duration: duration
                    });
                }
            }
        });
        
        // Fallback: if no tasks parsed, try to intelligently split by subject or sentences
        if (tasks.length === 0) {
            const sentences = planText.split(/[.!?]\s+/).filter(s => s.trim().length > 10);
            sentences.forEach((s, i) => {
                if (s.trim().length > 10) {
                    // Try to find day info in the sentence
                    let dayInfo = s.match(/Day\s*\d+/i);
                    let day = dayInfo ? dayInfo[0] : "Day " + (Math.floor(i / 3) + 1);
                    tasks.push({
                        id: 'task_' + i,
                        day: day,
                        text: s.trim(),
                        duration: ""
                    });
                }
            });
        }
        
        return tasks;
    }

    function renderTasks() {
        if (!taskListEl) return;
        
        let currentPlan = localStorage.getItem('currentStudyPlan');
        
        if (!currentPlan || currentPlan.trim() === "") {
            taskListEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-center">
                    <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                    <p class="mb-4">No active study plan found.</p>
                    <a href="planner.html" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors">
                        Create New Plan
                    </a>
                </div>`;
            return;
        }

        const parsedTasks = parsePlanIntoTasks(currentPlan);
        
        if (parsedTasks.length === 0) {
            taskListEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-center">
                    <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                    <p class="mb-4">Could not parse tasks from plan.</p>
                </div>`;
            return;
        }
        
        taskListEl.innerHTML = '';
        let currentDay = "";
        
        parsedTasks.forEach(task => {
            if (task.day !== currentDay) {
                currentDay = task.day;
                const dayHeader = document.createElement('div');
                dayHeader.className = "mt-4 mb-2 text-sm font-bold text-amber-300 border-b border-amber-500/30 pb-1";
                dayHeader.innerHTML = `<i class="fas fa-calendar-day mr-2"></i>${currentDay}`;
                taskListEl.appendChild(dayHeader);
            }
            
            const taskRow = document.createElement('div');
            taskRow.className = "flex items-start gap-3 p-3 rounded-lg border task-item";
            
            taskRow.innerHTML = `
                <div class="checkbox-custom" onclick="this.classList.toggle('checked')">
                </div>
                <div class="flex-1">
                    <p class="text-sm">
                        ${task.text}
                    </p>
                    ${task.duration ? `<span class="text-xs mt-1 inline-block"><i class="fas fa-clock mr-1"></i>${task.duration}</span>` : ''}
                </div>
            `;
            
            taskListEl.appendChild(taskRow);
        });
    }

    // Initial render
    renderTasks();

    // Listen for plan updates (from AI or other pages)
    window.addEventListener('storage', (e) => {
        if (e.key === 'currentStudyPlan' || e.key === 'planUpdated') {
            renderTasks();
        }
    });

    // Also check periodically for updates
    setInterval(() => {
        renderTasks();
    }, 3000);

    // Theme toggle override for chat container
    const originalToggle = toggleTheme;
    toggleTheme = function() {
        originalToggle();
        setTimeout(() => updateChatTheme(), 100);
    };

    function updateChatTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.style.backgroundColor = isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.3)';
        }
    }
    updateChatTheme();

    // Chat Functionality
    const OPENROUTER_API_KEY = "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";

    function savePlan(newPlan) {
        localStorage.setItem('currentStudyPlan', newPlan);
        // Clear progress when plan is modified (new tasks = new IDs)
        localStorage.setItem('studyProgressState', '{}');
        renderTasks();
        // Notify other pages
        localStorage.setItem('planUpdated', Date.now().toString());
    }

    async function getAIResponse(userMessage) {
        const currentPlan = localStorage.getItem('currentStudyPlan') || "";
        const planMeta = localStorage.getItem('planMetaData');
        
        // Check if user wants to modify/update the plan
        const modifyKeywords = ['change', 'update', 'modify', 'edit', 'replace', 'new task', 'add task', 'remove', 'delete', 'adjust', 'make it', 'shorten', 'reduce', 'increase', 'reduce'];
        const wantsToModify = modifyKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
        
        let systemPrompt;
        if (wantsToModify) {
            systemPrompt = `You are a helpful study assistant. The user wants to MODIFY their study plan. 
Current plan:
${currentPlan}

When the user asks to modify the plan (add, remove, change, update tasks), you must respond with ONLY the modified plan in the exact format below, starting with "### UPDATED PLAN ###" and ending with "### END PLAN ###":
### UPDATED PLAN ###
### Day 1
- **Subject**: Task - Time
### Day 2
- **Subject**: Task - Time
### END PLAN ###

If not modifying, just answer their question helpfully.`;
        } else {
            systemPrompt = `You are a helpful study assistant. The user is viewing their study plan: "${currentPlan ? currentPlan.substring(0, 1000) + "..." : "No plan loaded"}". 
Metadata: ${planMeta || "None"}. 
Answer their questions specifically based on this plan context. Keep answers concise, encouraging, and helpful.`;
        }

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "StudyFlow"
                },
                body: JSON.stringify({
                    model: "openai/gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ]
                })
            });

            const data = await response.json();
            let aiResponse = data.choices[0].message.content;
            
            // Check if AI modified the plan
            if (aiResponse.includes("### UPDATED PLAN ###") && aiResponse.includes("### END PLAN ###")) {
                const planStart = aiResponse.indexOf("### UPDATED PLAN ###") + "### UPDATED PLAN ###".length;
                const planEnd = aiResponse.indexOf("### END PLAN ###");
                const newPlan = aiResponse.substring(planStart, planEnd).trim();
                
                if (newPlan && newPlan.length > 20) {
                    savePlan(newPlan);
                    return "I've updated your study plan! The changes have been saved. You can view the progress page to track your tasks.";
                }
            }
            
            return aiResponse;
        } catch (error) {
            console.error("AI Error:", error);
            return "Sorry, I can't connect right now. Please try again later! 😔";
        }
    }

    function appendMessage(role, text) {
        if (!chatContainer) return;

        const wrapper = document.createElement('div');
        wrapper.className = `flex items-start gap-3 mb-4 ${role === 'user' ? 'flex-row-reverse' : ''}`;

        const avatar = document.createElement('div');
        avatar.className = `w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`;
        avatar.innerHTML = `<i class="fas ${role === 'user' ? 'fa-user' : 'fa-robot'} text-xs text-white"></i>`;

        const bubble = document.createElement('div');
        bubble.className = `p-3.5 rounded-2xl text-sm shadow-md max-w-[85%] leading-relaxed ${role === 'user'
            ? 'bg-emerald-600 text-white rounded-tr-none'
            : 'bg-slate-700/80 text-gray-100 border border-white/10 rounded-tl-none backdrop-blur-sm'
            }`;
        bubble.innerHTML = text.replace(/\n/g, '<br>');

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function typeWriterEffect(element, text, speed = 30) {
        let i = 0;
        element.innerHTML = ""; // Clear initial content

        function type() {
            if (i < text.length) {
                // Handle HTML tags (basic support for <br>)
                if (text.substring(i).startsWith("<br>")) {
                    element.innerHTML += "<br>";
                    i += 4;
                } else {
                    element.innerHTML += text.charAt(i);
                    i++;
                }
                chatContainer.scrollTop = chatContainer.scrollHeight;
                setTimeout(type, speed);
            }
        }
        type();
    }

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!userInput) return;

            const message = userInput.value.trim();
            if (!message) return;

            // Add user message
            appendMessage('user', message);
            userInput.value = '';

            // Show loading indicator
            const loadingId = 'loading-' + Date.now();
            const loadingWrapper = document.createElement('div');
            loadingWrapper.id = loadingId;
            loadingWrapper.className = "flex items-start gap-3 mb-4";
            loadingWrapper.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg"><i class="fas fa-robot text-xs text-white"></i></div>
                <div class="bg-slate-700/80 p-3.5 rounded-2xl rounded-tl-none border border-white/10 text-sm text-gray-400 shadow-md backdrop-blur-sm flex items-center gap-2">
                    <span>Thinking</span>
                    <span class="flex gap-1">
                        <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></span>
                        <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                        <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                    </span>
                </div>
            `;
            chatContainer.appendChild(loadingWrapper);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Artificial Thinking Delay (min 1.5s) + Network Request
            const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));
            const [response] = await Promise.all([getAIResponse(message), delayPromise]);

            // Remove loading
            document.getElementById(loadingId)?.remove();

            // Create AI message container (empty initially)
            const wrapper = document.createElement('div');
            wrapper.className = `flex items-start gap-3 mb-4`;

            const avatar = document.createElement('div');
            avatar.className = `w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600`;
            avatar.innerHTML = `<i class="fas fa-robot text-xs text-white"></i>`;

            const bubble = document.createElement('div');
            bubble.className = `p-3.5 rounded-2xl text-sm shadow-md max-w-[85%] leading-relaxed bg-slate-700/80 text-gray-100 border border-white/10 rounded-tl-none backdrop-blur-sm`;

            wrapper.appendChild(avatar);
            wrapper.appendChild(bubble);
            chatContainer.appendChild(wrapper);

            // Typewriter effect
            const formattedResponse = response.replace(/\n/g, '<br>');
            typeWriterEffect(bubble, formattedResponse, 20);
        });
    }
});
