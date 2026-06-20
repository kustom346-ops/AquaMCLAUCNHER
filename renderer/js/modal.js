// Ждём загрузки DOM и создаём модалку
document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = 
        '<div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title" id="modalTitle"></div>' +
                '<button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="modal-body" id="modalBody"></div>' +
        '</div>';
    document.body.appendChild(overlay);

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});

function openModal(title, content, icon) {
    document.getElementById('modalTitle').innerHTML = '<i class="' + (icon || 'fa-solid fa-right-to-bracket') + '"></i> ' + title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
}

// Глобальная функция показа окна авторизации
window.showAuthModal = function() {
    var content = 
        '<button class="auth-btn microsoft" onclick="window.microsoftLogin()">' +
            '<i class="fa-brands fa-microsoft"></i> Войти через Microsoft' +
        '</button>' +
        '<div class="auth-divider">или</div>' +
        '<button class="auth-btn offline" onclick="window.toggleOfflineForm()">' +
            '<i class="fa-solid fa-user"></i> Оффлайн режим' +
        '</button>' +
        '<div class="offline-form hidden" id="offlineForm">' +
            '<input type="text" placeholder="Введите никнейм" id="offlineNickname" maxlength="16">' +
            '<button class="auth-submit" onclick="window.offlineLogin()">' +
                '<i class="fa-solid fa-right-to-bracket"></i> Войти' +
            '</button>' +
        '</div>';

    openModal('Авторизация', content, 'fa-solid fa-right-to-bracket');
};

window.toggleOfflineForm = function() {
    var form = document.getElementById('offlineForm');
    if (form) form.classList.toggle('hidden');
};

window.microsoftLogin = function() {
    closeModal();
    setTimeout(function() {
        addAccount('VoidWalker', 'premium');
        if (typeof showToast === 'function') showToast('success', 'Успех', 'Аккаунт VoidWalker добавлен!');
    }, 1000);
};

window.offlineLogin = function() {
    var input = document.getElementById('offlineNickname');
    if (!input) return;
    var nickname = input.value.trim();
    if (nickname.length < 3) {
        if (typeof showToast === 'function') showToast('error', 'Ошибка', 'Никнейм от 3 до 16 символов');
        return;
    }
    closeModal();
    addAccount(nickname, 'offline');
    if (typeof showToast === 'function') showToast('success', 'Успех', 'Аккаунт ' + nickname + ' добавлен!');
};

function addAccount(username, type) {
    document.getElementById('sidebarUsername').textContent = username;
    document.getElementById('sidebarSkin').src = 'https://mc-heads.net/avatar/' + username + '/64';

    var grid = document.getElementById('accountsGrid');
    if (grid) {
        grid.querySelectorAll('.account-card').forEach(function(c) {
            c.classList.remove('active');
            var b = c.querySelector('.account-badge');
            if (b) b.remove();
        });

        var card = document.createElement('div');
        card.className = 'account-card active';
        card.setAttribute('data-username', username);
        card.innerHTML = 
            '<img class="account-avatar" src="https://mc-heads.net/avatar/' + username + '/64" alt="' + username + '">' +
            '<div class="account-info">' +
                '<span class="account-username">' + username + '</span>' +
                '<span class="account-uuid">' + (type === 'premium' ? 'generated-uuid' : 'offline-uuid') + '</span>' +
                '<span class="account-type ' + type + '">' + type.toUpperCase() + '</span>' +
            '</div>' +
            '<div class="account-badge">ACTIVE</div>';
        
        card.addEventListener('click', function() {
            var name = this.getAttribute('data-username');
            document.getElementById('sidebarUsername').textContent = name;
            document.getElementById('sidebarSkin').src = 'https://mc-heads.net/avatar/' + name + '/64';
            grid.querySelectorAll('.account-card').forEach(function(c) {
                c.classList.remove('active');
                var b = c.querySelector('.account-badge');
                if (b) b.remove();
            });
            this.classList.add('active');
            var badge = document.createElement('div');
            badge.className = 'account-badge';
            badge.textContent = 'ACTIVE';
            this.appendChild(badge);
        });

        grid.appendChild(card);
    }
}