/**
 * Global Search Component with Lunr.js
 * Supports local (current page) and global (site-wide) search
 */

class SearchComponent {
    constructor(config = {}) {
        this.containerId = config.containerId || 'search-container';
        this.searchIndexUrl = config.searchIndexUrl || '/search-index.json';
        this.localData = config.localData || null;
        this.currentSection = config.section || 'global';
        this.placeholder = config.placeholder || 'חפש...';
        this.rtl = config.rtl !== undefined ? config.rtl : true;
        
        this.searchIndex = null;
        this.searchData = null;
        this.lunrIndex = null;
        this.isGlobalSearch = true;
        
        this.init();
    }

    async init() {
        await this.loadSearchIndex();
        this.render();
        this.attachEventListeners();
    }

    async loadSearchIndex() {
        try {
            const response = await fetch(this.searchIndexUrl);
            this.searchData = await response.json();
            // No longer building Lunr index - using simple search instead
        } catch (error) {
            console.error('Failed to load search index:', error);
            this.searchData = { pages: [] };
        }
    }

    buildLunrIndex() {
        // Build Lunr index with support for Hebrew and English
        const searchData = this.searchData;
        this.lunrIndex = lunr(function() {
            this.ref('id');
            this.field('title', { boost: 10 });
            this.field('titleEnglish', { boost: 10 });
            this.field('content', { boost: 5 });
            this.field('tags', { boost: 8 });
            
            searchData.pages.forEach(page => {
                this.add(page);
            }, this);
        });
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Search container not found');
            return;
        }

        const html = `
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="${this.placeholder}"
                    id="search-input"
                    autocomplete="off"
                >
                <div class="search-scope-toggle">
                    <button class="search-scope-btn" data-scope="local" id="search-scope-local">
                        ${this.rtl ? 'דף זה' : 'This Page'}
                    </button>
                    <button class="search-scope-btn active" data-scope="global" id="search-scope-global">
                        ${this.rtl ? 'כל האתר' : 'Entire Site'}
                    </button>
                </div>
            </div>
            <div class="search-results" id="search-results"></div>
        `;

        container.innerHTML = html;
    }

    attachEventListeners() {
        const searchInput = document.getElementById('search-input');
        const scopeButtons = document.querySelectorAll('.search-scope-btn');
        const searchResults = document.getElementById('search-results');

        // Search input
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Click outside to close results
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.remove('active');
            }
        });

        // Scope toggle
        scopeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                scopeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.isGlobalSearch = e.target.dataset.scope === 'global';
                
                // Re-run search if there's a query
                const query = searchInput.value;
                if (query) {
                    this.handleSearch(query);
                }
            });
        });
    }

    handleSearch(query) {
        const searchResults = document.getElementById('search-results');
        
        if (!query || query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }

        const results = this.performSearch(query);
        this.displayResults(results, query);
    }

    performSearch(query) {
        if (!this.searchData) {
            return [];
        }

        try {
            const lowerQuery = query.toLowerCase().trim();
            let results = [];

            // Simple text search that works with Hebrew and English
            this.searchData.pages.forEach(page => {
                const searchableText = `
                    ${page.title || ''} 
                    ${page.titleEnglish || ''} 
                    ${page.content || ''} 
                    ${(page.tags || []).join(' ')}
                `.toLowerCase();

                if (searchableText.includes(lowerQuery)) {
                    // Calculate relevance score
                    let score = 0;
                    if ((page.title || '').toLowerCase().includes(lowerQuery)) score += 10;
                    if ((page.titleEnglish || '').toLowerCase().includes(lowerQuery)) score += 10;
                    if ((page.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))) score += 8;
                    if ((page.content || '').toLowerCase().includes(lowerQuery)) score += 5;

                    results.push({
                        ...page,
                        score: score
                    });
                }
            });

            // Sort by score
            results.sort((a, b) => b.score - a.score);

            // Filter by section if local search
            if (!this.isGlobalSearch && this.currentSection !== 'global') {
                results = results.filter(r => r.section === this.currentSection);
            }

            // If local data is provided for local search, use it
            if (!this.isGlobalSearch && this.localData) {
                results = this.searchLocalData(query);
            }

            return results.slice(0, 10); // Limit to 10 results
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    searchLocalData(query) {
        // Simple local search for local data
        if (!this.localData) return [];
        
        const lowerQuery = query.toLowerCase().trim();
        return this.localData.filter(item => {
            const searchText = `
                ${item.title || ''} 
                ${item.titleEnglish || ''} 
                ${item.description || ''} 
                ${item.content || ''} 
                ${(item.tags || []).join(' ')}
            `.toLowerCase();
            return searchText.includes(lowerQuery);
        }).map((item, index) => ({
            ...item,
            score: 1,
            // Create a URL if not present
            url: item.url || `#${item.id}`
        }));
    }

    displayResults(results, query) {
        const searchResults = document.getElementById('search-results');
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    ${this.rtl ? 'לא נמצאו תוצאות עבור' : 'No results found for'} "${query}"
                </div>
            `;
            searchResults.classList.add('active');
            return;
        }

        const scope = this.isGlobalSearch ? 
            (this.rtl ? 'כל האתר' : 'Entire Site') : 
            (this.rtl ? 'דף זה' : 'This Page');

        let html = `
            <div class="search-results-header">
                ${results.length} ${this.rtl ? 'תוצאות ב' : 'results in'} ${scope}
            </div>
        `;

        results.forEach(result => {
            const url = result.url || '#';
            const title = this.rtl ? result.title : (result.titleEnglish || result.title);
            const description = result.description || this.truncateContent(result.content, 100);
            const tags = result.tags || [];

            html += `
                <a href="${url}" class="search-result-item">
                    <div class="search-result-title">${title}</div>
                    ${description ? `<div class="search-result-description">${description}</div>` : ''}
                    ${tags.length > 0 ? `
                        <div class="search-result-tags">
                            ${tags.slice(0, 3).map(tag => `<span class="search-result-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </a>
            `;
        });

        searchResults.innerHTML = html;
        searchResults.classList.add('active');
    }

    truncateContent(content, maxLength) {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    }

    // Static method to initialize search on a page
    static initialize(config = {}) {
        // Wait for DOM and Lunr.js to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                new SearchComponent(config);
            });
        } else {
            new SearchComponent(config);
        }
    }
}

// Make it globally available
window.SearchComponent = SearchComponent;
