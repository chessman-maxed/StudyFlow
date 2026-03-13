/* ================= FIREBASE SETUP ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWm4s24hFeCN_GNC9RRsz7jzm4-0RZbgI",
  authDomain: "smart-learning-planner1.firebaseapp.com",
  projectId: "smart-learning-planner1",
  storageBucket: "smart-learning-planner1.firebasestorage.app",
  messagingSenderId: "704749613324",
  appId: "1:704749613324:web:bdf4778de32d0cffe7d929"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let lastPlanData = null; // 🔁 for regenerate

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) console.log("Logged in:", user.uid);
});

/* ================= TYPEWRITER ================= */
function typeWriter(element, text, speed = 15, onDone) {
  element.innerHTML = "";
  let i = 0;

  const interval = setInterval(() => {
    element.innerHTML += text.charAt(i++);
    if (i >= text.length) {
      clearInterval(interval);
      if (onDone) onDone(); // ✅ typing finished
    }
  }, speed);
}

/* ================= AI RENDER ================= */
async function renderAI(planData) {
  const output = document.getElementById("planOutput");
  if (!output) return;

  output.innerHTML = `
    <div class="bg-slate-900/80 p-6 rounded-2xl text-white">
      <h2 class="text-xl font-bold text-teal-400 mb-3">
        🤖 AI Study Plan
      </h2>
      <pre id="aiText" class="whitespace-pre-wrap text-sm leading-relaxed text-white">
AI is thinking...
      </pre>
    </div>
  `;

  const aiTextEl = document.getElementById("aiText");
  
  try {
    const aiPlan = await getAIStudyPlan(planData);

    // Create buttons container
    const btnContainer = document.createElement("div");
    btnContainer.className = "flex gap-3 mt-4 hidden";
    btnContainer.id = "actionButtons";

    // Regenerate Button
    const regenBtn = document.createElement("button");
    regenBtn.className = "px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm transition-colors text-white";
    regenBtn.innerHTML = "🔄 Regenerate";
    regenBtn.onclick = async () => {
      aiTextEl.innerHTML = "Regenerating...\n";
      btnContainer.classList.add("hidden");
      const newPlan = await getAIStudyPlan(lastPlanData);
      // Recursively call render logic or simple re-type (simplified here)
      typeWriter(aiTextEl, newPlan, 15, () => btnContainer.classList.remove("hidden"));
    };

    // Confirm Button
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors text-white font-bold";
    confirmBtn.innerHTML = "✅ Confirm & Start";
    confirmBtn.onclick = () => {
      // Save to localStorage for the dashboard
      localStorage.setItem("currentStudyPlan", aiPlan);
      localStorage.setItem("planMetaData", JSON.stringify(planData));

      // Optional: Save to Firebase here if needed (already happening for raw data in submit handler)

      window.location.href = "study plans.html";
    };

    btnContainer.appendChild(regenBtn);
    btnContainer.appendChild(confirmBtn);
    output.querySelector(".bg-slate-900\\/80").appendChild(btnContainer);

    typeWriter(aiTextEl, aiPlan, 15, () => {
      btnContainer.classList.remove("hidden"); // Show buttons after typing
    });
  } catch (error) {
    console.error("Error in renderAI:", error);
    aiTextEl.innerHTML = `⚠️ Error generating plan: ${error.message}<br><br>Please try again or check your connection.`;
  }
}

