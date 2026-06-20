function initSettingsPage() {
    // ============ ТАБЫ ============
    const tabs = document.querySelectorAll('.settings-tab');
    const contents = document.querySelectorAll('.settings-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            
            const targetContent = document.getElementById('tab-' + targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // ============ RAM СЛАЙДЕРЫ ============
    const ramSlider = document.getElementById('ramSlider');
    const ramValue = document.getElementById('ramValue');
    const ramMinSlider = document.getElementById('ramMinSlider');
    const ramMinValue = document.getElementById('ramMinValue');

    if (ramSlider && ramValue) {
        ramSlider.addEventListener('input', () => {
            ramValue.textContent = ramSlider.value + ' GB';
            const allocatedSpan = document.querySelector('.allocated-ram span');
            if (allocatedSpan) allocatedSpan.textContent = ramSlider.value + ' GB';
            
            if (ramMinSlider && parseInt(ramMinSlider.value) > parseInt(ramSlider.value)) {
                ramMinSlider.value = ramSlider.value;
                if (ramMinValue) ramMinValue.textContent = ramSlider.value + ' GB';
            }
        });
    }

    if (ramMinSlider && ramMinValue) {
        ramMinSlider.addEventListener('input', () => {
            ramMinValue.textContent = ramMinSlider.value + ' GB';
            
            if (ramSlider && parseInt(ramSlider.value) < parseInt(ramMinSlider.value)) {
                ramSlider.value = ramMinSlider.value;
                if (ramValue) ramValue.textContent = ramMinSlider.value + ' GB';
            }
        });
    }

    // ============ ТЕМЫ ============
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.theme-card').forEach(c => {
                c.classList.remove('active');
                const badge = c.querySelector('.theme-badge');
                if (badge) badge.remove();
            });
            card.classList.add('active');
            const badge = document.createElement('span');
            badge.className = 'theme-badge';
            badge.textContent = 'Активна';
            card.appendChild(badge);
        });
    });

    // ============ АКЦЕНТНЫЕ ЦВЕТА ============
    document.querySelectorAll('.accent-color').forEach(color => {
        color.addEventListener('click', () => {
            document.querySelectorAll('.accent-color').forEach(c => {
                c.classList.remove('active');
                const icon = c.querySelector('i');
                if (icon) icon.remove();
            });
            color.classList.add('active');
            const check = document.createElement('i');
            check.className = 'fa-solid fa-check';
            color.appendChild(check);
            
            document.documentElement.style.setProperty('--accent', color.dataset.color);
        });
    });

    // ============ ГРОМКОСТЬ ============
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', () => {
            volumeValue.textContent = volumeSlider.value + '%';
        });
    }

    // ============ КНОПКИ СОХРАНИТЬ ============
    document.querySelectorAll('.settings-save-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Сохранено!';
            btn.style.background = 'rgba(34, 197, 94, 0.2)';
            btn.style.borderColor = '#22c55e';
            btn.style.color = '#4ade80';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 2000);
        });
    });

    // ============ КНОПКА СБРОСА ============
    const resetBtn = document.querySelector('.settings-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Сбросить все настройки стиля к значениям по умолчанию?')) {
                resetBtn.innerHTML = '<i class="fa-solid fa-check"></i> Сброшено!';
                setTimeout(() => {
                    resetBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Сбросить к дефолту';
                }, 2000);
            }
        });
    }

    // ============ КНОПКА ОБЗОРА JAVA ============
    const btnJavaPath = document.getElementById('btnJavaPath');
    if (btnJavaPath) {
        btnJavaPath.addEventListener('click', () => {
            const label = document.getElementById('javaPathLabel');
            if (label) label.textContent = 'C:/Program Files/Java/jdk-17/bin/java.exe';
            btnJavaPath.innerHTML = '<i class="fa-solid fa-check"></i> Выбрано';
            setTimeout(() => {
                btnJavaPath.innerHTML = '<i class="fa-solid fa-folder-open"></i> Обзор';
            }, 2000);
        });
    }
}