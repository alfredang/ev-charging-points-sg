/**
 * EV Charging Points Singapore
 *
 * A client-side web application that displays all EV charging points
 * in Singapore on Google Maps using the LTA DataMall API.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // API endpoint - uses serverless proxy to avoid CORS issues
    API_URL: '/api/charging-points',

    // Default map center (Singapore)
    SINGAPORE_CENTER: { lat: 1.3521, lng: 103.8198 },
    DEFAULT_ZOOM: 12,
    MARKER_ZOOM: 16,

    // Marker icons - Google Maps style teardrop pins
    MARKERS: {
        available: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
                    <path fill="#16a34a" d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"/>
                    <circle fill="#166534" cx="14" cy="14" r="6"/>
                    <circle fill="white" cx="14" cy="14" r="4"/>
                </svg>
            `),
            scaledSize: { width: 28, height: 40 },
            anchor: { x: 14, y: 40 }
        },
        occupied: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
                    <path fill="#dc2626" d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"/>
                    <circle fill="#991b1b" cx="14" cy="14" r="6"/>
                    <circle fill="white" cx="14" cy="14" r="4"/>
                </svg>
            `),
            scaledSize: { width: 28, height: 40 },
            anchor: { x: 14, y: 40 }
        },
        partial: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
                    <path fill="#ea580c" d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"/>
                    <circle fill="#c2410c" cx="14" cy="14" r="6"/>
                    <circle fill="white" cx="14" cy="14" r="4"/>
                </svg>
            `),
            scaledSize: { width: 28, height: 40 },
            anchor: { x: 14, y: 40 }
        },
        unknown: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
                    <path fill="#6b7280" d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"/>
                    <circle fill="#4b5563" cx="14" cy="14" r="6"/>
                    <circle fill="white" cx="14" cy="14" r="4"/>
                </svg>
            `),
            scaledSize: { width: 28, height: 40 },
            anchor: { x: 14, y: 40 }
        },
        user: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <circle fill="#2563eb" stroke="white" stroke-width="3" cx="12" cy="12" r="8"/>
                </svg>
            `),
            scaledSize: { width: 24, height: 24 }
        }
    }
};

// =============================================================================
// GLOBAL STATE
// =============================================================================

let map = null;
let markers = [];
let chargingPoints = [];
let userLocation = null;
let userMarker = null;
let currentInfoWindow = null;
let activeCardId = null;

// =============================================================================
// DOM ELEMENTS
// =============================================================================

const elements = {
    loadingOverlay: () => document.getElementById('loading-overlay'),
    errorBanner: () => document.getElementById('error-banner'),
    errorMessage: () => document.getElementById('error-message'),
    errorClose: () => document.getElementById('error-close'),
    locationStatus: () => document.getElementById('location-status'),
    locationText: () => document.getElementById('location-text'),
    searchInput: () => document.getElementById('search-input'),
    chargingList: () => document.getElementById('charging-list'),
    totalCount: () => document.getElementById('total-count'),
    map: () => document.getElementById('map')
};

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the Google Map (called by Google Maps API callback)
 */
