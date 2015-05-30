var posgen = {
 
    onReady: function() {
        // Initialise chart to global var
        // var posgen.plot = posgen.plotSetup("results");
        posgen.plotSetup("results");

        $("#plotButton").on("click", posgen.updatePlot);
    },

    plotSetup: function(div) {
        // Set up the chart
        var chart = new Highcharts.Chart({
            chart: {
                renderTo: 'results',
                margin: 100,
                type: 'scatter',
                options3d: {
                    enabled: true,
                    alpha: 10,
                    beta: 30,
                    depth: 250,
                    viewDistance: 5,

                    frame: {
                        bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
                        back: { size: 1, color: 'rgba(0,0,0,0.04)' },
                        side: { size: 1, color: 'rgba(0,0,0,0.06)' }
                    }
                }
            },
            title: {
                text: 'Generated lattice'
            },
            subtitle: {
                text: '(click and drag to rotate)'
            },
            plotOptions: {
                scatter: {
                    width: 10,
                    height: 10,
                    depth: 10
                }
            },
            yAxis: {
                min: 0,
                max: 10,
                title: null
            },
            xAxis: {
                min: 0,
                max: 10,
                gridLineWidth: 1
            },
            zAxis: {
                min: 0,
                max: 10
            },
            legend: {
                enabled: true
            },
            series: [{
                name: 'Test data',
                colorByPoint: true,
                data: [[1, 6, 5], [8, 7, 9], [1, 3, 4], [4, 6, 8], [5, 7, 7], [6, 9, 6], [7, 0, 5], [2, 3, 3], [3, 9, 8], [3, 6, 5], [4, 9, 4], [2, 3, 3], [6, 9, 9], [0, 7, 0], [7, 7, 9], [7, 2, 9], [0, 6, 2], [4, 6, 7], [3, 7, 7], [0, 1, 7], [2, 8, 6], [2, 3, 7], [6, 4, 8], [3, 5, 9], [7, 9, 5], [3, 1, 7], [4, 4, 2], [3, 6, 2], [3, 1, 6], [6, 8, 5], [6, 6, 7], [4, 1, 1], [7, 2, 7], [7, 7, 0], [8, 8, 9], [9, 4, 1], [8, 3, 4], [9, 8, 9], [3, 5, 3], [0, 2, 4], [6, 0, 2], [2, 1, 3], [5, 8, 9], [2, 1, 1], [9, 7, 6], [3, 0, 2], [9, 9, 0], [3, 4, 8], [2, 6, 1], [8, 9, 2], [7, 6, 5], [6, 3, 1], [9, 3, 1], [8, 9, 3], [9, 1, 0], [3, 8, 7], [8, 0, 0], [4, 9, 7], [8, 6, 2], [4, 3, 0], [2, 3, 5], [9, 1, 4], [1, 1, 4], [6, 0, 2], [6, 1, 6], [3, 8, 8], [8, 8, 7], [5, 5, 0], [3, 9, 6], [5, 4, 3], [6, 8, 3], [0, 1, 5], [6, 7, 3], [8, 3, 2], [3, 8, 3], [2, 1, 6], [4, 6, 7], [8, 9, 9], [5, 4, 2], [6, 1, 3], [6, 9, 5], [4, 8, 2], [9, 7, 4], [5, 4, 2], [9, 6, 1], [2, 7, 3], [4, 5, 4], [6, 8, 1], [3, 4, 0], [2, 2, 6], [5, 1, 2], [9, 9, 7], [6, 9, 9], [8, 4, 3], [4, 1, 7], [6, 2, 5], [0, 4, 9], [3, 5, 9], [6, 9, 1], [1, 9, 2]]
            }]
        });

        // Add mouse events for rotation
        $(chart.container).bind('mousedown.hc touchstart.hc', function (e) {
            e = chart.pointer.normalize(e);

            var posX = e.pageX,
                posY = e.pageY,
                alpha = chart.options.chart.options3d.alpha,
                beta = chart.options.chart.options3d.beta,
                newAlpha,
                newBeta,
                sensitivity = 5; // lower is more sensitive

            $(document).bind({
                'mousemove.hc touchdrag.hc': function (e) {
                    // Run beta
                    newBeta = beta + (posX - e.pageX) / sensitivity;
                    newBeta = Math.min(100, Math.max(-100, newBeta));
                    chart.options.chart.options3d.beta = newBeta;

                    // Run alpha
                    newAlpha = alpha + (e.pageY - posY) / sensitivity;
                    newAlpha = Math.min(100, Math.max(-100, newAlpha));
                    chart.options.chart.options3d.alpha = newAlpha;

                    chart.redraw(false);
                },
                'mouseup touchend': function () {
                    $(document).unbind('.hc');
                }
            });
        });
    },
 
    updatePlot: function(event) {
        // Update plot
        //
        // paramsToJSON - get params and pass to getPoints
        // getPoints w/ json from above, return array of points
        // plotPoints w/ returned data from getpoints

        console.log("Processing form input -> json");
        request = posgen.paramsToJSON();
        console.log("Request json:");
        console.log(request);
        points = posgen.getPoints(request);
    },

    getPoints: function(request) {
        // Generate points as per request params
        //
        // Input:
        // ------
        // request: JSON with appropriately structured request for posgen/api
        //
        // Returns:
        // --------
        // points: Object { x:[], y:[], z:[], mass:[] }
        // undefined if request fails
        
        var points = {};

        var jqxhr = $.ajax({
            url: "api/points",
            type: "POST",
            data: request,
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });

        jqxhr.done(function(data) {
            console.log("api/points call success");
            console.log(data);
            points = data;
        });

        jqxhr.fail(function(data) {
            console.log("api/points call fail");
            console.log(data);
            points = undefined;
        });
    },

    paramsToJSON: function() {
        // Parses form to appropriate request object for passing to posgen backend
        // Displays error if form incomplete or outside value bounds
        // 
        // Returns:
        // --------
        // Success: stringified JSON
        // Error:   undefined

        // TODO: var $error = $("#formError");

        var $paramsLattice = $("#paramsLattice :input");
        var $paramsSpacing = $("#paramsSpacing :input");
        var $paramsBounds = $("#paramsBounds :input");
        var $paramsMass = $("#paramsMass :input");

        var lattice = {};
        $paramsLattice.serializeArray().map(function(x){lattice[x.name] = x.value;}); 
        var spacing = {};
        $paramsSpacing.serializeArray().map(function(x){spacing[x.name] = x.value;}); 
        var bounds = {};
        bounds.bounds = {};
        $paramsBounds.serializeArray().map(function(x){bounds.bounds[x.name] = x.value;}); 
        var mass = {};
        mass.mass = {};
        $paramsMass.serializeArray().map(function(x){mass.mass[x.name] = x.value;});
        
        params = $.extend({}, lattice, spacing, bounds, mass);

        // Ensure all required fields are filled
        if (posgen.paramsCheck(params) === false) {
            // TODO: display error
            // Handle this in updatePlot instead??
            return undefined;
        } else {
            return JSON.stringify(params);
        }
    },

    paramsCheck: function(params) {
        // Check all required request elements are present and corrent
        // 
        // Input:
        // ------
        // params: Object representation of posgenapi json request to be sent
        //
        // Returns:
        // --------
        // (success) true
        // (fail)    false
        return true;
    }
 
};
 
$(document).ready(posgen.onReady);
