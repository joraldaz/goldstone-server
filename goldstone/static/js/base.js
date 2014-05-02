/**
 * Copyright 2014 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: John Stanford
 */

// create a project namespace and utility for creating descendants
var goldstone = goldstone || {}
goldstone.namespace = function (name) {
    "use strict";
    var parts = name.split('.')
    var current = goldstone
    for (var i = 0; i < parts.length; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {}
        }
        current = current[parts[i]]
    }
}

goldstone.namespace('settings')
goldstone.namespace('time')
goldstone.namespace('charts')
goldstone.namespace('settings.charts')

goldstone.settings.charts.maxChartPoints = 100
goldstone.settings.charts.ordinalColors = ["#6a51a3", "#2171b5", "#238b45", "#d94801", "#cb181d"]
goldstone.settings.charts.margins = { top: 30, bottom: 60, right: 30, left: 50 }

// set up the alert elements in the base template
$(document).ready(function () {
    "use strict";
    $(".alert-danger > a").click(function () {
        $(".alert-danger").alert()
    })
    $(".alert-warning > a").click(function () {
        $(".alert-warning").alert()
    })
    $(".alert-info > a").click(function () {
        $(".alert-info").alert()
    })
    $(".alert-success > a").click(function () {
        $(".alert-success").alert()
    })
})

$('#settingsStartTime').datetimepicker({
    format: 'M d Y H:i:s',
    lang: 'en'
})

$('#settingsEndTime').datetimepicker({
    format: 'M d Y H:i:s',
    lang: 'en'
})

$("#endTimeNow").click(function () {
    "use strict";
    $("#autoRefresh").prop("disabled", false)
    $("#autoRefresh").prop("checked", true)
    $("#autoRefreshInterval").prop("disabled", false)
    $("#settingsEndTime").prop("disabled", true)
})

$("#endTimeSelected").click(function () {
    "use strict";
    $("#autoRefresh").prop("checked", false)
    $("#autoRefresh").prop("disabled", true)
    $("#autoRefreshInterval").prop("disabled", true)
    $("#settingsEndTime").prop("disabled", false)
})

$("#settingsEndTime").click(function () {
    "use strict";
    $("#endTimeSelected").prop("checked", true)
    $("#autoRefresh").prop("checked", false)
    $("#autoRefresh").prop("disabled", true)
    $("#autoRefreshInterval").prop("disabled", true)
})


// tools for raising alerts
goldstone.raiseError = function (message) {
    "use strict";
    goldstone.raiseDanger(message)
}

goldstone.raiseDanger = function (message) {
    "use strict";
    goldstone.raiseAlert(".alert-danger", message)
}

goldstone.raiseWarning = function (message) {
    "use strict";
    goldstone.raiseAlert(".alert-warning", message)
}

goldstone.raiseSuccess = function (message) {
    "use strict";
    goldstone.raiseAlert(".alert-success", message)
}

goldstone.raiseInfo = function (message) {
    "use strict";
    goldstone.raiseAlert(".alert-info", message)
}

goldstone.raiseAlert = function (selector, message) {
    "use strict";
    $(selector).html(message + '<a href="#" class="close" data-dismiss="alert">&times;</a>')
    $(selector).fadeIn("slow")
    window.setTimeout(function () {
        $(selector).fadeOut("slow")
    }, 4000)
}


goldstone.populateSettingsFields = function (start, end) {
    "use strict";
    var s = new Date(start).toString(),
        e = new Date(end).toString(),
        sStr = s.substr(s.indexOf(" ") + 1),
        eStr = e.substr(e.indexOf(" ") + 1)

    $('#settingsStartTime').val(sStr)
    $('#settingsEndTime').val(eStr)
}

goldstone.isRefreshing = function () {
    "use strict";
    return $("#autoRefresh").prop("checked")
}

goldstone.getRefreshInterval = function () {
    "use strict";
    return $("select#autoRefreshInterval").val()
}


