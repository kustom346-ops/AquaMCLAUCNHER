async function initAccountsPage() {
    const accounts = await window.electronAPI.getAccounts();
    const grid = document.querySelector('.accounts-grid');
    if (!grid || !accounts) return;

    grid.innerHTML = accounts.map(acc => `
        <div class="account-card ${acc.active ? 'active' : ''}">
            <img class="account-avatar" src="https://mc-heads.net/avatar/${acc.username}/64" alt="${acc.username}">
            <div class="account-info">
                <span class="account-username">${acc.username}</span>
                <span class="account-uuid">${acc.uuid}</span>
                <span class="account-type ${acc.type}">${acc.type.toUpperCase()}</span>
            </div>
            ${acc.active ? '<div class="account-badge">ACTIVE</div>' : ''}
        </div>
    `).join('');

    // Обработчик добавления аккаунта
    const addBtn = document.querySelector('.add-account-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            alert('Add account feature coming soon!');
        });
    }

    // Клик по карточке аккаунта
    document.querySelectorAll('.account-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.account-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const username = this.querySelector('.account-username').textContent;
            document.getElementById('sidebarUsername').textContent = username;
            document.getElementById('sidebarSkin').src = `https://mc-heads.net/avatar/${username}/64`;
        });
    });
}