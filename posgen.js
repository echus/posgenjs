var posgen = {
 
    onReady: function() {
        // Display empty chart on initialisation
        posgen.plot = posgen.plotSetup("plot",
                                       "Lattice", 
                                       "No data to show yet",
                                       [1, 1, 1],
                                       false
                                       );

        $("#plotButton").on("click", posgen.run);

        $("#selectLattice").on("change", posgen.handleForm);
    },

    run: function(event) {
        // Main function, do everything!

        // Parse form into request json for posgen api
        request = posgen.paramsToJSON(posgen.parseFail);
        console.log("Parsed request json:");
        console.log(request);

        // Call posgen with parsed request
        posgen.posgenCall(request, 
                          posgen.plotUpdate, 
                          posgen.backendFail
                         );
    },



    //
    // Function functions (I promise my other comments are better)
    // 
    plotUpdate: function(points, request) {
        console.log("plotUpdate: Received returned points");
        console.log(points);
        
        // Hack to deal with Highcharts' lack of a real updateable zAxis. 
        // Destroys previously drawn chart and recreates appropriately 
        // sized one. 
        //
        // For speed, data initialisation should really be done in the chart
        // constructor, but ain't no one got time for that.
        posgen.plot.destroy();
        posgen.plot = posgen.plotSetup("plot",
                                       "Lattice", 
                                       "(click and drag to rotate view)",
                                       [request.bounds.x, 
                                        request.bounds.y, 
                                        request.bounds.z],
                                       true
                                       );

        // Loop through returned points by mass (element ID)
        for (var mass in points) {
            if (points.hasOwnProperty(mass)) {
                // Plot each element as separate series
                posgen.plot.addSeries({
                    name: mass,
                    data: points[mass]
                });
            }
        }

        posgen.plot.setTitle({text: "Lattice"}, {text: "(click and drag to rotate view)"});
    },

    posgenCall: function(request, onDone, onFail) {
        // Generate points as per request params
        //
        // Arguments:
        // ----------
        // request: JAppropriately structured request object for posgen/api
        // done: callback on success, passed returned data and request object
        // fail: callback on failure, passed returned data and request object
        
        var jqxhr = $.ajax({
            url: "api/points",
            type: "POST",
            data: JSON.stringify(request),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });

        jqxhr.done(function(data) {
            onDone(data, request);
        });

        jqxhr.fail(function(data) {
            onFail(data, request);
        });
    },

    paramsToJSON: function(onFail) {
        // Parses form to appropriate request object for passing to posgen backend
        // Displays error if form incomplete or outside value bounds
        // 
        // Arguments:
        // ----------
        // fail: Parse failure callback
        //
        // Returns:
        // --------
        // Success: Parsed form contents in posgen/api object form 
        //          (NOT stringified)
        // Error:   undefined

        // TODO: var $error = $("#formError");

        var $paramsLattice = $("#paramsLattice :input");
        var $paramsSpacing = $("#paramsSpacing :input");
        var $paramsBounds = $("#paramsBounds :input");
        // Don't serialize empty fields in mass
        var $paramsMass = $("#paramsMass :input").filter(
                function(index, element) {
                    return $(element).val() != "";
                });

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
            onFail();
            return undefined;
        } else {
            return params;
        }
    },



    handleForm: function() {
        if ($(this).val() === "fcc") {
            $("#hideCubic").show();
        } else if ($(this).val() === "cubic") {
            $("#hideCubic").hide();
            // Clear any values in hidden fields
            $("#hideCubic").find(":input").val("");
        }
    },



    // 
    // Failure functions
    //
    parseFail: function() {
        // Form parsing failure
        console.log("ERROR: Failed to parse form data, check your input")
    },

    backendFail: function(data, request) {
        // Backend failure
        console.log("ERROR: Backend error")
    },



    // 
    // Convenience functions
    //
    paramsCheck: function(params) {
        // Check all required request elements are present and correct
        // 
        // ----------
        // params: Object representation of posgenapi json request to be sent
        //
        // Returns:
        // --------
        // (success) true
        // (fail)    false
        return true;
    },

    

    //
    // Highcharts
    // 
    plotSetup: function(container, title, subtitle, bounds, legend) {
        // Initialises plot in the supplied container
        //
        // Arguments:
        // ----------
        // container: HTML container to render chart to
        // title    : Chart title
        // subtitle : Chart subtitle
        // bounds   : Chart maximum bounds array [x, y, z]
        // legend   : (boolean) Enable/disable legend
        //
        // Returns:
        // --------
        // chart    : Highcharts chart object

        var chart = new Highcharts.Chart({
            chart: {
                renderTo: container,
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
                text: title
            },
            subtitle: {
                text: subtitle
            },
            plotOptions: {
                scatter: {
                    width: bounds[0],
                    height: bounds[1],
                    depth: bounds[2]
                }
            },
            yAxis: {
                min: 0,
                max: bounds[1],
                title: null
            },
            xAxis: {
                min: 0,
                max: bounds[0],
                gridLineWidth: 1
            },
            zAxis: {
                min: 0,
                max: bounds[2]
            },
            legend: {
                enabled: legend
            },
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

        return chart;
    }

};
 
$(document).ready(posgen.onReady);
