window.onload = () => {
    const saved = localStorage.getItem('shared_result');
    if (saved) document.getElementById('loanAmount').value = saved;
};

function calculateLoan() {
    const P = parseFloat(document.getElementById('loanAmount').value);
    const r = (parseFloat(document.getElementById('interestRate').value) / 100) / 12;
    const m = parseFloat(document.getElementById('monthlyPayment').value);

    if (!P || !r || !m) { alert("מלא שדות"); return; }

    const check = 1 - (r * P) / m;
    if (check <= 0) {
        document.getElementById('result').innerText = "ההחזר נמוך מדי!";
        return;
    }

    const months = Math.ceil(-Math.log(check) / Math.log(1 + r));
    document.getElementById('result').innerText = `זמן החזר: ${months} חודשים`;
}