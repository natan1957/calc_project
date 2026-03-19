/* PROTOCOL: OPERATING ROOM 
   FILE: player.js 
*/
console.log("Player Loaded: 19/03/2026 21:05");

let lastPosition = 0; // שמירת מיקום השמעה לטובת המשך (Resume)

async function playAudio() {
    // צעד קריטי לנייד: יצירת אובייקט האודיו מיד עם הלחיצה
    if (!window.currentAudio) {
        window.currentAudio = new Audio();
    }

    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get("audio_file");

    req.onsuccess = () => {
        const blob = req.result;
        if (!blob) { 
            alert("לא נמצאה הקלטה בזיכרון."); 
            return; 
        }
        
        const url = URL.createObjectURL(blob);
        
        // טעינה וניגון ישיר של ה-Blob שנשלף
        loadAndPlay(url);

        function loadAndPlay(audioUrl) {
            window.currentAudio.src = audioUrl;
            window.currentAudio.currentTime = lastPosition;
            
            // שימוש באירוע canplay כדי לוודא שהדפדפן מוכן להשמיע
            window.currentAudio.oncanplay = () => {
                window.currentAudio.play()
                    .then(() => console.log("Playback started"))
                    .catch(err => {
                        console.error("Playback failed:", err);
                        alert("השמעה נכשלה. נסה להקליט שוב.");
                    });
                window.currentAudio.oncanplay = null; 
            };
            window.currentAudio.load();
        }

        window.currentAudio.onended = () => {
            URL.revokeObjectURL(url);
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