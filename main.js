const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { exec, execSync } = require('child_process');

let mainWindow;
let cachedVersions = null;

const GITHUB_API = 'https://api.github.com/repos/kustom346-ops/AquaMCLAUCNHER/releases/latest';
const minecraftPath = path.join(app.getPath('appData'), 'AquaMC-Minecraft', '.minecraft');
const versionsPath = path.join(minecraftPath, 'versions');
const minecraftZipUrl = 'https://www.dropbox.com/scl/fi/jbwtgngujkfs89dal5fob/minecraft2.zip?rlkey=wdr0ck1cw3l8uj25yxcsx09o8&st=6plfns8c&dl=1';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 650,
        resizable: true,
        frame: false,
        transparent: false,
        backgroundColor: '#08040f',
        titleBarStyle: 'hidden',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    mainWindow.maximize();
    mainWindow.on('closed', () => { mainWindow = null; });
}

function sendToWindow(channel, data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
    }
}

// ============ СКАЧИВАНИЕ ============
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        let totalSize = 0;
        let downloadedSize = 0;
        let firstChunk = null;

        function makeRequest(requestUrl, redirects = 0) {
            if (redirects > 10) { reject(new Error('Слишком много редиректов')); return; }

            const protocol = requestUrl.startsWith('https') ? https : http;
            const req = protocol.get(requestUrl, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    response.destroy();
                    makeRequest(response.headers.location, redirects + 1);
                    return;
                }
                if (response.statusCode !== 200) { reject(new Error('Ошибка HTTP ' + response.statusCode)); return; }

                totalSize = parseInt(response.headers['content-length'] || 0);

                response.on('data', (chunk) => {
                    if (!firstChunk) firstChunk = chunk.slice(0, 4);
                    downloadedSize += chunk.length;
                    file.write(chunk);
                    if (totalSize > 0) {
                        const progress = Math.round((downloadedSize / totalSize) * 100);
                        sendToWindow('launcher:downloadProgress', {
                            progress: progress,
                            status: `Скачивание... ${(downloadedSize / 1024 / 1024).toFixed(1)} MB / ${(totalSize / 1024 / 1024).toFixed(1)} MB`
                        });
                    }
                });

                response.on('end', () => {
                    file.end();
                    if (firstChunk && firstChunk.toString('hex').substring(0, 4) !== '504b') {
                        try { fs.unlinkSync(destPath); } catch(e) {}
                        reject(new Error('Файл не ZIP'));
                        return;
                    }
                    resolve();
                });

                response.on('error', (err) => { file.close(); try { fs.unlinkSync(destPath); } catch(e) {} reject(err); });
            });

            req.on('error', (err) => { file.close(); try { fs.unlinkSync(destPath); } catch(e) {} reject(err); });
            req.end();
        }

        makeRequest(url);
    });
}

// ============ СКАНИРОВАНИЕ ВЕРСИЙ ============
function scanVersions() {
    try {
        if (!fs.existsSync(versionsPath)) return [];
        const folders = fs.readdirSync(versionsPath, { withFileTypes: true });
        const versions = [];

        folders.forEach(folder => {
            if (folder.isDirectory()) {
                const versionFolder = path.join(versionsPath, folder.name);
                const files = fs.readdirSync(versionFolder);
                const jarFile = files.find(f => f.endsWith('.jar'));
                if (jarFile) {
                    let info = {
                        id: folder.name, name: folder.name, type: 'release', date: '—',
                        size: (fs.statSync(path.join(versionFolder, jarFile)).size / 1024 / 1024).toFixed(1) + ' MB',
                        installed: true
                    };
                    const jsonFile = path.join(versionFolder, folder.name + '.json');
                    if (fs.existsSync(jsonFile)) {
                        try {
                            const d = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
                            info.type = d.type || 'release';
                            if (d.releaseTime) info.date = new Date(d.releaseTime).toLocaleDateString('ru-RU');
                        } catch(e) {}
                    }
                    versions.push(info);
                }
            }
        });
        return versions;
    } catch(e) { return []; }
}

// ============ ПОИСК JAVA ============
function findJava() {
    function searchDir(dir, depth = 0) {
        if (depth > 4) return null;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) { const r = searchDir(fullPath, depth + 1); if (r) return r; }
                else if (entry.name.toLowerCase() === 'javaw.exe') return fullPath;
            }
        } catch(e) {}
        return null;
    }
    const javaDir = 'C:\\Program Files\\Java';
    if (fs.existsSync(javaDir)) { const f = searchDir(javaDir); if (f) return f; }
    try { const r = execSync('where javaw 2>nul', { encoding: 'utf8' }); if (r.trim()) return r.trim().split('\n')[0].trim(); } catch(e) {}
    try { const r = execSync('where java 2>nul', { encoding: 'utf8' }); if (r.trim()) return r.trim().split('\n')[0].trim(); } catch(e) {}
    return null;
}

