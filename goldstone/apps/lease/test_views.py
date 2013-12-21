# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2012 Solinea, Inc.
#

from django.test.client import Client
from django.test.client import RequestFactory
from django.test import TestCase
from django.utils import timezone, dateformat

from datetime import datetime, timedelta

from .views import DeleteLeaseView, ListLeaseView
from .views import UpdateLeaseView, CreateLeaseView
from .models import Lease, Notification, Action


class LeaseViewTest(TestCase):
    """Lease list view tests"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def _create_sample_lease(self):
        default_lease = datetime.now()+timedelta(days=30)
        Lease.objects.create(name='foo', reason='bar',
                             deleted=False, start_time=timezone.now(),
                             expiration_time=timezone.make_aware(
                                 default_lease,
                                 timezone.get_current_timezone())
                             )

    def test_lease_in_the_context(self):
        client = Client()
        response = client.get('/leases/')
        self.assertEquals(list(response.context['object_list']), [])
        self._create_sample_lease()
        response = client.get('/leases/')
        self.assertEquals(response.context['object_list'].count(), 1)

    def test_lease_in_the_context_request_factory(self):
        factory = RequestFactory()
        request = factory.get('/leases/')
        response = ListLeaseView.as_view()(request)
        self.assertEquals(list(response.context_data['object_list']), [])
        self._create_sample_lease()
        response = ListLeaseView.as_view()(request)
        self.assertEquals(response.context_data['object_list'].count(), 1)

    def test_create_lease(self):
        self.assertEquals(Action.objects.count(), 0)
        self.assertEquals(Notification.objects.count(), 0)
        thirty_days = timezone.make_aware(datetime.now()+timedelta(days=30),
                                          timezone.get_current_timezone())
        thirty_days = dateformat.format(thirty_days, 'Y-m-d H:i')
        sample_data = {'deleted': 'False', 'start_time': timezone.now(),
                       'expiration_time': str(thirty_days), 'name': 'Ted',
                       'reason': 'missing', 'lease_type': 'INSTANCE',
                       'resource_type': 'COMPUTE', 'scope': 'RESOURCE',
                       'owner_id': '12'}
        client = Client()
        response = client.post('/leases/new', data=sample_data, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEquals(Lease.objects.count(), 1)
        self.assertEquals(Action.objects.count(), 1)
        self.assertEqual(Notification.objects.count(),  1)

    def test_delete_lease(self):
        self._create_sample_lease()
        self.assertEquals(Lease.objects.count(), 1)
        to_be_deleted = Lease.objects.first()
        factory = RequestFactory()
        request = factory.post('/leases/delete/%s' % to_be_deleted.pk)
        DeleteLeaseView.as_view()(request, pk=to_be_deleted.pk)
        self.assertEquals(Lease.objects.count(), 0)

    def test_update_lease(self):
        self._create_sample_lease()
        to_be_edited = Lease.objects.first()
        factory = RequestFactory()
        request = factory.post('/leases/edit/%s' % to_be_edited.pk)
        UpdateLeaseView.as_view()(request, pk=to_be_edited.pk)
        self.assertEquals(Lease.objects.count(), 1)