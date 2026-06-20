// ============ ПРОСМОТР СКИНОВ ============

function initSkinViewer(username = 'VoidWalker') {
    const skinPreview = document.getElementById('skinPreview3D');
    if (!skinPreview) return;

    // Заглушка с 2D-превью (3D через three.js можно добавить позже)
    skinPreview.innerHTML = `
        <div style="text-align:center;">
            <img src="https://visage.surgeplay.com/full/400/${username}" 
                 alt="Скин ${username}" 
                 style="width:120px; image-rendering:pixelated;"
                 id="skinPreviewImg">
            <div style="margin-top:8px; font-size:11px; color:var(--text-dim);">
                ${username}
            </div>
        </div>
    `;

    // Заполняем поле ввода
    const skinUrlInput = document.getElementById('skinUrlInput');
    if (skinUrlInput) {
        skinUrlInput.value = username;
    }

    // Кнопка загрузки по нику
    const loadSkinBtn = document.getElementById('loadSkinBtn');
    if (loadSkinBtn) {
        loadSkinBtn.addEventListener('click', () => {
            const newName = skinUrlInput.value.trim();
            if (newName) {
                document.getElementById('skinPreviewImg').src = 
                    `https://visage.surgeplay.com/full/400/${newName}`;
                showToast('success', 'Скин', `Загружен скин игрока ${newName}`);
            }
        });
    }

    // Кнопка загрузки файла
    const uploadSkinBtn = document.getElementById('uploadSkinBtn');
    if (uploadSkinBtn) {
        uploadSkinBtn.addEventListener('click', () => {
            showToast('info', 'Скин', 'Выберите PNG файл скина (64x64)');
            // В реальном приложении здесь был бы dialog.showOpenDialog()
            setTimeout(() => {
                showToast('success', 'Скин', 'Скин загружен и применён!');
            }, 1000);
        });
    }

    // Сброс скина
    const resetSkinBtn = document.getElementById('resetSkinBtn');
    if (resetSkinBtn) {
        resetSkinBtn.addEventListener('click', () => {
            document.getElementById('skinPreviewImg').src = 
                `https://visage.surgeplay.com/full/400/${username}`;
            skinUrlInput.value = username;
            showToast('info', 'Скин', 'Скин сброшен к стандартному');
        });
    }

    // Переключатель типа (скин/плащ)
    const typeButtons = document.querySelectorAll('.skin-type-btn');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const type = btn.dataset.type;
            const img = document.getElementById('skinPreviewImg');
            const name = skinUrlInput.value.trim() || username;
            
            if (type === 'skin') {
                img.src = `https://visage.surgeplay.com/full/400/${name}`;
            } else if (type === 'cape') {
                img.src = `https://visage.surgeplay.com/cape/400/${name}`;
            }
        });
    });
}