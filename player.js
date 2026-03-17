case 'whatsapp':
                    // בדיקה האם המשתמש בנייד
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    
                    if (isMobile && navigator.share) {
                        // אם זה טלפון - נשתמש בשיתוף המובנה של המכשיר (אפשרות 2)
                        const file = new File([blob], fileName, { type: "audio/webm" });
                        try {
                            await navigator.share({
                                files: [file],
                                title: 'הקלטה מהמחשבון',
                                text: message
                            });
                        } catch (err) {
                            console.log("שיתוף בוטל או נכשל");
                        }
                    } else {
                        // אם זה מחשב - התנהגות רגילה: הורדה ופתיחת וואטסאפ ווב/דסקטופ
                        downloadDirectly(blob, fileName);
                        window.location.href = `whatsapp://send?text=${encodeURIComponent(message)}`;
                    }
                    break;