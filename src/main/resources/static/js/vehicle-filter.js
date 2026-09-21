(function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.vehicle-card'));
    var fuelTabs = document.getElementById('fuelTabs');
    var currentType = 'all';
    var currentFuel = 'all';

    function cardType(c) {
        return (c.getAttribute('data-type') || '').toUpperCase();
    }

    function cardFuel(c) {
        var f = (c.getAttribute('data-fuel') || '').trim();
        return f ? f.toLowerCase() : 'unknown';
    }

    function fuelOptions() {
        var set = [];
        cards.forEach(function (c) {
            if (currentType === 'all' || cardType(c) === currentType) {
                var f = cardFuel(c);
                if (set.indexOf(f) === -1) set.push(f);
            }
        });
        return set;
    }

    function renderFuelTabs(list) {
        if (!fuelTabs) return;
        fuelTabs.innerHTML = '<span class="filter-label">Fuel</span>';

        var all = document.createElement('button');
        all.type = 'button';
        all.className = 'filter-btn fuel-btn' + (currentFuel === 'all' ? ' active' : '');
        all.setAttribute('data-fuel', 'all');
        all.textContent = 'All';
        all.onclick = function () { setFuel('all'); };
        fuelTabs.appendChild(all);

        list.forEach(function (f) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'filter-btn fuel-btn' + (currentFuel === f ? ' active' : '');
            b.setAttribute('data-fuel', f);
            b.textContent = f.charAt(0).toUpperCase() + f.slice(1);
            b.onclick = function () { setFuel(f); };
            fuelTabs.appendChild(b);
        });
    }

    function applyFilter() {
        cards.forEach(function (c) {
            var matchType = currentType === 'all' || cardType(c) === currentType;
            var matchFuel = currentType === 'all' || currentFuel === 'all' || cardFuel(c) === currentFuel;
            c.classList.toggle('hidden', !(matchType && matchFuel));
        });
    }

    function setType(type) {
        currentType = type;
        currentFuel = 'all';
        var btns = document.querySelectorAll('.type-btn');
        btns.forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-filter') === type);
        });
        renderFuelTabs(fuelOptions());
        applyFilter();
    }

    function setFuel(fuel) {
        currentFuel = fuel;
        var btns = document.querySelectorAll('.fuel-tabs .filter-btn');
        btns.forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-fuel') === fuel);
        });
        applyFilter();
    }

    window.filterVehicles = setType;
    window.selectFuel = setFuel;

    renderFuelTabs(fuelOptions());
    applyFilter();
})();