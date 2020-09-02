var chart;
var slider;
var dataTable;
var dA;
var dB;
var elementAId;
var elementBId;

var inverseGauss = function() {
    var order = jQuery('#order-input').val();
    sendInverseRequest('/matrix-inverse/gauss/', order);
}

var inverseNumPy = function() {
    var order = jQuery('#order-input').val();
    sendInverseRequest('/matrix-inverse/numpy/', order);
}

var sendInverseRequest = function(path, order) {
    initInverseRequest();
    jQuery.ajax({url: path + order, type: 'get'})
    .done((data) => {
        handleInverseResponse(data, order);
    })
    .fail((error) => {
        console.log(error);
    })
    .always(() => {
        jQuery('#inverse-spinner').addClass('d-none');
    });
};

var handleInverseResponse = function(results, order) {
    displayInverseResults(results, order);
}

var handleSearch = function(event) {
    if (event.target.value.length > 1) {
        jQuery.ajax({url: '/elements?searchTerm=' + encodeURIComponent(event.target.value.split(' ')[0]), type: 'get'})
        .done((data) => {
            displaySearchResults(data, event.target.id);
        })
        .fail((error) => {
            console.log(error);
        })
    } else {
        hideSearchResults(event.target.id);
    }
}

var handleSearchResultsClick = function(event) {
    jQuery('#' + event.currentTarget.dataset.parent).val(event.currentTarget.textContent);
    switch(event.currentTarget.dataset.parent) {
        case 'element-a-search':
            dA = event.currentTarget.dataset.dhkl;
            elementAId = event.currentTarget.dataset.element;
            break;
        case 'element-b-search':
            dB = event.currentTarget.dataset.dhkl;
            elementBId = event.currentTarget.dataset.element;
    }
    hideSearchResults(event.currentTarget.dataset.parent);
}

var getIntensities = function() {
    var nA = jQuery('#na-input').val();
    var mB = jQuery('#mb-input').val();
    var n = jQuery('#n-input').val();
    var theta2Range = slider.noUiSlider.get();
    if (!dA || !dB || !nA || !mB || !n) {
        jQuery('#diffraction-error').removeClass('d-none');
    } else {
        jQuery('#diffraction-error').addClass('d-none');
        jQuery('#theta-range-error').addClass('d-none');
        sendIntensitiesRequest({
            elementAId   : elementAId,
            elementBId   : elementBId,
            dA           : +dA,
            dB           : +dB,
            nA           : +nA,
            mB           : +mB,
            n            : +n,
            wA           : +jQuery('#wa-input').val() || 0,
            wB           : +jQuery('#wb-input').val() || 0,
            gA           : +jQuery('#ga-input').val() || 1,
            gB           : +jQuery('#gb-input').val() || 1,
            theta2Min    : +theta2Range[0],
            theta2Max    : +theta2Range[1]
        });
    }
}

var sendIntensitiesRequest = function(requestData, elA, elB) {
    jQuery('#diffraction-spinner').removeClass('d-none');
    jQuery.ajax({
        url: '/diffraction-intensities', 
        type: 'post', 
        data: JSON.stringify(requestData), 
        contentType : 'application/json'
    })
    .done((data) => {
        clearChart();
        renderDiffractionResults(data, [elA, elB, requestData.nA, requestData.mB, requestData.n]);
    })
    .fail((error) => {
        console.log(error);
    })
    .always(() => {
        jQuery('#diffraction-spinner').addClass('d-none');
    });
}

var renderDiffractionResults = function(data, paramsList) {
    createChart(data.intensities, [
        paramsList[0] + ', ' + paramsList[1],
        'nA = ' + paramsList[3] + ', mB = ' + paramsList[4] + ', N = ' + paramsList[2]
    ]);
    timeMessage = '<div id="diffraction-time" class="mt-3">Czas obliczeń: ' + data.time + 's.</div>';
    jQuery('#diffraction-results').append(timeMessage);
    jQuery('#y-scale-increase').removeAttr("disabled");
    jQuery('#y-scale-decrease').removeAttr("disabled");
}

var getCalculations = function() {
    jQuery('#history').html('');
    jQuery.ajax({ url: '/calculations', type: 'get' })
    .done((data) => {
        displayedData = [];
        data.forEach(calc => {
            var row = [
                calc.id, calc["element_a"]["dhkl"], calc["element_b"]["dhkl"],calc["element_a"]["id"], 
                calc["element_b"]["id"], calc["element_a"]["display_name"], calc["element_b"]["display_name"], 
                calc["n_a"], calc["m_b"], calc["n"], calc["w_a"], calc["w_b"], calc["g_a"], calc["g_b"], 
                calc["theta_2_min"] + '&deg; - ' + calc["theta_2_max"] + '&deg;',  
                new Date(calc["created_date"]).toLocaleDateString(),
                `<div class="row button-column">
                    <button type="button" id="select" class="btn btn-sm btn-green">Wybierz</button>
                    <button type="button" id="delete" class="btn btn-sm btn-green ml-1">Usuń</button>
                </div>`
            ];
            displayedData.push(row);
            dataTableData = displayedData;
        });
        createDataTable(displayedData);
        addRowClickHandler();
    })
    .fail((error) => {
        console.log(error);
    })
}

var updateChartData = function(intensities) {
    chart.options.data[0].dataPoints = createDataPoints(intensities);
    chart.render();
}

var createDataPoints = function(intensities) {
    var dataPoints = [];
    intensities.forEach((intensity) => {
        dataPoints.push({
            label: intensity[0] + '°',
            y: intensity[1]
        });
    });
    return dataPoints;
}

window.onload = function () {
    createChart([], ['Natężenie linii dyfrakcyjnych w zależności od kąta 2θ']);
    createSlider();
    addCloseModalHandler();
}