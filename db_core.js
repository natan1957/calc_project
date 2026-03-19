/* PROTOCOL: OPERATING ROOM 
   FILE: db_core.js 
*/
const DB_NAME = "AudioProjectDB";
const STORE_NAME = "shared_audio"; 

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2); 

        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
                console.log(`Store ${STORE_NAME} created.`);
            }
        };

        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject("שגיאה בפתיחת מסד הנתונים");
    });
}