from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings

from djangojs.views import QUnitView

import logging

import waffle

logger = logging.getLogger(__name__)

admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^intelligence/', include('goldstone.apps.intelligence.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', include('goldstone.apps.cockpit.urls')))

if settings.QUNIT_ENABLED:
    urlpatterns += patterns(
        '',
        url(r'^djangojs/', include('djangojs.urls')),
        url(r'^qunit$', QUnitView.as_view(
            template_name='qunit.tests.html', js_files='js/tests/*.tests.js',
            jquery=True, django_js=True), name='my_qunit_view')
    )

if waffle.switch_is_active('gse'):
    urlpatterns += patterns('', url(r'^leases/',
                                    include('goldstone.apps.lease.urls')))


urlpatterns += staticfiles_urlpatterns()
