// חיווי גרסה בקונסולה - מעודכן ל-1.0.5
console.log("Finance Logic Loaded - Version 1.0.5");

window.onload = () => {
    const saved = localStorage.getItem('shared_result');
    const loanInput = document.getElementById('loanAmount');
    
    // שחזור נתונים בזהירות
    if (saved && loanInput) {
        loanInput.value = saved;
        console.log("נתונים שוחזרו מגרסה קודמת");
    }
};

function calculateLoan() {
    const amountEl = document.getElementById('loanAmount');
    const interestEl = document.getElementById('interestRate');
    const paymentEl = document.getElementById('monthlyPayment');
    const resultEl = document.getElementById('result');

    const P = parseFloat(amountEl.value);
    const r = (parseFloat(interestEl.value) / 100) / 12;
    const m = parseFloat(paymentEl.value);

    // חיווי ויזואלי לתחילת חישוב
    resultEl.innerText = "מחשב...";
    resultEl.style.color = "inherit";

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
    
    // שמירה מעודכנת
    localStorage.setItem('shared_result', P);
}