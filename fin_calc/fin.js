// חיווי גרסה בקונסולה לבדיקה מהירה בטלפון
console.log("Finance Logic Loaded - Version 1.0.4");

window.onload = () => {
    const saved = localStorage.getItem('shared_result');
    const loanInput = document.getElementById('loanAmount');
    
    // בדיקה שהאלמנט קיים לפני השמת ערך
    if (saved && loanInput) {
        loanInput.value = saved;
        console.log("נתונים שוחזרו מהזיכרון");
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

    // ניקוי תוצאה קודמת
    resultEl.innerText = "מחשב...";

    if (!P || !r || !m) { 
        alert("נא למלא את כל השדות בצורה תקינה"); 
        resultEl.innerText = "התוצאה תופיע כאן";
        return; 
    }

    // בדיקה מתמטית: האם הריבית החודשית גבוהה מההחזר?
    const check = 1 - (r * P) / m;
    if (check <= 0) {
        resultEl.style.color = "red";
        resultEl.innerText = "ההחזר החודשי נמוך מדי! הוא לא מכסה אפילו את הריבית.";
        return;
    }

    resultEl.style.color = "inherit";
    const months = Math.ceil(-Math.log(check) / Math.log(1 + r));
    
    // הצגת התוצאה בצורה ברורה
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    let resultText = `זמן החזר: ${months} חודשים`;
    if (years > 0) {
        resultText += ` (${years} שנים ו-${remainingMonths} חודשים)`;
    }
    
    resultEl.innerText = resultText;
    
    // שמירת הסכום לשימוש עתידי (localStorage)
    localStorage.setItem('shared_result', P);
}