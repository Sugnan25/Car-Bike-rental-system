/**
 * Car & Bike Rental - Comprehensive Search, Filter, and Sort Engine
 */
(function () {
    var searchInput = document.getElementById('vehicleSearchInput');
    var clearSearchBtn = document.getElementById('clearSearchBtn');
    var typeButtons = document.querySelectorAll('.type-filter-btn');
    var fuelSelect = document.getElementById('fuelFilterSelect');
    var seatSelect = document.getElementById('seatFilterSelect');
    var priceRange = document.getElementById('priceRangeSlider');
    var priceDisplay = document.getElementById('priceRangeDisplay');
    var sortSelect = document.getElementById('sortBySelect');
    var resultCountEl = document.getElementById('resultsCountBadge');
    var noResultsBox = document.getElementById('noResultsBox');
    var resetAllBtn = document.getElementById('resetFiltersBtn');
    var gridContainer = document.querySelector('.vehicles-grid');

    var currentType = 'all';

    function getCards() {
        return Array.prototype.slice.call(document.querySelectorAll('.vehicle-card'));
    }

    function applyFilters() {
        var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        var selectedFuel = fuelSelect ? fuelSelect.value.toLowerCase() : 'all';
        var selectedSeat = seatSelect ? seatSelect.value : 'all';
        var maxPrice = priceRange ? parseFloat(priceRange.value) : 999;
        var sortBy = sortSelect ? sortSelect.value : 'recommended';

        if (clearSearchBtn) {
            clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        var cards = getCards();
        var visibleCount = 0;

        cards.forEach(function (card) {
            var type = (card.getAttribute('data-type') || '').toLowerCase();
            var fuel = (card.getAttribute('data-fuel') || '').toLowerCase();
            var seats = parseInt(card.getAttribute('data-seats') || '0', 10);
            var price = parseFloat(card.getAttribute('data-price') || '0');
            var textContent = (card.textContent || '').toLowerCase();

            var matchesSearch = !query || textContent.includes(query);
            var matchesType = currentType === 'all' || type === currentType.toLowerCase();
            var matchesFuel = selectedFuel === 'all' || fuel === selectedFuel;
            var matchesSeat = selectedSeat === 'all' || 
                              (selectedSeat === '2' && seats === 2) ||
                              (selectedSeat === '4' && seats === 4) ||
                              (selectedSeat === '5' && seats >= 5);
            var matchesPrice = isNaN(price) || price === 0 || price <= maxPrice;

            var isVisible = matchesSearch && matchesType && matchesFuel && matchesSeat && matchesPrice;
            if (isVisible) {
                card.classList.remove('hidden');
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.classList.add('hidden');
                card.style.display = 'none';
            }
        });

        // Sorting visible cards
        if (gridContainer && cards.length > 0) {
            var sortedCards = cards.slice().sort(function (a, b) {
                var priceA = parseFloat(a.getAttribute('data-price') || '0');
                var priceB = parseFloat(b.getAttribute('data-price') || '0');
                var ratingA = parseFloat(a.getAttribute('data-rating') || '0');
                var ratingB = parseFloat(b.getAttribute('data-rating') || '0');
                var tripsA = parseInt(a.getAttribute('data-trips') || '0', 10);
                var tripsB = parseInt(b.getAttribute('data-trips') || '0', 10);

                if (sortBy === 'price_asc') return priceA - priceB;
                if (sortBy === 'price_desc') return priceB - priceA;
                if (sortBy === 'rating') return ratingB - ratingA;
                if (sortBy === 'trips') return tripsB - tripsA;
                return 0; // default order
            });

            sortedCards.forEach(function (c) {
                gridContainer.appendChild(c);
            });
        }

        // Update result badge
        if (resultCountEl) {
            resultCountEl.textContent = visibleCount + ' Vehicle' + (visibleCount === 1 ? '' : 's') + ' Available';
        }

        // Handle empty search result
        if (noResultsBox) {
            noResultsBox.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    function resetFilters() {
        if (searchInput) searchInput.value = '';
        currentType = 'all';
        typeButtons.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
        });
        if (fuelSelect) fuelSelect.value = 'all';
        if (seatSelect) seatSelect.value = 'all';
        if (priceRange) {
            priceRange.value = priceRange.max || '30';
            if (priceDisplay) priceDisplay.textContent = 'Up to ₹' + priceRange.value + '/km';
        }
        if (sortSelect) sortSelect.value = 'recommended';
        applyFilters();
    }

    // Attach event listeners
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function () {
            searchInput.value = '';
            applyFilters();
            searchInput.focus();
        });
    }

    typeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            typeButtons.forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentType = this.getAttribute('data-filter') || 'all';
            applyFilters();
        });
    });

    if (fuelSelect) fuelSelect.addEventListener('change', applyFilters);
    if (seatSelect) seatSelect.addEventListener('change', applyFilters);
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);

    if (priceRange) {
        priceRange.addEventListener('input', function () {
            if (priceDisplay) priceDisplay.textContent = 'Up to ₹' + this.value + '/km';
            applyFilters();
        });
    }

    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', resetFilters);
    }

    window.filterVehicles = function (type) {
        currentType = type;
        typeButtons.forEach(function (b) {
            b.classList.toggle('active', (b.getAttribute('data-filter') || '').toUpperCase() === type.toUpperCase());
        });
        applyFilters();
    };

    window.resetSearchAndFilters = resetFilters;

    // Initial run
    applyFilters();
})();
