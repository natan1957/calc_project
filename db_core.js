const DB_NAME = "AudioProjectDB";
const STORE_NAME = "recordings";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = () => reject("שגיאה בפתיחת מסד הנתונים");
    });
}