const display = document.getElementById('display');

window.onload = () => {
    const saved = localStorage.getItem('shared_result');
    if (saved) display.value = saved;
};

function appendNumber(num) { display.value += num; }
function appendOperator(op) { display.value += op; }
function clearDisplay() { display.value = ''; }

function calculate() {
    try {
        const result = eval(display.value);
        display.value = result;
        localStorage.setItem('shared_result', result);
    } catch (e) { display.value = "שגיאה"; }
}

// מיפוי פונקציות הנגן המשותף לכפתורי המחשבון הזה
function playLocalRecording() { playAudio(); }
function deleteRecording() { deleteAudio(); }