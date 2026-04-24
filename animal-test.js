document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const labelContainer = document.getElementById('label-container');

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

    // Teachable Machine Logic
    const URL = "https://teachablemachine.withgoogle.com/models/e3Nj0fnrJ/";
    let tmModel, maxPredictions;
    let isModelLoading = false;

    async function loadModel() {
        if (tmModel || isModelLoading) return;
        isModelLoading = true;
        labelContainer.innerHTML = "<div>모델을 불러오는 중입니다...</div>";
        try {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";
            tmModel = await tmImage.load(modelURL, metadataURL);
            maxPredictions = tmModel.getTotalClasses();
            labelContainer.innerHTML = "";
        } catch (e) {
            console.error(e);
            labelContainer.innerHTML = "<div>모델 로딩에 실패했습니다.</div>";
        } finally {
            isModelLoading = false;
        }
    }

    async function predictImage() {
        if (!tmModel) {
            await loadModel();
        }
        if (!tmModel) return; // failed to load

        labelContainer.innerHTML = "<div>분석 중...</div>";
        
        // Predict takes an HTMLImageElement
        const prediction = await tmModel.predict(imagePreview);
        
        labelContainer.innerHTML = "";
        for (let i = 0; i < maxPredictions; i++) {
            const div = document.createElement("div");
            const probability = (prediction[i].probability * 100).toFixed(0);
            div.innerHTML = `${prediction[i].className}: ${probability}%`;
            // Highlight the highest probability
            if (prediction[i].probability > 0.5) {
                div.style.color = 'var(--primary-color)';
                div.style.fontWeight = '800';
            }
            labelContainer.appendChild(div);
        }
    }

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreviewContainer.classList.remove('hidden');
                
                // Wait for image to load in DOM before predicting
                imagePreview.onload = () => {
                    predictImage();
                }
            };
            reader.readAsDataURL(file);
        }
    });
});