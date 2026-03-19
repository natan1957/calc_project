/* PROTOCOL: OPERATING ROOM 
   FILE: fin.js 
*/
console.log("Finance Logic Loaded - Version 1.0.6 (19/03/2026 21:20)");

// אתחול וטעינת נתונים
window.addEventListener('load', () => {
    const display = document.getElementById('display');
    const saved = localStorage.getItem('shared_result');
    
    if (saved && display) {
        display.value = saved;
        console.log("נתונים שוחזרו מגרסה קודמת: " + saved);
    }
});

// פונקציות מחשבון סטנדרטיות (עבור הכפתורים ב-HTML)
function appendNumber(num) {
    const display = document.getElementById('display');
    if (display.value === "0") display.value = num;
    else display.value += num;
}

function appendOperator(op) {
    const display = document.getElementById('display');
    display.value += op;
}

function clearDisplay() {
    const display = document.getElementById('display');
    display.value = "";
}

function calculate() {
    const display = document.getElementById('display');
    try {
        // ביצוע חישוב בטוח ושמירה ב-LocalStorage
        const result = eval(display.value);
        display.value = result;
        localStorage.setItem('shared_result', result);
    } catch (e) {
        alert("ביטוי לא תקין");
        display.value = "";
    }
}

// לוגיקת מחשבון הלוואה (אם קיימים שדות רלוונטיים)
function calculateLoan() {
    const amountEl = document.getElementById('loanAmount');
    const interestEl = document.getElementById('interestRate');
    const paymentEl = document.getElementById('monthlyPayment');
    const resultEl = document.getElementById('result');

    if (!amountEl || !interestEl || !paymentEl || !resultEl) return;

    const P = parseFloat(amountEl.value);
    const r = (parseFloat(interestEl.value) / 100) / 12;
    const m = parseFloat(paymentEl.value);

    resultEl.innerText = "מחשב...";

    if (!P || !r || !m) { 
        alert("נא למלא את כל השדות בצורה תקינה"); 
        resultEl.innerText = "התוצאה תופיע כאן";
        return; 
    }

    const check = 1 - (r * P) / m;
    if (check <= 0) {
        resultEl.style.color = "red";
        resultEl.innerText = "ההחזר החודשי נמוך מדי! הוא לא מכסה את הריבית.";
        return;
    }

    const months = Math.ceil(-Math.log(check) / Math.log(1 + r));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    let resultText = `זמן החזר: ${months} חודשים`;
    if (years > 0) {
        resultText += ` (${years} שנים ו-${remainingMonths} חודשים)`;
    }
    
    resultEl.innerText = resultText;
    localStorage.setItem('shared_result', P);
}