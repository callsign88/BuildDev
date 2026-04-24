document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const langToggle = document.getElementById('lang-toggle');
    const imageUpload = document.getElementById('image-upload');
    const uploadTriggerBtn = document.getElementById('upload-trigger-btn');
    const cameraBtn = document.getElementById('camera-btn');
    const cameraContainer = document.getElementById('camera-container');
    const webcamElement = document.getElementById('webcam');
    const captureBtn = document.getElementById('capture-btn');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const labelContainer = document.getElementById('label-container');
    const guideTrigger = document.getElementById('guide-trigger');
    const guideModal = document.getElementById('guide-modal');
    const genderBtns = document.querySelectorAll('.gender-btn');

    let currentGender = 'male';
    let stream = null;

    // Language logic
    let currentLang = localStorage.getItem('lang') || 'ko';
    applyTranslations(currentLang);

    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'ko' ? 'en' : 'ko';
        localStorage.setItem('lang', currentLang);
        applyTranslations(currentLang);
        if (imagePreview.src && !imagePreviewContainer.classList.contains('hidden')) {
            predictImage();
        }
    });

    // Theme logic
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';

    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });

    // Gender selection logic
    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGender = btn.dataset.gender;
            
            if (imagePreview.src && !imagePreviewContainer.classList.contains('hidden')) {
                predictImage();
            }
        });
    });

    // Camera logic
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcamElement.srcObject = stream;
            cameraContainer.classList.remove('hidden');
            imagePreviewContainer.classList.add('hidden');
            labelContainer.innerHTML = "";
        } catch (err) {
            console.error("Camera access denied:", err);
            alert(translations[currentLang].camera_error);
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraContainer.classList.add('hidden');
    }

    cameraBtn.addEventListener('click', () => {
        startCamera();
    });

    captureBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = webcamElement.videoWidth;
        canvas.height = webcamElement.videoHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(webcamElement, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/png');
        imagePreview.src = dataUrl;
        imagePreviewContainer.classList.remove('hidden');
        
        stopCamera();
        imagePreview.onload = () => predictImage();
    });

    // Upload logic
    uploadTriggerBtn.addEventListener('click', () => {
        stopCamera();
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreviewContainer.classList.remove('hidden');
                labelContainer.innerHTML = "";
                
                imagePreview.onload = () => {
                    predictImage();
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Teachable Machine Logic
    const TM_URL = "https://teachablemachine.withgoogle.com/models/e3Nj0fnrJ/";
    let tmModel, maxPredictions;
    let isModelLoading = false;

    async function loadModel() {
        if (tmModel || isModelLoading) return;
        isModelLoading = true;
        labelContainer.innerHTML = `<div class='loading'>${translations[currentLang].loading_model}</div>`;
        try {
            const modelURL = TM_URL + "model.json";
            const metadataURL = TM_URL + "metadata.json";
            tmModel = await tmImage.load(modelURL, metadataURL);
            maxPredictions = tmModel.getTotalClasses();
            labelContainer.innerHTML = "";
        } catch (e) {
            console.error("Model loading failed:", e);
            labelContainer.innerHTML = `<div class='error'>${translations[currentLang].loading_fail}</div>`;
        } finally {
            isModelLoading = false;
        }
    }

    async function predictImage() {
        try {
            if (!tmModel) {
                await loadModel();
            }
            if (!tmModel) return;

            labelContainer.innerHTML = `<div class='loading'>${translations[currentLang].analyzing}</div>`;
            
            const prediction = await tmModel.predict(imagePreview);
            labelContainer.innerHTML = "";
            
            // Custom Result Title Logic
            const resultTitle = document.createElement("div");
            resultTitle.style.marginBottom = "20px";
            resultTitle.style.padding = "15px";
            resultTitle.style.borderRadius = "15px";
            resultTitle.style.background = "var(--primary-color)";
            resultTitle.style.color = "white";
            resultTitle.style.fontSize = "1.2rem";
            resultTitle.style.fontWeight = "700";
            
            let highest = prediction[0];
            for(let i=1; i<prediction.length; i++) {
                if(prediction[i].probability > highest.probability) {
                    highest = prediction[i];
                }
            }
            
            let finalResult = "";
            const t = translations[currentLang];
            if (highest.className.includes("강아지")) {
                finalResult = currentGender === 'male' ? t.result_dog_male : t.result_dog_female;
            } else if (highest.className.includes("고양이")) {
                finalResult = currentGender === 'male' ? t.result_cat_male : t.result_cat_female;
            } else {
                finalResult = t.result_fallback.replace("{class}", highest.className);
            }
            
            resultTitle.innerHTML = finalResult;
            labelContainer.appendChild(resultTitle);

            prediction.forEach(p => {
                const div = document.createElement("div");
                const probability = (p.probability * 100).toFixed(0);
                
                div.style.padding = "12px";
                div.style.background = "var(--list-item-bg)";
                div.style.borderRadius = "10px";
                div.style.marginBottom = "8px";
                div.style.display = "flex";
                div.style.justifyContent = "space-between";
                div.style.fontWeight = "600";
                
                div.innerHTML = `<span>${p.className}</span> <span>${probability}%</span>`;
                
                if (p.className === highest.className) {
                    div.style.color = 'var(--primary-color)';
                    div.style.boxShadow = "inset 0 0 0 2px var(--primary-color)";
                }
                labelContainer.appendChild(div);
            });
        } catch (err) {
            console.error("Prediction error:", err);
            labelContainer.innerHTML = `<div class='error'>${translations[currentLang].error_prediction}</div>`;
        }
    }

    // Guide Modal Rollover Logic
    let isHovering = false;
    const showGuide = () => { isHovering = true; guideModal.classList.remove('hidden'); };
    const hideGuide = () => {
        isHovering = false;
        setTimeout(() => { if (!isHovering) guideModal.classList.add('hidden'); }, 100);
    };

    guideTrigger.addEventListener('mouseenter', showGuide);
    guideTrigger.addEventListener('mouseleave', hideGuide);
    guideModal.addEventListener('mouseenter', showGuide);
    guideModal.addEventListener('mouseleave', hideGuide);
});