

// Mobile menu
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
});

// Pomodoro Timer
let pomodoroTime = 25 * 60;
let pomodoroInterval = null;

function updateTimerDisplay() {
    const m = Math.floor(pomodoroTime / 60);
    const s = pomodoroTime % 60;
    document.getElementById("timer").innerText = `${m}:${s < 10 ? "0" : ""}${s}`;
}

window.startPomodoro = function () {
    if (pomodoroInterval) return;
    pomodoroInterval = setInterval(() => {
        if (pomodoroTime <= 0) {
            clearInterval(pomodoroInterval);
            pomodoroInterval = null;
            pomodoroTime = 25 * 60;
            alert("Pomodoro complete! Take a break.");
            updateTimerDisplay();
            return;
        }
        pomodoroTime--;
        updateTimerDisplay();
    }, 1000);
};

window.pausePomodoro = () => {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
};

window.resetPomodoro = () => {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    pomodoroTime = 25 * 60;
    updateTimerDisplay();
};
