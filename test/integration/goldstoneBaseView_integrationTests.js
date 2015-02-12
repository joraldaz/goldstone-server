/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('apiPerfView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer"></div>' +
            '<div style="width:10%;" class="col-xl-1 pull-right">&nbsp;' +
            '</div>' +
            '<div class="col-xl-2 pull-right">' +
            '<form class="global-refresh-selector" role="form">' +
            '<div class="form-group">' +
            '<div class="col-xl-1">' +
            '<div class="input-group">' +
            '<select class="form-control" id="global-refresh-range">' +
            '<option value="15">refresh 15s</option>' +
            '<option value="30" selected>refresh 30s</option>' +
            '<option value="60">refresh 1m</option>' +
            '<option value="300">refresh 5m</option>' +
            '<option value="-1">refresh off</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>' +
            '<div class="col-xl-1 pull-right">' +
            '<form class="global-lookback-selector" role="form">' +
            '<div class="form-group">' +
            '<div class="col-xl-1">' +
            '<div class="input-group">' +
            '<select class="form-control" id="global-lookback-range">' +
            '<option value="15">lookback 15m</option>' +
            '<option value="60" selected>lookback 1h</option>' +
            '<option value="360">lookback 6h</option>' +
            '<option value="1440">lookback 1d</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testCollection = new ApiPerfCollection({
            urlPrefix: 'cinder'
        });

        this.testView = new GoldstoneBaseView({
            chartTitle: "Tester Base View",
            collection: this.testCollection,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Hypervisor Show"
            }],
            el: '.testContainer',
            width: $('.testContainer').width(),
            yAxisLabel: 'yAxisTest'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.legend-items').find('text').text()).to.equal('');
            expect($('.panel-title').text().trim()).to.equal('Tester Base View');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').text()).to.equal('');
            this.testCollection.reset();
            this.testView.checkReturnedDataSet(this.testCollection.toJSON());
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(0);
            this.update_spy.restore();
        });
        it('appends dataErrorMessages to container', function() {
            expect($('.popup-message').text()).to.equal('');
            this.testView.dataErrorMessage('this is a test');
            expect($('.popup-message').text()).to.include('this is a test');
            this.testView.dataErrorMessage('number two test');
            expect($('.popup-message').text()).to.include('number two test');
            this.testView.dataErrorMessage('should not be here', {
                responseJSON: {
                    status_code: 999,
                    message: 'messageInReponseJSON'
                }
            });
            expect($('.popup-message').text()).to.include('messageInReponseJSON');
            expect($('.popup-message').text()).to.not.include('should not be here');
            expect($('.popup-message').text()).to.include('999');
            this.testView.dataErrorMessage('should not be here', {
                responseJSON: {
                    status_code: 123,
                    message: 'newResponseMessage'
                }
            });
            expect($('.popup-message').text()).to.not.include('messageInReponseJSON');
            expect($('.popup-message').text()).to.include('newResponseMessage');
            expect($('.popup-message').text()).to.not.include('should not be here');
            expect($('.popup-message').text()).to.include('123');
        });
        it('can handle extra arguments that might exist from the server error', function() {
            this.testView.dataErrorMessage('should not be here', {
                responseJSON: {
                    status_code: 234,
                    message: 'newResponseMessageCheck'
                }
            }, 'nothing', 'to', 'worry', 'about');
            expect($(this.testView.el).find('.popup-message').text()).to.not.include('messageInReponseJSON');
            expect($(this.testView.el).find('.popup-message').text()).to.include('newResponseMessageCheck');
            expect($(this.testView.el).find('.popup-message').text()).to.not.include('should not be here');
            expect($(this.testView.el).find('.popup-message').text()).to.include('234');
        });
    });
});