const DB_NAME = "AudioProjectDB";
// שיניתי ל-shared_audio כדי להתאים ל-player.js ולמנוע כפילויות
const STORE_NAME = "shared_audio"; 

function openDB() {
    return new Promise((resolve, reject) => {
        // העליתי גרסה ל-2 כדי לוודא שהשינוי ב-Store יתפוס
        const request = indexedDB.open(DB_NAME, 2); 

        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
                console.log(`Store ${STORE_NAME} created successfully.`);
            }
        };

        request.onsuccess = e => {
            resolve(e.target.result);
        };

        request.onerror = e => {
            console.error("IndexedDB error:", e);
            reject("שגיאה בפתיחת מסד הנתונים");
        };
    });
}