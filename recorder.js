/* PROTOCOL: OPERATING ROOM 
   FILE: recorder.js 
*/
let mediaRecorder;
let audioChunks = [];
let audioContext;
let audioStream;
let gainNode;
let animationId;

async function startRecording() {
    audioChunks = [];
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(audioStream);
        
        gainNode = audioContext.createGain();
        const slider = document.getElementById('gainSlider');
        const gainDisplay = document.getElementById('gainValue');

        if (slider) {
            gainNode.gain.value = parseFloat(slider.value);
            slider.oninput = (e) => {
                const val = parseFloat(e.target.value);
                if(gainNode) gainNode.gain.setTargetAtTime(val, audioContext.currentTime, 0.01);
                if(gainDisplay) gainDisplay.innerText = val;
            };
        }

        const analyser = audioContext.createAnalyser();
        source.connect(gainNode);
        gainNode.connect(analyser);
        const destination = audioContext.createMediaStreamDestination();
        gainNode.connect(destination);

        const meterBar = document.getElementById('volumeMeter');
        function updateMeter() {
            if (!analyser || !meterBar) return;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            let average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            meterBar.style.width = Math.min(average * 1.5, 100) + "%";
            if (mediaRecorder && mediaRecorder.state === "recording") animationId = requestAnimationFrame(updateMeter);
        }

        mediaRecorder = new MediaRecorder(destination.stream);
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
        
        mediaRecorder.onstop = async () => {
            cancelAnimationFrame(animationId);
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const db = await openDB();
            if (db) {
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).put(blob, "audio_file");
            }

            // איפוס מחוונים ויזואליים בסיום ההקלטה
            if (meterBar) meterBar.style.width = "0%";
            if (slider) {
                slider.value = 0;
                if (gainDisplay) gainDisplay.innerText = "0";
            }

            if (audioStream) audioStream.getTracks().forEach(t => t.stop());
            if (audioContext) audioContext.close();
        };

        mediaRecorder.start();
        updateMeter();
        document.getElementById('startRec').disabled = true;
        document.getElementById('stopRec').disabled = false;
    } catch (err) { alert("שגיאה במיקרופון: " + err); }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        document.getElementById('startRec').disabled = false;
        document.getElementById('stopRec').disabled = true;
    }
}