function initMap() {
    // Create map instance
    map = new google.maps.Map(elements.map(), {
        center: CONFIG.SINGAPORE_CENTER,
        zoom: CONFIG.DEFAULT_ZOOM,
        mapTypeControl: true,
        mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Initialize the application
    init();
}

/**
 * Main initialization function
 */
async function init() {
    // Set up event listeners
    setupEventListeners();

    // Get user location
    getUserLocation();

    // Fetch charging points data
    try {
        await fetchChargingPoints();
        hideLoading();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to load charging points. Please refresh the page.');
        hideLoading();
    }
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
    // Error banner close button
    elements.errorClose()?.addEventListener('click', hideError);

    // Search input
    elements.searchInput()?.addEventListener('input', debounce(handleSearch, 300));

    // Close info window when clicking on map
    map.addListener('click', () => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        clearActiveCard();
    });
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch all EV charging points from the LTA DataMall Batch API
 * Returns all data in a single request
 */
async function fetchChargingPoints() {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'GET',
            headers: {
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const records = data.value || [];

        // Process and store the data
        chargingPoints = processChargingPoints(records);

        // Update UI
        updateTotalCount();
        plotMarkers();
        updateSidebar();

        return chargingPoints;
    } catch (error) {
        console.error('API fetch error:', error);
        throw error;
    }
}

/**
 * Process raw API data into a normalized format
 */
function processChargingPoints(rawData) {
    return rawData.map((point, index) => {
        const lat = parseFloat(point.Latitude);
        const lng = parseFloat(point.Longitude);
        const totalLots = parseInt(point.TotalLots) || 0;
        const availableLots = parseInt(point.AvailableLots) || 0;

        return {
            id: `cp-${index}`,
            serialNumber: point.SerialNumber,
            address: point.AddressInfo || 'Unknown Location',
            postalCode: point.PostalCode || '',
            operator: point.Operator || 'Unknown Operator',
            type: point.Type || '',
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            totalLots: totalLots,
            availableLots: availableLots,
            // Compute availability status
            status: getAvailabilityStatus(availableLots, totalLots),
            // Distance will be calculated when user location is available
            distance: null
        };
    }).filter(point => point.latitude !== null && point.longitude !== null);
}

/**
 * Determine availability status based on available and total lots
 */
function getAvailabilityStatus(available, total) {
    if (total === 0 || (available === 0 && total === 0)) {
        return 'unknown';
    }
    if (available === 0) {
        return 'occupied';
    }
    if (available === total) {
        return 'available';
    }
    return 'partial';
}

// =============================================================================
// GEOLOCATION
// =============================================================================

/**
 * Get user's current location using HTML5 Geolocation API
 */
function getUserLocation() {
    if (!navigator.geolocation) {
        updateLocationStatus('Geolocation not supported', 'error');
        return;
    }

    updateLocationStatus('Detecting your location...', 'detecting');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            updateLocationStatus('Location detected', 'located');

            // Add user marker
            addUserMarker();

            // Recalculate distances and update sidebar
            calculateDistances();
            updateSidebar();

            // Center map on user location
            map.setCenter(userLocation);
        },
        (error) => {
            console.warn('Geolocation error:', error);
            let message = 'Location unavailable';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Location permission denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Location unavailable';
                    break;
                case error.TIMEOUT:
                    message = 'Location request timed out';
                    break;
            }

            updateLocationStatus(message, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

/**
 * Update the location status indicator in the sidebar
 */
function updateLocationStatus(text, status) {
    const statusEl = elements.locationStatus();
    const textEl = elements.locationText();

    if (textEl) {
        textEl.textContent = text;
    }

    if (statusEl) {
        statusEl.classList.remove('located', 'error', 'detecting');
        if (status) {
            statusEl.classList.add(status);
        }
    }
}

/**
 * Add a marker for the user's current location
 */
function addUserMarker() {
    if (!userLocation) return;

    // Remove existing user marker
    if (userMarker) {
        userMarker.setMap(null);
    }

    userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
            url: CONFIG.MARKERS.user.url,
            scaledSize: new google.maps.Size(
                CONFIG.MARKERS.user.scaledSize.width,
                CONFIG.MARKERS.user.scaledSize.height
            )
        },
        title: 'Your Location',
        zIndex: 1000
    });
}

// =============================================================================
// DISTANCE CALCULATION
// =============================================================================

/**
 * Calculate distances from user location to all charging points
 */
function calculateDistances() {
    if (!userLocation) return;

    chargingPoints.forEach(point => {
        point.distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            point.latitude,
            point.longitude
        );
    });

    // Sort by distance
    chargingPoints.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
    });
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 *
 * The Haversine formula calculates the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This is the shortest distance
 * over the earth's surface, giving an "as-the-crow-flies" distance.
 *
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers

    // Convert degrees to radians
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    // Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
function formatDistance(km) {
    if (km === null || km === undefined) {
        return '';
    }
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}