goldstone.time.fromPyTs = function (t) {
    "use strict";

    if (typeof t === 'number') {
        return new Date(Math.round(t) * 1000)
    } else {
        return new Date(Math.round(Number(t) * 1000))
    }
}

goldstone.time.toPyTs = function (t) {
    "use strict";

    // TODO decide whether toPyTs should only handle date objects.  Handling numbers may cause unexpected results.
    if (typeof t === 'number') {
        return String(Math.round(t / 1000))
    } else if (Object.prototype.toString.call(t) === '[object Date]') {
        return String(Math.round(t.getTime() / 1000))
    }
}

/**
 * Returns a Date object if given a Date or a numeric string
 * @param {[Date, String]} the date representation
 * @return {Date} the date representation of the string
 */
goldstone.time.paramToDate = function (param) {
    "use strict";
    if (param instanceof Date) {
        return param
    } else {
        // TODO should validate the string and handle appropriately
        return new Date(Number(param))
    }
}

goldstone.time.getDateRange = function () {
    "use strict";
    //grab the values from the standard time settings modal/window
    var end = (function () {
            if (! $("#endTimeNow").prop("checked")) {
                var e = $("input#settingsEndTime").val()
                switch (e) {
                    case '':
                        return new Date()
                    default:
                        var d = new Date(e)
                        if (d === 'Invalid Date') {
                            alert("End date must be valid. Using now.")
                            d = new Date()
                        }
                        return d
                }
            } else {
                return new Date()
            }
        })(),
        start = (function () {
            var s = $("input#settingsStartTime").val()
            switch (s) {
                case '':
                    // TODO devise a better way to handle the default start.  Should probably be a setting.
                    return (new Date(end)).addWeeks(-1)
                default:
                    var d = new Date(s)
                    if (d === 'Invalid Date') {
                        alert("Start date must be valid. Using 1 week " +
                            "prior to end date.")
                        // TODO devise a better way to handle the default start.  Should probably be a setting.
                        d = (new Date(end)).addWeeks(-1)
                    }
                    return d
            }
        })()

    return [start, end]
}

/**
 * Returns an appropriately sized interval to retrieve a max number
 * of points/bars on the chart
 * @param {Date} start Instance of Date representing start of interval
 * @param {Date} end Instance of Date representing end of interval
 * @param {Number} maxBuckets maximum number of buckets for the time range
 * @return {Number} An integer representation of the number of seconds of
 * an optimal interval
 */
goldstone.time.autoSizeInterval = function (start, end, maxPoints) {
    "use strict";
    var s = goldstone.settings.charts
    maxPoints = typeof maxPoints !== 'undefined' ? maxPoints : s.maxChartPoints
    var diffSeconds = (end.getTime() - start.getTime()) / 1000
    var interval = diffSeconds / maxPoints
    return String(interval).concat("s")
}


/**
 * Returns appropriately formatted start, end, and interval specifications when
 * provided the parameter strings from the request
 * @param {String} start Instance of String representing start of interval
 * @param {String} end Instance of String representing end of interval
 * @return {Object} An object of {start:Date, end:Date, interval:String}
 */
goldstone.time.processTimeBasedChartParams = function (end, start, maxPoints) {
    "use strict";

    var endDate = typeof end !== 'undefined' ?
        goldstone.time.paramToDate(end) :
        new Date(),
    startDate = typeof start !== 'undefined' ?
        goldstone.time.paramToDate(start) :
        (function () {
            var s = new Date(endDate)
            // TODO devise a better way to handle the default start.  Should probably be a setting.
            s.addWeeks(-1)
            return s
        })(),
    result = {
        'start': startDate,
        'end': endDate
    }

    if (typeof maxPoints !== 'undefined') {
        result.interval = String(goldstone.time.autoSizeInterval(startDate, endDate, maxPoints)) + "s"
    }

    return result

}

/**
 * Returns a chart stub based on a dc.barChart
 * @param {String} location String representation of a jquery selector
 * @param {Object} margins Object containing top, bottom, left, right margins
 * @param {Function} renderlet Function to be passed as a renderlet
 * @return {Object} A dc.js bar chart
 */
