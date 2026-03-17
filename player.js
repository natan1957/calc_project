let currentAudio = null;

// פונקציית עזר לוודא שבסיס הנתונים זמין
async function getDB() {
    if (typeof openDB === 'function') {
        return await openDB();
    } else {
        console.error("שגיאה: הפונקציה openDB לא נמצאה. וודא ש-db_core.js נטען כראוי.");
        return null;
    }
}

async function playAudio() {
    console.log("ניסיון השמעה...");
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        return;
    }

    try {
        const db = await getDB();
        if (!db) return;

        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get("shared_audio");

        request.onsuccess = () => {
            if (request.result) {
                const url = URL.createObjectURL(request.result);
                currentAudio = new Audio(url);
                currentAudio.play().catch(err => console.error("שגיאת הפעלה:", err));
                
                currentAudio.onended = () => { 
                    URL.revokeObjectURL(url); 
                    currentAudio = null; 
                };
            } else { 
                alert("לא נמצאה הקלטה להשמעה"); 
            }
        };
    } catch (e) {
        console.error("שגיאה בתהליך ההשמעה:", e);
    }
}

function pauseAudio() { 
    if (currentAudio) currentAudio.pause(); 
}

async function deleteAudio() {
    if (!confirm("האם למחוק את ההקלטה?")) return;
    try {
        const db = await getDB();
        if (!db) return;
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete("shared_audio");
        transaction.oncomplete = () => {
            if (currentAudio) { 
                currentAudio.pause(); 
                currentAudio = null; 
            }
            alert("ההקלטה נמחקה בהצלחה");
        };
    } catch (e) {
        console.error("שגיאה במחיקה:", e);
    }
}

/* --- ניהול ייצוא ושיתוף --- */

function exportAudio() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.hidden = false;
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.hidden = true;
}

async function processExport(type) {
    closeExportModal();
    try {
        const db = await getDB();
        if (!db) return;
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get("shared_audio");

        request.onsuccess = async () => {
            const blob = request.result;
            if (!blob) {
                alert("אין הקלטה לייצוא");
                return;
            }

            const fileName = "recording.webm";
            const message = "מצרף הקלטת שמע מהמחשבון";
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            switch (type) {
                case 'disk':
                    // שינוי כאן: קריאה לפונקציה שמכריחה דיאלוג
                    await saveToDisk(blob, fileName);
                    break;
                    
                case 'whatsapp':
                    if (isMobile && navigator.share) {
                        const file = new File([blob], fileName, { type: "audio/webm" });
                        await navigator.share({
                            files: [file],
                            title: 'הקלטה מהמחשבון',
                            text: message
                        }).catch(() => {});
                    } else {
                        downloadDirectly(blob, fileName);
                        window.location.href = `whatsapp://send?text=${encodeURIComponent(message)}`;
                    }
                    break;
                    
                case 'gmail':
                    downloadDirectly(blob, fileName);
                    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('הקלטת שמע')}&body=${encodeURIComponent(message)}`;
                    window.open(gmailUrl, '_blank');
                    break;
                    
                case 'share':
                    if (navigator.share) {
                        const file = new File([blob], fileName, { type: "audio/webm" });
                        await navigator.share({ files: [file] }).catch(() => {});
                    } else {
                        downloadDirectly(blob, fileName);
                    }
                    break;
            }
        };
    } catch (e) {
        console.error("שגיאה בייצוא:", e);
    }
}

// פונקציה להורדה ישירה (מובייל/דפדפנים ישנים)
function downloadDirectly(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// פונקציה להצגת דיאלוג "שמירה בשם" (דסקטופ מודרני)
async function saveToDisk(blob, fileName) {
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'Audio File',
                    accept: { 'audio/webm': ['.webm'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (err) {
            if (err.name !== 'AbortError') downloadDirectly(blob, fileName);
        }
    } else {
        downloadDirectly(blob, fileName);
    }
}