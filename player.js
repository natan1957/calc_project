/* PROTOCOL: OPERATING ROOM 
   FILE: player.js 
*/
console.log("Player Loaded: 19/03/2026 18:09");

let lastPosition = 0; // שמירת מיקום השמעה לטובת המשך (Resume)

async function playAudio() {
    // צעד קריטי לנייד: יצירת אובייקט האודיו מיד עם הלחיצה לפני כל await
    if (!window.currentAudio) {
        window.currentAudio = new Audio();
    }

    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get("audio_file");

    req.onsuccess = () => {
        const blob = req.result;
        if (!blob) { alert("לא נמצאה הקלטה."); return; }
        
        const url = URL.createObjectURL(blob);
        
        // אם האודיו קיים, טעון ב-Blob הנכון, וב-Pause - פשוט נגן
        if (window.currentAudio.src.startsWith('blob:') && window.currentAudio.paused && lastPosition > 0) {
            window.currentAudio.play().catch(() => {
                // במקרה של שגיאה ב-Blob הישן, נטען מחדש
                loadAndPlay(url);
            });
        } else {
            // טעינה ראשונית או רענון
            loadAndPlay(url);
        }

        function loadAndPlay(audioUrl) {
            window.currentAudio.src = audioUrl;
            window.currentAudio.currentTime = lastPosition;
            
            // שימוש באירוע כדי למנוע לחיצה כפולה - מנגן כשהקובץ מוכן
            window.currentAudio.oncanplay = () => {
                window.currentAudio.play().catch(err => console.error("Playback failed:", err));
                window.currentAudio.oncanplay = null; // ניקוי האירוע
            };
            window.currentAudio.load();
        }

        window.currentAudio.onended = () => {
            URL.revokeObjectURL(url);
            lastPosition = 0; // איפוס בסיום מלא
        };
    };
}

function pauseAudio() {
    if (window.currentAudio) {
        lastPosition = window.currentAudio.currentTime; // שמירת המיקום הנוכחי לפני העצירה
        window.currentAudio.pause();
    }
}

async function deleteAudio() {
    const db = await openDB();
    if (!db || !confirm("למחוק?")) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete("audio_file");
    tx.oncomplete = () => {
        alert("נמחק.");
        lastPosition = 0;
        if (window.currentAudio) window.currentAudio.src = "";
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

            // ניסיון פתיחת חלון "שמירה בשם"
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: 'archive.zip',
                        types: [{ accept: {'application/zip': ['.zip']} }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(content);
                    await writable.close();
                } catch (pickerErr) {
                    // במקרה של ביטול המשתמש או שגיאת מערכת
                    console.log("Save picker closed or failed.");
                }
            } else {
                // Fallback להורדה אוטומטית לתיקיית הורדות
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = "archive.zip";
                a.click();
            }
        } catch (err) { alert("שגיאה בייצוא ZIP"); }
    };
}