goldstone.charts.barChartBase = function (location, margins, renderlet) {
    "use strict";
    var panelWidth = $(location).width(),
        chart = dc.barChart(location)

    margins = typeof margins !== 'undefined' ?
            margins : { top: 50, bottom: 60, right: 30, left: 40 }

    chart
        .width(panelWidth)
        .margins(margins)
        .transitionDuration(1000)
        .centerBar(true)
        .elasticY(true)
        .brushOn(false)
        .legend(dc.legend().x(45).y(0).itemHeight(15).gap(5))
        .ordinalColors(goldstone.settings.charts.ordinalColors)
        .xAxis().ticks(5)

    if (typeof renderlet !== 'undefined') {
        chart.renderlet(renderlet)
    }

    return chart
}

/**
 * Returns a chart stub based on a dc.lineChart
 * @param {String} location String representation of a jquery selector
 * @param {Object} margins Object containing top, bottom, left, right margins
 * @param {Function} renderlet a function to be added as a renderlet
 * @return {Object} A dc.js line chart
 */
goldstone.charts.lineChartBase = function (location, margins, renderlet) {
    "use strict";
    var panelWidth = $(location).width(),
        chart = dc.lineChart(location)

    if (! margins) {
        margins = { top: 30, bottom: 60, right: 30, left: 50 }
    }

    chart
        .renderArea(true)
        .width(panelWidth)
        .margins(margins)
        .transitionDuration(1000)
        .elasticY(true)
        .renderHorizontalGridLines(true)
        .brushOn(false)
        .ordinalColors(goldstone.settings.charts.ordinalColors)
        .interpolate("basis")
        .tension(0.85)
        .xAxis().ticks(5)

    if (typeof renderlet !== 'undefined') {
        chart.renderlet(renderlet)
    }

    return chart
}

