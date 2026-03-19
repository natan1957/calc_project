/* PROTOCOL: OPERATING ROOM 
   FILE: player.js 
*/
console.log("Player Loaded: 19/03/2026 21:40");

let lastPosition = 0; 
let currentBlobUrl = null;

async function playAudio() {
    // שלב 1: הכנת אובייקט האודיו
    if (!window.currentAudio) {
        window.currentAudio = new Audio();
    }

    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get("audio_file");

    req.onsuccess = async () => {
        const blob = req.result;
        if (!blob) { 
            alert("לא נמצאה הקלטה בזיכרון."); 
            return; 
        }
        
        // שלב 2: ניקוי כתובת קודמת אם קיימת
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
        }
        
        currentBlobUrl = URL.createObjectURL(blob);
        window.currentAudio.src = currentBlobUrl;
        window.currentAudio.currentTime = lastPosition;

        // שלב 3: ניסיון ניגון אגרסיבי (מתאים לנייד)
        try {
            await window.currentAudio.play();
            console.log("Playback started successfully");
        } catch (err) {
            console.warn("Autoplay blocked or failed, retrying with load...");
            window.currentAudio.load();
            window.currentAudio.play().catch(e => {
                console.error("Final playback error:", e);
                alert("הדפדפן חוסם ניגון אוטומטי. נסה ללחוץ שוב.");
            });
        }

        window.currentAudio.onended = () => {
            lastPosition = 0; 
        };
    };
}

function pauseAudio() {
    if (window.currentAudio) {
        lastPosition = window.currentAudio.currentTime;
        window.currentAudio.pause();
    }
}

async function deleteAudio() {
    const db = await openDB();
    if (!db || !confirm("למחוק את ההקלטה?")) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete("audio_file");
    tx.oncomplete = () => {
        alert("ההקלטה נמחקה.");
        lastPosition = 0;
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio.src = "";
        }
    };
}

async function exportAudio() {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get("audio_file");

    req.onsuccess = async () => {
        const blob = req.result;
        if (!blob) { alert("אין מה לייצא."); return; }
        try {
            const zip = new JSZip();
            zip.file("recording.webm", blob);
            const content = await zip.generateAsync({ type: "blob" });

            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: 'recording_archive.zip',
                        types: [{ accept: {'application/zip': ['.zip']} }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(content);
                    await writable.close();
                } catch (err) { console.log("Save cancelled"); }
            } else {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = "recording_archive.zip";
                a.click();
            }
        } catch (err) { alert("שגיאה בייצוא ZIP"); }
    };
}