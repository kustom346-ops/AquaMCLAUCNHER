document.getElementById('btnClose').addEventListener('click', () => window.electronAPI.closeWindow());
document.getElementById('btnMinimize').addEventListener('click', () => window.electronAPI.minimizeWindow());
document.getElementById('btnMaximize').addEventListener('click', async () => {
    await window.electronAPI.maximizeWindow();
    updateMaximizeIcon();
});

async function updateMaximizeIcon() {
    const isMaximized = await window.electronAPI.isMaximized();
    const icon = document.querySelector('#btnMaximize i');
    icon.className = isMaximized ? 'fa-solid fa-clone' : 'fa-solid fa-square';
}
window.addEventListener('resize', updateMaximizeIcon);

const playBtn = document.getElementById('playBtnMain');
const miniProgressFill = document.querySelector('.mini-progress-fill');
let isLaunching = false;

setTimeout(() => playBtn.classList.add('pulsing'), 2000);
playBtn.addEventListener('mouseenter', () => playBtn.classList.remove('pulsing'));
playBtn.addEventListener('mouseleave', () => {
    setTimeout(() => { if (!isLaunching) playBtn.classList.add('pulsing'); }, 2000);
});

// Логи — выводим в консоль браузера (F12) и в тосты
window.electronAPI.onLog((msg) => {
    console.log('[LAUNCHER]', msg);
});

window.electronAPI.onDownloadProgress((data) => {
    console.log('[PROGRESS]', data.status, data.progress + '%');
    if (data.progress !== undefined) {
        miniProgressFill.style.width = data.progress + '%';
    }
    if (typeof showToast === 'function') {
        showToast('info', 'Загрузка', data.status, 3000);
    }
});

window.electronAPI.onError((msg) => {
    console.error('[ERROR]', msg);
    if (typeof showToast === 'function') showToast('error', 'Ошибка', msg, 5000);
    resetLauncher();
});

window.electronAPI.onExit((code) => {
    console.log('[EXIT] Minecraft closed with code:', code);
    isLaunching = false;
    resetLauncher();
    if (typeof showToast === 'function') showToast('info', 'Minecraft', 'Игра закрыта (код: ' + code + ')', 3000);
});

playBtn.addEventListener('click', async () => {
    if (isLaunching) return;
    isLaunching = true;
    
    const versionSpan = document.querySelector('.selected-version span');
    const version = versionSpan.textContent;
    const username = document.getElementById('sidebarUsername').textContent;
    
    console.log('[PLAY] Starting with version:', version, 'username:', username);
    
    playBtn.classList.remove('pulsing');
    playBtn.disabled = true;
    miniProgressFill.style.width = '0%';
    miniProgressFill.style.background = '';
    
    const btnText = playBtn.querySelector('.play-btn-text');
    const icon = playBtn.querySelector('i');
    btnText.textContent = 'DOWNLOAD';
    icon.className = 'fa-solid fa-download fa-beat';
    
    const now = new Date();
    localStorage.setItem('aquamc-last-launch', JSON.stringify({
        date: now.toLocaleDateString('ru-RU'),
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }));
    
    try {
        console.log('[PLAY] Calling download...');
        const result = await window.electronAPI.downloadMinecraft({ version, username });
        console.log('[PLAY] Download result:', result);
        
        if (result.success) {
            if (result.versions && result.versions.length > 0) {
                versionSpan.textContent = result.versions[0].id;
                console.log('[PLAY] Available versions:', result.versions.map(v => v.id));
            }
            
            miniProgressFill.style.width = '100%';
            miniProgressFill.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
            btnText.textContent = 'LAUNCH';
            icon.className = 'fa-solid fa-rocket';
            
            console.log('[PLAY] Calling launch...');
            const launchResult = await window.electronAPI.launchMinecraft({ version, username });
            console.log('[PLAY] Launch result:', launchResult);
            
        } else {
            throw new Error(result.error || 'Ошибка загрузки');
        }
    } catch (error) {
        console.error('[PLAY] Error:', error);
        if (typeof showToast === 'function') showToast('error', 'Ошибка', error.message, 5000);
        resetLauncher();
    }
});

function resetLauncher() {
    isLaunching = false;
    playBtn.disabled = false;
    playBtn.style.background = '';
    playBtn.style.boxShadow = '';
    playBtn.querySelector('.play-btn-text').textContent = 'PLAY';
    playBtn.querySelector('i').className = 'fa-solid fa-play';
    miniProgressFill.style.width = '0%';
    miniProgressFill.style.background = '';
    miniProgressFill.style.boxShadow = '';
    setTimeout(() => playBtn.classList.add('pulsing'), 1000);
}

document.querySelector('.selected-version').addEventListener('click', () => {
    document.querySelector('[data-page="versions"]').click();
});