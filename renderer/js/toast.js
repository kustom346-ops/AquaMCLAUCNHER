// ============ ТОСТ-УВЕДОМЛЕНИЯ ============

class ToastManager {
    constructor() {
        this.container = null;
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(type, title, message, duration = 4000) {
        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            info: 'fa-circle-info',
            warning: 'fa-triangle-exclamation'
        };

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon ${type}">
                <i class="fa-solid ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Закрытие по кнопке
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Автоматическое удаление
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

const toasts = new ToastManager();

function showToast(type, title, message, duration) {
    toasts.show(type, title, message, duration);
}