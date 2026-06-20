// ============ КОНСОЛЬ ЛАУНЧЕРА ============

class LauncherConsole {
    constructor() {
        this.lines = [];
        this.container = null;
        this.stats = { info: 0, warn: 0, error: 0 };
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        this.lines.push({ timestamp, message, type });
        this.stats[type === 'warning' ? 'warn' : type]++;
        this.render();
    }

    info(msg) { this.log(msg, 'info'); }
    success(msg) { this.log(msg, 'success'); }
    error(msg) { this.log(msg, 'error'); }
    warn(msg) { this.log(msg, 'warning'); }
    debug(msg) { this.log(msg, 'debug'); }

    clear() {
        this.lines = [];
        this.stats = { info: 0, warn: 0, error: 0 };
        this.render();
        showToast('info', 'Консоль', 'Логи очищены');
    }

    render() {
        if (!this.container) return;

        const statsHTML = `
            <div class="console-stats">
                <div class="console-stat"><span class="dot"></span> ${this.stats.info} info</div>
                <div class="console-stat"><span class="dot warn"></span> ${this.stats.warn} warn</div>
                <div class="console-stat"><span class="dot err"></span> ${this.stats.error} error</div>
            </div>
        `;

        const linesHTML = this.lines.slice(-100).map(l => `
            <div class="console-line ${l.type}">
                <span class="timestamp">[${l.timestamp}]</span>
                <span class="text">${l.message}</span>
            </div>
        `).join('');

        this.container.innerHTML = statsHTML + linesHTML;
        this.container.scrollTop = this.container.scrollHeight;
    }

    executeCommand(cmd) {
        this.log(`> ${cmd}`, 'debug');
        
        switch(cmd.toLowerCase()) {
            case 'help':
                this.info('Доступные команды: help, clear, version, status, exit');
                break;
            case 'clear':
                this.clear();
                break;
            case 'version':
                this.info('AquaMC Launcher v2.4.1 | Electron 28.1.0 | Node.js 18.17.1');
                break;
            case 'status':
                this.warn('Сервер: Оффлайн | Сезон: Восстановление');
                this.info('Лаунчер: Стабильно | RAM: 4 GB | Java: 17');
                break;
            default:
                this.error(`Неизвестная команда: ${cmd}. Введите help для списка команд.`);
        }
    }
}

const launcherConsole = new LauncherConsole();