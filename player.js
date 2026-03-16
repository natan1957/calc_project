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