// ============ ЗАГРУЗКА MINECRAFT ============
ipcMain.handle('launcher:download', async () => {
    try {
        const existing = scanVersions();
        if (existing.length > 0) {
            sendToWindow('launcher:log', 'Minecraft уже установлен.');
            sendToWindow('launcher:downloadProgress', { progress: 100, status: 'Уже установлен' });
            cachedVersions = existing;
            return { success: true, versions: existing, alreadyInstalled: true };
        }

        const baseDir = path.join(app.getPath('appData'), 'AquaMC-Minecraft');
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

        sendToWindow('launcher:log', 'Скачиваем Minecraft...');
        sendToWindow('launcher:downloadProgress', { progress: 0, status: 'Начинаем загрузку...' });

        const zipPath = path.join(baseDir, 'minecraft_temp.zip');
        await downloadFile(minecraftZipUrl, zipPath);

        sendToWindow('launcher:downloadProgress', { progress: 100, status: 'Распаковка...' });
        await new Promise((resolve, reject) => {
            exec(`Expand-Archive -Path "${zipPath}" -DestinationPath "${baseDir}" -Force`, { shell: 'powershell.exe' }, (e) => e ? reject(e) : resolve());
        });

        try { fs.unlinkSync(zipPath); } catch(e) {}

        sendToWindow('launcher:log', 'Готово!');
        cachedVersions = null;
        const versions = scanVersions();
        cachedVersions = versions;
        return { success: true, versions: versions, alreadyInstalled: false };
    } catch(e) {
        sendToWindow('launcher:error', e.message);
        return { success: false, error: e.message };
    }
});

// ============ ЗАПУСК MINECRAFT ============
ipcMain.handle('launcher:launch', async (event, options) => {
    const { version, username } = options;
    try {
        const versionFolder = path.join(versionsPath, version);
        if (!fs.existsSync(versionFolder)) throw new Error('Версия не найдена');
        const jarFile = path.join(versionFolder, version + '.jar');
        if (!fs.existsSync(jarFile)) throw new Error('JAR не найден');
        const javaPath = findJava();
        if (!javaPath) throw new Error('Java не найдена');

        const nativesPath = path.join(versionFolder, 'natives');
        const librariesPath = path.join(minecraftPath, 'libraries');
        const assetsPath = path.join(minecraftPath, 'assets');
        let classpath = jarFile;

        function addJars(dir) {
            if (!fs.existsSync(dir)) return;
            fs.readdirSync(dir, { withFileTypes: true }).forEach(item => {
                const fp = path.join(dir, item.name);
                if (item.isDirectory()) addJars(fp);
                else if (item.name.endsWith('.jar')) classpath += ';' + fp;
            });
        }
        addJars(librariesPath);

        const cmd = `"${javaPath}" -Xmx4G -Xms2G -Djava.library.path="${nativesPath}" -cp "${classpath}" net.minecraft.client.main.Main --username ${username} --version ${version} --gameDir "${minecraftPath}" --assetsDir "${assetsPath}" --assetIndex 1.16 --accessToken 0 --uuid 0 --userType mojang --versionType release`;

        const child = exec(cmd, { cwd: minecraftPath });
        child.stdout.on('data', d => sendToWindow('launcher:log', d.toString()));
        child.stderr.on('data', d => sendToWindow('launcher:log', d.toString()));
        child.on('close', code => sendToWindow('launcher:exit', code));
        child.on('error', err => sendToWindow('launcher:error', err.message));

        setTimeout(() => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize(); }, 3000);
        return { success: true };
    } catch(e) {
        sendToWindow('launcher:error', e.message);
        return { success: false, error: e.message };
    }
});

// ============ АВТООБНОВЛЕНИЕ ============
ipcMain.handle('launcher:checkUpdate', async () => {
    try {
        const result = await new Promise((resolve, reject) => {
            https.get(GITHUB_API, {
                headers: { 'User-Agent': 'AquaMC-Launcher', 'Accept': 'application/vnd.github.v3+json' }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
                });
            }).on('error', reject);
        });

        const latestVersion = result.tag_name.replace('v', '');
        const currentVersion = app.getVersion();

        if (latestVersion !== currentVersion) {
            return {
                updateAvailable: true,
                currentVersion: currentVersion,
                newVersion: latestVersion,
                changes: result.body ? result.body.split('\n').filter(l => l.trim()) : [],
                downloadUrl: result.assets?.[0]?.browser_download_url || result.zipball_url
            };
        }
        return { updateAvailable: false };
    } catch(e) {
        return { updateAvailable: false };
    }
});

// ============ БАЗОВЫЕ IPC ============
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.handle('shell:openExternal', (e, url) => shell.openExternal(url));
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('launcher:getVersions', () => scanVersions());
ipcMain.handle('launcher:getNews', () => [
    { id: 1, title: 'AquaMC Start Recovery', date: '2026-05-12', content: 'Сезон: Восстановление.', tags: ['Update', 'Season'] }
]);
ipcMain.handle('launcher:getAccounts', () => [
    { id: 1, username: 'VoidWalker', uuid: 'a1b2c3...', type: 'premium', active: true },
    { id: 2, username: 'AquaPlayer', uuid: 'd4e5f6...', type: 'cracked', active: false }
]);

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });