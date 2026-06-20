const contentArea = document.getElementById('contentArea');
const navButtons = document.querySelectorAll('.nav-btn');

const pages = {
    home: 'pages/home.html',
    news: 'pages/news.html',
    versions: 'pages/versions.html',
    accounts: 'pages/accounts.html',
    console: 'pages/console.html',
    settings: 'pages/settings.html'
};

let currentPage = 'home';

async function loadPage(page) {
    try {
        const response = await fetch(pages[page]);
        let html = await response.text();
        
        // Извлекаем и выполняем скрипты
        const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
        const scripts = [];
        html = html.replace(scriptRegex, (match, code) => {
            scripts.push(code);
            return '';
        });
        
        contentArea.innerHTML = html;
        currentPage = page;

        // Выполняем скрипты
        scripts.forEach(code => {
            try {
                const fn = new Function(code);
                fn();
            } catch(e) {
                console.error('Script error:', e);
            }
        });

        navButtons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-page="${page}"]`);
        if (activeBtn) activeBtn.classList.add('active');

    } catch (error) {
        contentArea.innerHTML = '<div class="page"><h2>Ошибка загрузки</h2></div>';
    }
}

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page !== currentPage && pages[page]) {
            loadPage(page);
        }
    });
});

loadPage('home');