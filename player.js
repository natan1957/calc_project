let currentAudio = null;

async function playAudio() {
    if (currentAudio && currentAudio.paused) {
        currentAudio.play();
        return;
    }
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get("shared_audio");

    request.onsuccess = () => {
        if (request.result) {
            const url = URL.createObjectURL(request.result);
            currentAudio = new Audio(url);
            currentAudio.play();
            currentAudio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; };
        } else { alert("לא נמצאה הקלטה"); }
    };
}

function pauseAudio() { if (currentAudio) currentAudio.pause(); }

async function deleteAudio() {
    const db = await openDB();
    db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete("shared_audio");
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (document.getElementById('playRec')) document.getElementById('playRec').disabled = true;
    alert("ההקלטה נמחקה");
}

/* --- ניתוח ו': אופטימיזציה לאפליקציות דסקטופ --- */

function exportAudio() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.hidden = false;
    } else {
        processExport('share');
    }
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.hidden = true;
}

async function processExport(type) {
    closeExportModal();
    
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get("shared_audio");

        request.onsuccess = async () => {
            if (!request.result) {
                alert("אין הקלטה לייצוא");
                return;
            }

            const blob = request.result;
            const fileName = "recording.webm";
            const message = "מצרף הקלטת שמע מהמחשבון הפיננסי";

            switch (type) {
                case 'disk':
                    await saveToDisk(blob, fileName);
                    break;
                    
                case 'whatsapp':
                    // הורדה מידית כדי שיהיה מוכן לגרירה
                    downloadDirectly(blob, fileName);
                    // שימוש בפרוטוקול ישיר לאפליקציית דסקטופ
                    window.location.href = `whatsapp://send?text=${encodeURIComponent(message)}`;
                    break;
                    
                case 'gmail':
                    downloadDirectly(blob, fileName);
                    // פתיחת ג'ימייל במצב כתיבה ישיר
                    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('הקלטת שמע מהמחשבון')}&body=${encodeURIComponent(message)}`, '_blank');
                    break;
                    
                case 'share':
                    await shareAudio(blob, fileName);
                    break;
            }
        };
    } catch (e) {
        console.error("שגיאה בתהליך הייצוא:", e);
    }
}

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

async function shareAudio(blob, fileName) {
    const file = new File([blob], fileName, { type: "audio/webm" });
    if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'ייצוא הקלטה',
                text: 'מצרף את הקלטת השמע'
            });
        } catch (err) {
            console.log("שיתוף בוטל");
        }
    } else {
        downloadDirectly(blob, fileName);
    }
}