// =============================================================================
// MAP MARKERS
// =============================================================================

/**
 * Plot all charging point markers on the map
 */
function plotMarkers() {
    // Clear existing markers
    clearMarkers();

    // Create markers for each charging point
    chargingPoints.forEach(point => {
        const markerConfig = CONFIG.MARKERS[point.status] || CONFIG.MARKERS.unknown;

        const iconConfig = {
            url: markerConfig.url,
            scaledSize: new google.maps.Size(
                markerConfig.scaledSize.width,
                markerConfig.scaledSize.height
            )
        };

        // Add anchor point if defined (for proper pin positioning)
        if (markerConfig.anchor) {
            iconConfig.anchor = new google.maps.Point(
                markerConfig.anchor.x,
                markerConfig.anchor.y
            );
        }

        const marker = new google.maps.Marker({
            position: { lat: point.latitude, lng: point.longitude },
            map: map,
            icon: iconConfig,
            title: point.address,
            optimized: true
        });

        // Store reference to the charging point
        marker.chargingPointId = point.id;

        // Add click listener
        marker.addListener('click', () => {
            openInfoWindow(point, marker);
            setActiveCard(point.id);
            scrollToCard(point.id);
        });

        markers.push(marker);
    });
}

/**
 * Clear all markers from the map
 */
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

/**
 * Open info window for a charging point
 */
function openInfoWindow(point, marker) {
    // Close existing info window
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    const content = createInfoWindowContent(point);

    currentInfoWindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 300
    });

    currentInfoWindow.open(map, marker);
}

/**
 * Create HTML content for info window
 */
function createInfoWindowContent(point) {
    const statusClass = point.status;
    const statusText = getStatusText(point);

    return `
        <div class="info-window">
            <div class="info-window-title">${escapeHtml(point.address)}</div>
            <div class="info-window-content">
                ${point.postalCode ? `<p><span class="label">Postal Code</span><br>${escapeHtml(point.postalCode)}</p>` : ''}
                ${point.operator ? `<p><span class="label">Operator</span><br>${escapeHtml(point.operator)}</p>` : ''}
                ${point.type ? `<p><span class="label">Charger Type</span><br>${escapeHtml(point.type)}</p>` : ''}
                ${point.distance !== null ? `<p><span class="label">Distance</span><br>${formatDistance(point.distance)}</p>` : ''}
                <div class="info-window-availability">
                    <span class="availability-badge ${statusClass}">
                        <span class="availability-dot"></span>
                        ${statusText}
                    </span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get human-readable status text
 */
function getStatusText(point) {
    switch (point.status) {
        case 'available':
            return `${point.availableLots}/${point.totalLots} Available`;
        case 'occupied':
            return 'Fully Occupied';
        case 'partial':
            return `${point.availableLots}/${point.totalLots} Available`;
        default:
            return 'Status Unknown';
    }
}

// =============================================================================
// SIDEBAR
// =============================================================================

/**
 * Update the sidebar with charging points list
 */
function updateSidebar() {
    const listEl = elements.chargingList();
    if (!listEl) return;

    const searchTerm = elements.searchInput()?.value?.toLowerCase() || '';

    // Filter charging points based on search
    let filteredPoints = chargingPoints;
    if (searchTerm) {
        filteredPoints = chargingPoints.filter(point =>
            point.address.toLowerCase().includes(searchTerm) ||
            point.postalCode.includes(searchTerm) ||
            point.operator.toLowerCase().includes(searchTerm)
        );
    }

    // Generate HTML for cards
    if (filteredPoints.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">&#128268;</div>
                <p class="empty-state-text">
                    ${searchTerm ? 'No charging points match your search.' : 'No charging points found.'}
                </p>
            </div>
        `;
        return;
    }

    const cardsHtml = filteredPoints.map(point => createCardHtml(point)).join('');
    listEl.innerHTML = cardsHtml;

    // Add click listeners to cards
    filteredPoints.forEach(point => {
        const card = document.getElementById(point.id);
        if (card) {
            card.addEventListener('click', () => handleCardClick(point));
        }
    });
}

