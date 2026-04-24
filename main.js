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
    const langToggle = document.getElementById('lang-toggle');
    const contactToggle = document.getElementById('contact-toggle');
    const contactSection = document.getElementById('contact-section');
    const closeContactBtn = document.getElementById('close-contact');
    const guideTrigger = document.getElementById('guide-trigger');
    const guideModal = document.getElementById('guide-modal');

    let menus = JSON.parse(localStorage.getItem('menus')) || [];
    
    // Language logic
    let currentLang = localStorage.getItem('lang') || 'ko';
    applyTranslations(currentLang);

    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'ko' ? 'en' : 'ko';
        localStorage.setItem('lang', currentLang);
        applyTranslations(currentLang);
        renderList(); // Update delete buttons
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
                <button class="delete-btn" data-index="${index}">${translations[currentLang].delete_btn}</button>
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
            alert(translations[currentLang].alert_no_menu);
            return;
        }

        const randomIndex = Math.floor(Math.random() * menus.length);
        const selected = menus[randomIndex];
        
        selectedMenuDisplay.textContent = selected;
        resultOverlay.classList.remove('hidden');
    };

    const reset = () => {
        if (confirm(translations[currentLang].confirm_reset)) {
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

    // Close result overlay when clicking outside
    resultOverlay.addEventListener('click', (e) => {
        if (e.target === resultOverlay) {
            resultOverlay.classList.add('hidden');
        }
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

    // Guide Modal Rollover Logic
    let isHovering = false;

    const showGuide = () => {
        isHovering = true;
        guideModal.classList.remove('hidden');
    };

    const hideGuide = () => {
        isHovering = false;
        setTimeout(() => {
            if (!isHovering) {
                guideModal.classList.add('hidden');
            }
        }, 100);
    };

    guideTrigger.addEventListener('mouseenter', showGuide);
    guideTrigger.addEventListener('mouseleave', hideGuide);
    
    // Also keep visible when hovering over the modal content itself
    guideModal.addEventListener('mouseenter', showGuide);
    guideModal.addEventListener('mouseleave', hideGuide);

    renderList();
});