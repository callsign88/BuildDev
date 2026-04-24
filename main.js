document.addEventListener('DOMContentLoaded', () => {
    const menuInput = document.getElementById('menu-input');
    const addBtn = document.getElementById('add-btn');
    const menuList = document.getElementById('menu-list');
    const recommendBtn = document.getElementById('recommend-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultOverlay = document.getElementById('result-overlay');
    const selectedMenuDisplay = document.getElementById('selected-menu');
    const closeResultBtn = document.getElementById('close-result');
    const themeToggle = document.getElementById('theme-toggle');
    const contactToggle = document.getElementById('contact-toggle');
    const contactSection = document.getElementById('contact-section');
    const closeContactBtn = document.getElementById('close-contact');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const labelContainer = document.getElementById('label-container');

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

    let menus = JSON.parse(localStorage.getItem('menus')) || [];
    
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

    const addMenu = () => {
        const value = menuInput.value.trim();
        if (value && !menus.includes(value)) {
            menus.push(value);
            saveAndRender();
            menuInput.value = '';
            menuInput.focus();
        }
    };

    const deleteMenu = (index) => {
        menus.splice(index, 1);
        saveAndRender();
    };

    const saveAndRender = () => {
        localStorage.setItem('menus', JSON.stringify(menus));
        renderList();
    };

    const renderList = () => {
        menuList.innerHTML = '';
        menus.forEach((menu, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${menu}</span>
                <button class="delete-btn" data-index="${index}">삭제</button>
            `;
            menuList.appendChild(li);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = (e) => {
                const index = e.target.getAttribute('data-index');
                deleteMenu(index);
            };
        });
    };

    const recommend = () => {
        if (menus.length === 0) {
            alert('먼저 메뉴 후보를 입력해주세요!');
            return;
        }

        const randomIndex = Math.floor(Math.random() * menus.length);
        const selected = menus[randomIndex];
        
        selectedMenuDisplay.textContent = selected;
        resultOverlay.classList.remove('hidden');
    };

    const reset = () => {
        if (confirm('모든 메뉴를 초기화할까요?')) {
            menus = [];
            saveAndRender();
        }
    };

    addBtn.addEventListener('click', addMenu);
    menuInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMenu();
    });

    recommendBtn.addEventListener('click', recommend);
    resetBtn.addEventListener('click', reset);
    closeResultBtn.addEventListener('click', () => {
        resultOverlay.classList.add('hidden');
    });

    contactToggle.addEventListener('click', () => {
        contactSection.classList.remove('hidden');
    });

    closeContactBtn.addEventListener('click', () => {
        contactSection.classList.add('hidden');
    });

    // Close section when clicking outside the content
    contactSection.addEventListener('click', (e) => {
        if (e.target === contactSection) {
            contactSection.classList.add('hidden');
        }
    });

    renderList();
});