/**
 * Create HTML for a single charging point card
 */
function createCardHtml(point) {
    const statusClass = point.status;
    const statusText = getStatusText(point);
    const distanceText = formatDistance(point.distance);
    const isActive = activeCardId === point.id;

    return `
        <div id="${point.id}" class="charging-card ${isActive ? 'active' : ''}" data-id="${point.id}">
            <div class="card-header">
                <div class="card-name">${escapeHtml(point.address)}</div>
                ${distanceText ? `<span class="card-distance">${distanceText}</span>` : ''}
            </div>
            <div class="availability-badge ${statusClass}">
                <span class="availability-dot"></span>
                ${statusText}
            </div>
            <div class="card-details">
                ${point.postalCode ? `<span class="card-postal">&#128205; ${escapeHtml(point.postalCode)}</span>` : ''}
                ${point.operator ? `<span class="card-operator">${escapeHtml(point.operator)}</span>` : ''}
                ${point.type ? `<span class="card-type">${escapeHtml(point.type)}</span>` : ''}
            </div>
        </div>
    `;
}

/**
 * Handle click on a charging point card
 */
function handleCardClick(point) {
    // Pan and zoom map to the charging point
    map.panTo({ lat: point.latitude, lng: point.longitude });
    map.setZoom(CONFIG.MARKER_ZOOM);

    // Find the corresponding marker and open info window
    const marker = markers.find(m => m.chargingPointId === point.id);
    if (marker) {
        openInfoWindow(point, marker);
    }

    // Set active card
    setActiveCard(point.id);
}

/**
 * Set the active card in the sidebar
 */
function setActiveCard(id) {
    // Remove active class from previous card
    if (activeCardId) {
        const prevCard = document.getElementById(activeCardId);
        if (prevCard) {
            prevCard.classList.remove('active');
        }
    }

    // Add active class to new card
    activeCardId = id;
    const newCard = document.getElementById(id);
    if (newCard) {
        newCard.classList.add('active');
    }
}

/**
 * Clear active card selection
 */
function clearActiveCard() {
    if (activeCardId) {
        const card = document.getElementById(activeCardId);
        if (card) {
            card.classList.remove('active');
        }
        activeCardId = null;
    }
}

/**
 * Scroll the sidebar to show a specific card
 */
function scrollToCard(id) {
    const card = document.getElementById(id);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Update the total count display
 */
function updateTotalCount() {
    const countEl = elements.totalCount();
    if (countEl) {
        const count = chargingPoints.length;
        countEl.textContent = `${count} charging point${count !== 1 ? 's' : ''}`;
    }
}

/**
 * Handle search input
 */
function handleSearch() {
    updateSidebar();
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Show the loading overlay
 */
function showLoading() {
    const overlay = elements.loadingOverlay();
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Hide the loading overlay
 */
function hideLoading() {
    const overlay = elements.loadingOverlay();
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Show an error message
 */
function showError(message) {
    const banner = elements.errorBanner();
    const msgEl = elements.errorMessage();

    if (banner && msgEl) {
        msgEl.textContent = message;
        banner.classList.remove('hidden');
    }
}

/**
 * Hide the error banner
 */
function hideError() {
    const banner = elements.errorBanner();
    if (banner) {
        banner.classList.add('hidden');
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounce function to limit rate of function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================================================
// EXPOSE initMap FOR GOOGLE MAPS CALLBACK
// =============================================================================

// Make initMap available globally for Google Maps callback
window.initMap = initMap;