goldstone.charts.bivariateWithAverage = {
    ns: null,
    /**
     * Get a new instance of a bivariate chart with your namespace
     * @param ns
     * @private
     */
    _getInstance: function (ns) {
        "use strict";
        var o = Object.create(this)
        o.ns = ns
        return o
    },
    /**
     * Get basic information about the chart
     */
    info: function () {
        "use strict";
        var html = function () {
                var start = dateFormat(Date(this.ns.start)),
                    end = dateFormat(Date(this.ns.end)),
                    custom = _.map(this.ns.infoCustom, function (e) {
                            return e.key + ": " + e.value + "<br>"
                    }),
                    result = '<div class="body"><br>' + custom +
                    'Start: ' + start + '<br>' +
                    'End: ' + end + '<br>' +
                    'Interval: ' + this.ns.interval + '<br>' +
                    '<br></div>'
                return result
            }

        $(this.ns.infoIcon).popover({
            trigger: 'click',
            content: html.apply(this),
            placement: 'bottom',
            html: 'true'
        })
    },
    /**
     * initialize the chart.  Should not need to override.
     */
    init: function () {
        "use strict";
        this.info()
        this.initSvg()
        this.update()

        // TODO test out setInterval and develop updating chart functionality
        //setInterval(function () {
        //    var now = new Date()
        //    if (now > ns.end) {
        //        ns.end = ns.end.addSeconds(ns.interval)
        //        ns.start = ns.start.addSeconds(ns.interval)
        //    }
        //    ns.loadUrl(ns.start, ns.end, ns.interval)
        //}, 60000)
    },
    /**
     * Call the backend and retrieve page content and data if render = true,
     * or just data if render = false.
     * @param start
     * @param end
     * @param interval
     * @param render
     * @param location
     */
        // TODO can the update in init be pulled to here?
    loadUrl: function (start, end, interval, render, location) {
        "use strict";
        render = typeof render !== 'undefined' ? render : false
        if (render) {
            // TODO can we generalize the url function?
            $(location).load(this.ns.url(start, end, interval, render))
        } else {
            // just get the data
            d3.json(this.ns.url(start, end, interval), function (error, data) {
                this.ns.data = data
                this.update()
            })
        }
    },
    initSvg: function () {
        "use strict";
        //TODO can we just make all these ns fields part of this?
        this.ns.margin = { top: 30, bottom: 60, right: 30, left: 60 }
        this.ns.w = $(this.ns.location).width()
        this.ns.mw = this.ns.w - this.ns.margin.left - this.ns.margin.right
        this.ns.mh = this.ns.h - this.ns.margin.top - this.ns.margin.bottom
        this.ns.svg = d3.select(this.ns.location)
            .append("svg")
                .attr("width", this.ns.w)
                .attr("height", this.ns.h)
        this.ns.chart = this.ns.svg.append("g")
            .attr('class', 'chart')
            .attr("transform", "translate(" + this.ns.margin.left + "," + this.ns.margin.top + ")")
    },
    update: function () {
        "use strict";
        if (this.ns.data !== 'undefined') {
            if (Object.keys(this.ns.data).length === 0) {
                $(this.ns.location).append("<p> Response was empty.")
                $(this.ns.spinner).hide()
            } else {
                (function (json, ns) {
                    // set up data, add a time field based on key and convert all times
                    // to milliseconds
                    json.forEach(function (d) {
                        d.time = new Date(Number(d.key))
                        d.min = d.min * 1000
                        d.max = d.max * 1000
                        d.avg = d.avg * 1000
                        d.sum_of_squares = d.sum_of_squares * 1000
                        d.sum = d.sum * 1000
                    })

                    // define our x and y scaling functions
                    var x = d3.time.scale()
                            .domain(d3.extent(json, function (d) { return d.time }))
                            .rangeRound([0, ns.mw]),
                        y = d3.scale.linear()
                            .domain([0, d3.max(json, function (d) { return d.max })])
                            .range([ns.mh, 0]),
                        area = d3.svg.area()
                            .interpolate("basis")
                            .tension(0.85)
                            .x(function (d) { return x(d.time) })
                            .y0(function (d) { return y(d.min) })
                            .y1(function (d) { return y(d.max) }),
                        maxLine = d3.svg.line()
                            .interpolate("basis")
                            .tension(0.85)
                            .x(function (d) { return x(d.time) })
                            .y(function (d) { return y(d.max) }),
                        minLine = d3.svg.line()
                            .interpolate("basis")
                            .tension(0.85)
                            .x(function (d) { return x(d.time) })
                            .y(function (d) { return y(d.min) }),
                        avgLine = d3.svg.line()
                            .interpolate("basis")
                            .tension(0.85)
                            .x(function (d) { return x(d.time) })
                            .y(function (d) { return y(d.avg) }),
                        hiddenBar = ns.chart.selectAll(ns.location + ' .hiddenBar')
                            .data(json),
                        hiddenBarWidth = ns.mw / json.length,
                        xAxis = d3.svg.axis()
                            .scale(x)
                            .orient("bottom"),
                        yAxis = d3.svg.axis()
                            .scale(y)
                            .orient("left"),
                        tip = d3.tip()
                            .attr('class', 'd3-tip')
                            .html(function (d) {
                                return "<p>" + dateFormat(d.time)  + "<br>Max: " + d.max.toFixed(2) +
                                    "<br>Avg: " + d.avg.toFixed(2) + "<br>Min: " + d.min.toFixed(2) + "<p>"
                            })

                    // initialized the axes

                    ns.svg.append("text")
                        .attr("class", "axis.label")
                        .attr("transform", "rotate(-90)")
                        .attr("x", 0 - (ns.h / 2))
                        .attr("y", -5)
                        .attr("dy", "1.5em")
                        .text(ns.yAxisLabel)
                        .style("text-anchor", "middle")

                    // Invoke the tip in the context of your visualization
                    ns.chart.call(tip)

                    // initialize the chart lines
                    ns.chart.append("path")
                        .datum(json)
                        .attr("class", "area")
                        .attr("id", "minMaxArea")
                        .attr("d", area)
                        .attr("fill", colorbrewer.Spectral[10][4])
                        .style("opacity", 0.3)

                    ns.chart.append('path')
                        .attr('class', 'line')
                        .attr('id', 'minLine')
                        .attr('data-legend', "Min")
                        .style("stroke", colorbrewer.Spectral[10][8])
                        .datum(json)
                        .attr('d', minLine)

                    ns.chart.append('path')
                        .attr('class', 'line')
                        .attr('id', 'maxLine')
                        .attr('data-legend', "Max")
                        .style("stroke", colorbrewer.Spectral[10][1])
                        .datum(json)
                        .attr('d', maxLine)

                    ns.chart.append('path')
                        .attr('class', 'line')
                        .attr('id', 'avgLine')
                        .attr('data-legend', "Avg")
                        .style("stroke-dasharray", ("3, 3"))
                        .style("stroke", colorbrewer.Greys[3][1])
                        .datum(json)
                        .attr('d', avgLine)

                    ns.chart.append('g')
                        .attr('class', 'x axis')
                        .attr('transform', 'translate(0, ' + ns.mh + ')')
                        .call(xAxis);
                    ns.chart.append('g')
                        .attr('class', 'y axis')
                        .call(yAxis)

                    var legend = ns.chart.append("g")
                        .attr("class", "legend")
                        .attr("transform", "translate(20,0)")
                        .call(d3.legend)

                    // UPDATE
                    // Update old elements as needed.


                    // ENTER
                    // Create new elements as needed.
                    hiddenBar.enter()
                        .append('g')
                        .attr("transform", function (d, i) {
                            return "translate(" + i * hiddenBarWidth + ",0)"
                        })

                    // ENTER + UPDATE
                    // Appending to the enter selection expands the update selection to include
                    // entering elements; so, operations on the update selection after appending to
                    // the enter selection will apply to both entering and updating nodes.

                    // hidden rectangle for tooltip tethering
                    hiddenBar.append("rect")
                        .attr('class', 'partialHiddenBar')
                        .attr("id", function (d, i) { return "verticalRect" + i})
                        .attr("y", function (d) { return y(d.max); })
                        .attr("height", function (d) { return ns.mh - y(d.max) })
                        .attr("width", hiddenBarWidth)
                    // narrow guideline turns on when mouse enters hidden bar
                    hiddenBar.append("rect")
                        .attr("class", "verticalGuideLine")
                        .attr("id", function (d, i) { return "verticalGuideLine" + i})
                        .attr("x", Math.round(hiddenBarWidth / 2))
                        .attr("height", ns.mh)
                        .attr("width", 1)
                        .style("opacity", 0)
                    // wide guideline with mouse event handling to show guide and
                    // tooltip.
                    hiddenBar.append("rect")
                        .attr('class', 'hiddenBar')
                        .attr("height", ns.mh)
                        .attr("width", hiddenBarWidth)
                        // TODO GOLD-303 TODO: fix excessive firing of events when passing through the partial rectangle
                        .on('mouseenter', function (d, i) {
                            var rectId = ns.location + " #verticalRect" + i,
                                guideId = ns.location + " #verticalGuideLine" + i,
                                targ = d3.select(rectId).pop().pop()
                            d3.select(guideId).style("opacity", 0.8)
                            tip.show(d, targ)
                        })
                        .on('mouseleave', function (d, i) {
                            var id = ns.location + " #verticalGuideLine" + i
                            d3.select(id).style("opacity", 0)
                            tip.hide()
                        })

                    // EXIT
                    // Remove old elements as needed.

                })(this.ns.data, this.ns)
                $(this.ns.spinner).hide()
            }
        }
    }
}

