let mediaRecorder;
let audioChunks = [];
let audioContext;
let gainNode;
let analyser;
let animationId;

async function startRecording() {
    audioChunks = [];
    try {
        // ביטול עיבודים אוטומטיים שמחרבים את הסאונד
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: true, 
                noiseSuppression: false, 
                autoGainControl: false 
            } 
        });

        // יצירת סביבת אודיו
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        
        // הגדרת בקר עוצמה (Gain)
        gainNode = audioContext.createGain();
        const slider = document.getElementById('gainSlider');
        gainNode.gain.value = slider.value;
        
        // עדכון עוצמה בזמן אמת מהסליידר
        slider.oninput = (e) => {
            const val = parseFloat(e.target.value);
            gainNode.gain.value = val;
            document.getElementById('gainValue').innerText = val.toFixed(1);
        };

        // הגדרת מנתח עוצמה לויזואליזציה
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const meterBar = document.getElementById('volumeMeter');

        // פונקציית עדכון המד החזותי
        function updateMeter() {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
            let average = sum / bufferLength;
            // חישוב רוחב המד (מכפילים ב-1.5 כדי שיהיה רגיש מספיק)
            meterBar.style.width = Math.min(average * 1.5, 100) + "%";
            animationId = requestAnimationFrame(updateMeter);
        }
        updateMeter();

        // חיבור השרשרת: מיקרופון -> ווליום -> אנלייזר
        source.connect(gainNode);
        gainNode.connect(analyser);

        // הקלטה מהפלט של ה-Gain Node
        const destination = audioContext.createMediaStreamDestination();
        gainNode.connect(destination);

        mediaRecorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
        
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
        
        mediaRecorder.onstop = async () => {
            cancelAnimationFrame(animationId);
            meterBar.style.width = "0%";
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const db = await openDB();
            db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(blob, "shared_audio");
            
            stream.getTracks().forEach(t => t.stop());
            if (audioContext.state !== 'closed') audioContext.close();
            if (document.getElementById('playRec')) document.getElementById('playRec').disabled = false;
        };

        mediaRecorder.start(100);
        document.getElementById('startRec').disabled = true;
        document.getElementById('stopRec').disabled = false;
    } catch (err) { 
        alert("שגיאה בגישה למיקרופון: " + err); 
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        document.getElementById('startRec').disabled = false;
        document.getElementById('stopRec').disabled = true;
    }
}