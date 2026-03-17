let currentAudio = null;

async function getDB() {
    if (typeof openDB === 'function') {
        return await openDB();
    } else {
        console.error("שגיאה: db_core.js לא נטען");
        return null;
    }
}

async function playAudio() {
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
                currentAudio.play();
                currentAudio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; };
            } else { alert("אין הקלטה"); }
        };
    } catch (e) { console.error(e); }
}

function pauseAudio() { if (currentAudio) currentAudio.pause(); }

async function deleteAudio() {
    if (!confirm("למחוק?")) return;
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete("shared_audio");
    transaction.oncomplete = () => {
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        alert("נמחק");
    };
}

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
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get("shared_audio");

    request.onsuccess = async () => {
        const blob = request.result;
        if (!blob) { alert("אין הקלטה"); return; }

        // טריק: משנים סיומת ל-mp3 כדי שוואטסאפ יאפשר שיתוף
        const fileName = "recording.mp3";
        const message = "מצרף הקלטת שמע מהמחשבון";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        switch (type) {
            case 'disk':
                await saveToDisk(blob, fileName);
                break;
            case 'whatsapp':
                if (isMobile && navigator.share) {
                    const file = new File([blob], fileName, { type: "audio/mp3" });
                    navigator.share({ files: [file], title: 'הקלטה', text: message }).catch(() => {});
                } else {
                    downloadDirectly(blob, fileName);
                    window.location.href = `whatsapp://send?text=${encodeURIComponent(message)}`;
                }
                break;
            case 'gmail':
                downloadDirectly(blob, fileName);
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('הקלטת שמע')}&body=${encodeURIComponent(message)}`;
                window.location.href = gmailUrl; // עוקף חסימת פופ-אפ
                break;
            case 'share':
                if (navigator.share) {
                    const file = new File([blob], fileName, { type: "audio/mp3" });
                    navigator.share({ files: [file] }).catch(() => {});
                } else {
                    downloadDirectly(blob, fileName);
                }
                break;
        }
    };
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
                types: [{ description: 'Audio', accept: { 'audio/mp3': ['.mp3'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (err) { if (err.name !== 'AbortError') downloadDirectly(blob, fileName); }
    } else { downloadDirectly(blob, fileName); }
}