goldstone.charts.topologyTree = {
    ns: null,
    /**
     * Get a new instance of a topology tree chart with your namespace
     * @param ns
     * @private
     */
    _getInstance: function (ns) {
        "use strict";
        var o = Object.create(this)
        o.ns = ns
        return o
    },
    /**
     * Get basic information about the chart
     */
    info: function () {
        "use strict";
        var html = function () {
            var custom = _.map(this.ns.infoCustom, function (e) {
                            return e.key + ": " + e.value + "<br>"
                        }),
                result = '<div class="body"><br>' + custom +
                    '<br></div>'
            return result
        }

        $(this.ns.infoIcon).popover({
            trigger: 'click',
            content: html.apply(this),
            placement: 'bottom',
            html: 'true'
        })
    },
    /**
     * initialize the chart.  Should not need to override.
     */
    init: function () {
        "use strict";
        //this.info()
        this.initSvg()
        this.update()
    },
    /**
     * Call the backend and retrieve page content and data if render = true,
     * or just data if render = false.
     * @param render
     * @param location
     */
    // TODO can the update in init be pulled to here?
    loadUrl: function (render, location) {
        "use strict";
        //Error.stackTraceLimit = Infinity;
        render = typeof render !== 'undefined' ? render : false
        if (render) {
            // TODO can we generalize the url function?
            $(location).load(this.ns.url(render))
        } else {
            // just get the data
            d3.json(this.ns.url(), function (error, data) {
                this.ns.data = data
                this.update()
            })
        }
    },
    initSvg: function () {
        "use strict";
        //TODO can we just make all these ns fields part of this?
        this.ns.self = this
        this.ns.margin = { top: 0, bottom: 0, right: 0, left: 50 }
        this.ns.w = $(this.ns.location).width()
        this.ns.mw = this.ns.w - this.ns.margin.left - this.ns.margin.right
        this.ns.mh = this.ns.h - this.ns.margin.top - this.ns.margin.bottom
        this.ns.svg = d3.select(this.ns.location)
            .append("svg")
                .attr("width", this.ns.w)
                .attr("height", this.ns.h)
        this.ns.tree = d3.layout.tree()
            .size([this.ns.mh, this.ns.mw])
            .separation(function (a, b) {
                var sep = a.parent === b.parent ? 0.5 : 1
                return sep
            })
        this.ns.i = 0 // used in processTree for node id
        this.ns.diagonal = d3.svg.diagonal()
            .projection(function (d) { return [d.y, d.x]; }),
        this.ns.chart = this.ns.svg.append("g")
            .attr('class', 'chart')
            .attr("transform", "translate(" + this.ns.margin.left + "," + this.ns.margin.top + ")")
    },
    hasNewHiddenChildren: function (d) {
        "use strict";
        return d._children && _.findWhere(d._children, {'lifeStage': 'new'})
    },
    isNewChild: function (d) {
        "use strict";
        return d.lifeStage === 'new'
    },
    hasMissingHiddenChildren: function (d) {
        "use strict";
        return d._children && _.findWhere(d._children, {'missing': true})
    },
    isMissingChild: function (d) {
        "use strict";
        return d.missing
    },
    hasRemovedChildren: function (d) {
        "use strict";
        return d._children && _.findWhere(d._children, {'lifeStage': 'removed'})
    },
    isRemovedChild: function (d) {
        "use strict";
        return d.lifeStage === 'removed'
    },
    toggleAll: function (d) {
        "use strict";
        if (d.children) {
            d.children.forEach(goldstone.charts.topologyTree.toggleAll, this)
            goldstone.charts.topologyTree.toggle(d)
        }
    },
    toggle: function (d) {
        "use strict";
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    },
    processTree: function (json, ns) {
        "use strict";
        var duration = d3.event && d3.event.altKey ? 5000 : 500

        // Compute the new tree layout.
        var nodes = ns.tree.nodes(ns.data).reverse()

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            // TODO make the tree branch length configurable
            d.y = d.depth * 140;
        })

        // Update the nodes…

        var node = ns.chart.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++ns.i);
            })

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + json.y0 + "," + json.x0 + ")";
            })
            .on("click", function (d) {
                ns.self.toggle(d)
                ns.self.processTree(d, ns)
            })

        // Add the text label (initially transparent)
        nodeEnter.append("svg:text")
            .attr("x", 0)
            .attr("dy", "-1em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.label
            })
            .style("fill-opacity", 1e-6)

        // Add the main icon (initially miniscule)
        nodeEnter
            .append("g")
            .attr("class", function (d) {
                return "icon main " + (d.rsrcType || "cloud") + "-icon"
            })
            .attr("transform", "scale(0.0000001)")

        // TODO need a function to abstract the class/icon path relationship
        ns.chart.selectAll(".icon.main.cloud-icon")
            .call(function (d) {
                $.get("/static/images/icon_cloud.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        ns.chart.selectAll(".icon.main.region-icon")
            .call(function (d) {
                $.get("/static/images/icon_cloud.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        ns.chart.selectAll(".icon.main.zone-icon")
            .call(function (d) {
                $.get("/static/images/icon_zone.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        ns.chart.selectAll(".icon.main.host-icon")
            .call(function (d) {
                $.get("/static/images/icon_host.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        ns.chart.selectAll(".icon.main.service-icon")
            .call(function (d) {
                $.get("/static/images/icon_service.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })
        ns.chart.selectAll(".icon.main.endpoint-icon")
            .call(function (d) {
                $.get("/static/images/icon_endpoint.svg", function (data) {
                    d.html($(data).find('g').removeAttr('xmlns:a').html())
                })
            })

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")"
            })

        nodeUpdate.select(".icon.main")
            .attr("transform", 'translate(-5, -10) scale(0.05)')
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff"
            })

        nodeUpdate.select("text")
            .style("fill-opacity", 1)
            .style("text-decoration", function (d) {
                return (ns.self.hasRemovedChildren(d) || ns.self.isRemovedChild(d)) ?
                    "line-through" : ""
            })

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + json.y + "," + json.x + ")";
            })
            .remove()

        nodeExit.select("text")
            .style("fill-opacity", 1e-6)

        // Update the links…
        var link = ns.chart.selectAll("path.link")
            .data(ns.tree.links(nodes), function (d) {
                return d.target.id
            })

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = {x: json.x0, y: json.y0};
                return ns.diagonal({source: o, target: o});
            })
            .transition()
            .duration(duration)
            .attr("d", ns.diagonal)

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", ns.diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = {x: json.x, y: json.y};
                return ns.diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x
            d.y0 = d.y
        })
    },
    update: function () {
        "use strict";

        if (this.ns.data !== 'undefined') {
            if (Object.keys(this.ns.data).length === 0) {
                $(this.ns.location).append("<p> Response was empty.")
                $(this.ns.spinner).hide()
            } else {
                (function (ns) {
                    ns.data.x0 = ns.h / 2
                    ns.data.y0 = 0
                    // Initialize the display to show only the first tier of children
                    ns.data.children.forEach(ns.self.toggleAll, this)
                    ns.self.processTree(ns.data, ns)
                    $(ns.spinner).hide()
                })(this.ns)
            }
        }
    }
}

window.onerror = function (message, fileURL, lineNumber) {
    console.log(message + ': ' + fileURL + ': ' + lineNumber)
}

// convenience for date manipulation
Date.prototype.addSeconds = function (m) {
    "use strict";
    this.setTime(this.getTime() + (m * 1000))
    return this
}

Date.prototype.addMinutes = function (m) {
    "use strict";
    this.setTime(this.getTime() + (m * 60 * 1000))
    return this
}

Date.prototype.addHours = function (h) {
    "use strict";
    this.setTime(this.getTime() + (h * 60 * 60 * 1000))
    return this
}

Date.prototype.addDays = function (d) {
    "use strict";
    this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000))
    return this
}

Date.prototype.addWeeks = function (d) {
    "use strict";
    this.setTime(this.getTime() + (d * 7 * 24 * 60 * 60 * 1000))
    return this
}

// test whether a script is included already
goldstone.jsIncluded = function (src) {
    "use strict";
    var scripts = document.getElementsByTagName("script")
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].getAttribute('src') === src) {
            return true
        }
    }
    return false
}
