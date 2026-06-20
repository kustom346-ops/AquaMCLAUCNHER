async function initNewsPage() {
    const news = await window.electronAPI.getNews();
    const grid = document.querySelector('.news-grid');
    if (!grid || !news) return;

    grid.innerHTML = news.map(item => `
        <div class="news-card">
            <div class="news-card-image">
                <i class="fa-solid fa-newspaper"></i>
            </div>
            <div class="news-card-tags">
                ${item.tags.map(tag => `<span class="news-tag ${tag.toLowerCase()}">${tag}</span>`).join('')}
            </div>
            <div class="news-card-title">${item.title}</div>
            <div class="news-card-date">${item.date}</div>
            <div class="news-card-excerpt">${item.content}</div>
        </div>
    `).join('');
}