/* ================= MAIN LOGIC ================= */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("plannerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("Form submitted");

    try {
      const examDate = new Date(document.getElementById("examDate").value);
      const goal = document.getElementById("goal").value;
      const dailyTime = Number(document.getElementById("dailyTime").value);
      const progress = Number(document.getElementById("progress").value || 100);

      const subjects = document.getElementById("subjects").value.split(",");
      const difficulties = document.getElementById("difficulty").value.split(",");
      const confidence = document.getElementById("confidence").value.split(",").map(Number);

      let weights = { Hard: 3, Medium: 2, Easy: 1 };
      if (progress < 60) weights.Hard += 1;

      let totalWeight = 0;
      difficulties.forEach((d, i) => {
        if (!d || confidence[i] == null) return;
        totalWeight += weights[d.trim()] * (6 - confidence[i]);
      });

      let schedule = "";
      subjects.forEach((sub, i) => {
        if (!difficulties[i] || confidence[i] == null) return;
        const diff = difficulties[i].trim();
        const hours =
          ((weights[diff] * (6 - confidence[i]) / totalWeight) * dailyTime).toFixed(1);
        schedule += `<p>${sub.trim()} (${diff}, Confidence ${confidence[i]}/5): ${hours} hrs</p>`;
      });

      let revisionPlan = "<h4>Revision Schedule</h4>";
      subjects.forEach((sub, i) => {
        if (confidence[i] <= 2) revisionPlan += `<p>${sub.trim()} → Day 1, 3, 7</p>`;
        else if (confidence[i] <= 4) revisionPlan += `<p>${sub.trim()} → Day 3, 7</p>`;
        else revisionPlan += `<p>${sub.trim()} → Day 7</p>`;
      });

      document.getElementById("planOutput").innerHTML = `
        <h3>Today's Study Plan</h3>
        <p><b>Goal:</b> ${goal}</p>
        <p><b>Progress:</b> ${progress}%</p>
        <hr>${schedule}<hr>${revisionPlan}
      `;

      if (currentUser) {
        try {
          await addDoc(collection(db, "users", currentUser.uid, "studyPlans"), {
            examDate,
            goal,
            dailyTime,
            progress,
            subjects,
            difficulties,
            confidence,
            createdAt: new Date()
          });
        } catch (error) {
          console.error("Error saving to Firebase:", error);
        }
      }

      lastPlanData = {
        examDate,
        goal,
        dailyTime,
        progress,
        subjects,
        difficulties,
        confidence
      };

      renderAI(lastPlanData);
    } catch (error) {
      console.error("Error in form submission:", error);
      document.getElementById("planOutput").innerHTML = `
        <div class="bg-red-900/80 p-6 rounded-2xl text-white">
          <h2 class="text-xl font-bold text-red-400 mb-3">
            ❌ Error
          </h2>
          <pre class="whitespace-pre-wrap text-sm leading-relaxed">
An error occurred while generating your plan: ${error.message}
          </pre>
        </div>
      `;
    }
  });
});

/* ================= AI FUNCTION ================= */
const OPENROUTER_API_KEY = "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";

function calculateDaysUntilExam(examDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const diffTime = exam - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

async function getAIStudyPlan(planData) {
  try {
    const daysUntilExam = calculateDaysUntilExam(planData.examDate);
    const today = new Date();
    const examDateFormatted = new Date(planData.examDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const prompt = `Generate a study plan from today (${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}) until the exam date (${examDateFormatted}). 
Total days available: ${daysUntilExam} days.

Requirements:
1. Distribute study tasks across ALL ${daysUntilExam} days evenly
2. Start from Day 1 (today) and go up to Day ${daysUntilExam}
3. MAX 3 tasks per day
4. Each task should be ONE specific action (10-30 minutes)
5. Format: '### Day X (Date)' for headers, then '- **Subject**: Action - Time' for tasks
6. Include revision sessions for weak subjects (based on confidence levels)
7. Example: '- **Maths**: Review chapter 1 - 15 min'

User details:
- Goal: ${planData.goal}
- Daily study time: ${planData.dailyTime} hours
- Weak subject: ${planData.subjects[0]}
- Subjects: ${planData.subjects.join(', ')}
- Difficulties: ${planData.difficulties.join(', ')}
- Confidence levels: ${planData.confidence.join(', ')}
- Current progress: ${planData.progress}%`;

    console.log("Calling OpenRouter API...");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "StudyFlow"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert study planner AI. Create personalized study plans based on the number of days until the exam. Always use ALL available days. Include specific tasks with subjects and time durations."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });
    console.log("API response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error:", res.status, errorText);
      return `⚠️ Error generating plan. Please try again later. (Status: ${res.status})`;
    }

    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      console.error("Invalid API response:", data);
      return "⚠️ Error: Invalid response from AI service. Please try again.";
    }
  } catch (error) {
    console.error("Error in getAIStudyPlan:", error);
    return `⚠️ Error: ${error.message}. Please check your connection and try again.`;
  }
}




