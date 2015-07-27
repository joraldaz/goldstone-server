/**
 * Copyright 2015 Solinea, Inc.
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
 */

/*
The GoldstoneBasePageView is a 'superclass' page view that can be instantiated
via the $(document).ready() on a django HTML tempate.

It sets up listeners that are triggered by changes to the global lookback and
refresh selectors at the top of the page. And a timing loop that
responds to changes to the 'refresh' selector, or can be cancelled by
selecting "refresh off"

Note: the values and default settings of the global lookback and refresh
selectors can be customized on the page's correspoinding django HTML template,
by modifying the parameters of the globalLookbackRefreshButtonsView
*/

var GoldstoneBasePageView2 = GoldstoneBaseView2.extend({

    instanceSpecificInit: function() {
        this.render();
        this.getGlobalLookbackRefresh(); // defined on GoldstoneBaseView2
        this.renderCharts();
        this.setGlobalLookbackRefreshTriggers();
        this.scheduleInterval();
    },

    clearScheduledInterval: function() {
        clearInterval(this.currentInterval);
    },

    onClose: function() {
        if (this.currentInterval) {
            clearInterval(this.currentInterval);
        }
        _.each(this.viewsToStopListening, function(view) {
            view.stopListening();
            view.off();
        });
    },

    scheduleInterval: function() {
        var self = this;
        var intervalDelay = this.globalRefresh * 1000;

        // the value of the global refresh selector "refresh off" = -1
        if (intervalDelay < 0) {
            return true;
        }

        this.currentInterval = setInterval(function() {
            self.triggerChange('lookbackIntervalReached');
        }, intervalDelay);
    },

    triggerChange: function(change) {

        /*
        to be customized per each view that is extended from this view.

        Example usage:

        'lookbackSelectorChanged' will be triggered by a change to
        the global lookback selector at the top of the page as
        self.triggerChange('lookbackSelectorChanged');

        'lookbackIntervalReached' will be triggered by the firing
        of the setInterval that is created in this.scheduleInterval as
        self.triggerChange('lookbackIntervalReached');

        The other trigger that is generated by the listeners that are
        set up in this.setGlobalLookbackRefreshTriggers is
        'refreshSelectorChanged' which is fired when the global
        refresh selector at the top of the page is changed.

        A common pattern to use here is to create a conditional that
        will respond to the changes needed. There are listeners in
        the individual charts that handle the desired action upon
        receiving the triggers defined below:

        if (change === 'lookbackSelectorChanged' || change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackSelectorChanged');
        }

        if (change === 'lookbackIntervalReached') {
            this.novaApiPerfChartView.trigger('lookbackIntervalReached');
        }
        */

    },

    setGlobalLookbackRefreshTriggers: function() {
        var self = this;
        // wire up listenTo on global selectors
        // important: use obj.listenTo(obj, change, callback);
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalLookbackChange', function() {
            self.getGlobalLookbackRefresh();
            self.clearScheduledInterval();
            self.scheduleInterval();
            self.triggerChange('lookbackSelectorChanged');
        });
        this.listenTo(goldstone.globalLookbackRefreshSelectors, 'globalRefreshChange', function() {
            self.getGlobalLookbackRefresh();
            self.clearScheduledInterval();
            self.scheduleInterval();
            self.triggerChange('refreshSelectorChanged');
        });
    },

    renderCharts: function() {

        /*
        To be customized per each view that is extended from this view.

        Example usage:

        var ns = this.defaults;

        //---------------------------
        // instantiate nova api chart

        this.novaApiPerfChart = new ApiPerfCollection({
            componentParam: 'nova',
        });

        this.novaApiPerfChartView = new ApiPerfView({
            chartTitle: "Nova API Performance",
            collection: this.novaApiPerfChart,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Hypervisor Show"
            }],
            el: '#api-perf-report-r1-c1',
            width: $('#api-perf-report-r1-c1').width()
        });
        */

    }
});