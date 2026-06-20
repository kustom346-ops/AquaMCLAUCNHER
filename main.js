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
        width: 1280, height: 800, minWidth: 1024, minHeight: 650,
        resizable: true, frame: false, transparent: false,
        backgroundColor: '#08040f', titleBarStyle: 'hidden',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false, contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    if (process.argv.includes('--dev')) mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.maximize();
    mainWindow.on('closed', () => { mainWindow = null; });
}

function sendToWindow(channel, data) {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, data);
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        let totalSize = 0, downloadedSize = 0;
        function makeRequest(requestUrl, redirects = 0) {
            if (redirects > 10) return reject(new Error('Слишком много редиректов'));
            const protocol = requestUrl.startsWith('https') ? https : http;
            protocol.get(requestUrl, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    response.destroy();
                    return makeRequest(response.headers.location, redirects + 1);
                }
                if (response.statusCode !== 200) return reject(new Error('HTTP ' + response.statusCode));
                totalSize = parseInt(response.headers['content-length'] || 0);
                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    file.write(chunk);
                    if (totalSize > 0) {
                        sendToWindow('launcher:downloadProgress', {
                            progress: Math.round((downloadedSize / totalSize) * 100),
                            status: `${(downloadedSize / 1024 / 1024).toFixed(1)} MB / ${(totalSize / 1024 / 1024).toFixed(1)} MB`
                        });
                    }
                });
                response.on('end', () => { file.end(); resolve(); });
                response.on('error', (err) => { file.close(); try { fs.unlinkSync(destPath); } catch(e) {} reject(err); });
            }).on('error', (err) => { file.close(); try { fs.unlinkSync(destPath); } catch(e) {} reject(err); });
        }
        makeRequest(url);
    });
}

function scanVersions() {
    try {
        if (!fs.existsSync(versionsPath)) return [];
        const versions = [];
        fs.readdirSync(versionsPath, { withFileTypes: true }).forEach(folder => {
            if (folder.isDirectory()) {
                const vf = path.join(versionsPath, folder.name);
                const files = fs.readdirSync(vf);
                const jar = files.find(f => f.endsWith('.jar'));
                if (jar) {
                    let info = { id: folder.name, name: folder.name, type: 'release', date: '—', size: (fs.statSync(path.join(vf, jar)).size / 1024 / 1024).toFixed(1) + ' MB', installed: true };
                    const jf = path.join(vf, folder.name + '.json');
                    if (fs.existsSync(jf)) {
                        try {
                            const d = JSON.parse(fs.readFileSync(jf, 'utf8'));
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

function findJava() {
    function searchDir(dir, depth) {
        if (depth > 4) return null;
        try {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const fp = path.join(dir, e.name);
                if (e.isDirectory()) { const r = searchDir(fp, depth + 1); if (r) return r; }
                else if (e.name.toLowerCase() === 'javaw.exe') return fp;
            }
        } catch(e) {}
        return null;
    }
    const jd = 'C:\\Program Files\\Java';
    if (fs.existsSync(jd)) { const f = searchDir(jd, 0); if (f) return f; }
    try { const r = execSync('where javaw 2>nul', { encoding: 'utf8' }); if (r.trim()) return r.trim().split('\n')[0].trim(); } catch(e) {}
    try { const r = execSync('where java 2>nul', { encoding: 'utf8' }); if (r.trim()) return r.trim().split('\n')[0].trim(); } catch(e) {}
    return null;
}

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
        sendToWindow('launcher:downloadProgress', { progress: 0, status: 'Загрузка...' });
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
        return { success: true, versions, alreadyInstalled: false };
    } catch(e) {
        sendToWindow('launcher:error', e.message);
        return { success: false, error: e.message };
    }
});

ipcMain.handle('launcher:launch', async (event, options) => {
    const { version, username } = options;
    try {
        const vf = path.join(versionsPath, version);
        if (!fs.existsSync(vf)) throw new Error('Версия не найдена');
        const jar = path.join(vf, version + '.jar');
        if (!fs.existsSync(jar)) throw new Error('JAR не найден');
        const java = findJava();
        if (!java) throw new Error('Java не найдена');
        const natives = path.join(vf, 'natives');
        const libs = path.join(minecraftPath, 'libraries');
        const assets = path.join(minecraftPath, 'assets');
        let cp = jar;
        function addJars(dir) {
            if (!fs.existsSync(dir)) return;
            fs.readdirSync(dir, { withFileTypes: true }).forEach(item => {
                const fp = path.join(dir, item.name);
                if (item.isDirectory()) addJars(fp);
                else if (item.name.endsWith('.jar')) cp += ';' + fp;
            });
        }
        addJars(libs);
        const cmd = `"${java}" -Xmx4G -Xms2G -Djava.library.path="${natives}" -cp "${cp}" net.minecraft.client.main.Main --username ${username} --version ${version} --gameDir "${minecraftPath}" --assetsDir "${assets}" --assetIndex 1.16 --accessToken 0 --uuid 0 --userType mojang --versionType release`;
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

ipcMain.handle('launcher:checkUpdate', async () => {
    try {
        const result = await new Promise((resolve, reject) => {
            https.get(GITHUB_API, { headers: { 'User-Agent': 'AquaMC-Launcher' } }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        const latest = result.tag_name.replace('v', '');
        const current = app.getVersion();

        if (latest !== current && result.assets && result.assets[0]) {
            const url = result.assets[0].browser_download_url;
            sendToWindow('launcher:downloadProgress', { progress: 0, status: 'Скачиваем обновление...' });
            const tmp = path.join(app.getPath('temp'), 'AquaMC-Update.exe');
            await downloadFile(url, tmp);
            sendToWindow('launcher:downloadProgress', { progress: 100, status: 'Установка...' });
            exec(`"${tmp}" /S`, () => { app.quit(); });
            return { updateAvailable: true, autoUpdated: true };
        }
        return { updateAvailable: false };
    } catch(e) {
        return { updateAvailable: false };
    }
});

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