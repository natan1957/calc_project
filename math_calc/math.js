/* PROTOCOL: SURGICAL ALIGNMENT
   FILE: math.js
   DESCRIPTION: Calculator logic with safety-check for eval.
*/

let display = document.getElementById('display');

function appendNumber(number) {
    display.value += number;
}

function appendOperator(operator) {
    display.value += ' ' + operator + ' ';
}

function clearDisplay() {
    display.value = '';
}

function calculate() {
    try {
        // ניקוי רווחים מיותרים לפני ה-eval כדי למנוע שגיאות תחביר
        let expression = display.value.trim();
        if (expression === "") return;
        
        display.value = eval(expression);
    } catch (error) {
        display.value = 'Error';
        setTimeout(clearDisplay, 1500);
    }
}

// עדכון ויזואלי של ערך ה-Gain בסליידר
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('gainSlider');
    const gainValue = document.getElementById('gainValue');
    
    if (slider && gainValue) {
        slider.addEventListener('input', () => {
            gainValue.innerText = slider.value;
        });
    }
});