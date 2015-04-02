"""ResourceTypes unit tests."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.conf import settings
from django.test import SimpleTestCase
import elasticsearch
from elasticsearch.client import IndicesClient
import mock
from mock import patch
from rest_framework.test import APISimpleTestCase

from .models import resources, Image, ServerGroup, NovaLimits, GraphNode, \
    PolyResource, Host, resource_types, Aggregate, Hypervisor, Port, \
    Cloudpipe, Network, Project, Server, AvailabilityZone
from . import tasks
from .utils import custom_exception_handler, _add_edges, process_resource_type

# Using the latest version of django-polymorphic, a
# PolyResource.objects.all().delete() throws an IntegrityError exception. So
# when we need to clear the PolyResource table, we'll individually delete each
# subclass.
NODE_TYPES = [Image, ServerGroup, NovaLimits, Host, Aggregate, Cloudpipe, Port,
              Hypervisor, Project, Network, Server]

# Aliases to make the code less verbose
TYPE = settings.R_ATTRIBUTE.TYPE
MATCHING_FN = settings.R_ATTRIBUTE.MATCHING_FN


def _test(type_from, data_from, identity_from, key_from,
          type_to, data_to, identity_to, key_to):
    """Test two resource_types nodes.

    This function modifies data_from and to_from.

    :param type_from: The type of the "from" node in the resource_types graph
    :type type_from: PolyResource subclass
    :param data_from: Type_from's initial test data.
    :type data_from: dict
    :param identity_from: The identity() value against which to test
    :type identity_from: str
    :param key_from: The key to modify for the matching_fn tests
    :type key_from: str
    :param type_to: The type of the "to" node in the resource_types graph
    :type type_to: PolyResource subclass
    :param data_to: Type_to's initial test data.
    :type data_to: dict
    :param identity_to: The identity() value against which to test
    :type identity_to: str
    :param key_to: The key to modify for the matching_fn tests
    :type key_to: str

    """

    # Test identity method.
    assert type_from.identity(data_from) == identity_from
    assert type_to.identity(data_to) == identity_to

    # Test edge discovery.
    edges = resource_types.graph.out_edges(type_from, data=True)
    edge = [x for x in edges if x[1] == type_to][0][2]

    # Test both being None
    data_from[key_from] = None
    data_to[key_to] = None
    assert not edge[MATCHING_FN](data_from, data_to)

    # Test one missing
    data_from[key_from] = "42"
    del data_to[key_to]
    assert not edge[MATCHING_FN](data_from, data_to)

    del data_from[key_from]
    data_to[key_to] = "42"
    assert not edge[MATCHING_FN](data_from, data_to)

    # Test both missing
    del data_to[key_to]
    assert not edge[MATCHING_FN](data_from, data_to)

    # Test no match
    data_from[key_from] = "4445"
    data_to[key_to] = "4444"
    assert not edge[MATCHING_FN](data_from, data_to)

    # Test match
    data_from[key_from] = "4445"
    data_to[key_to] = "4445"
    assert edge[MATCHING_FN](data_from, data_to)


class ResourceTypesTests(SimpleTestCase):
    """Test each entry in ResourceTypes.EDGES, in particular the matching_fn
    functions."""

    def test_image(self):
        """Test the Image entry."""

        # Test data.
        IMAGE = {u'checksum': u'd972013792949d0d3ba628fbe8685bce',
                 u'container_format': u'bare',
                 u'created_at': u'2015-01-20T22:41:11Z',
                 u'disk_format': u'qcow2',
                 u'file':
                 u'/v2/images/0ae46ce1-80e5-447e-b0e8-9eeec81af920/file',
                 u'id': u'0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                 u'min_disk': 0,
                 u'min_ram': 0,
                 u'name': u'cirros',
                 u'owner': u'a8cc59bf0cfa4103bc038d269d7cae65',
                 u'protected': False,
                 u'schema': u'/v2/schemas/image',
                 u'size': 13147648,
                 u'status': u'active',
                 u'tags': [],
                 u'updated_at': u'2015-01-20T22:41:12Z',
                 u'visibility': u'public'}

        SERVER = {u'OS-DCF:diskConfig': u'MANUAL',
                  u'OS-EXT-AZ:availability_zone': u'nova',
                  u'OS-EXT-SRV-ATTR:host': u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:hypervisor_hostname':
                  u'john.oak.solinea.com',
                  u'OS-EXT-SRV-ATTR:instance_name': u'instance-00000001',
                  u'OS-EXT-STS:power_state': 4,
                  u'OS-EXT-STS:task_state': None,
                  u'OS-EXT-STS:vm_state': u'stopped',
                  u'OS-SRV-USG:launched_at': u'2015-01-26T14:01:37.000000',
                  u'OS-SRV-USG:terminated_at': None,
                  u'accessIPv4': u'',
                  u'accessIPv6': u'',
                  u'addresses':
                  {u'demo-net':
                   [{u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'fixed',
                     u'addr': u'192.168.1.1',
                     u'version': 4},
                    {u'OS-EXT-IPS-MAC:mac_addr': u'fa:00:00:7f:2a:00',
                     u'OS-EXT-IPS:type': u'floating',
                     u'addr': u'10.11.12.13',
                     u'version': 4}]},
                  u'config_drive': u'',
                  u'created': u'2015-01-26T14:00:42Z',
                  u'flavor': {u'id': u'1',
                              u'links':
                              [{u'href':
                                u'http://10.11.12.13:8774/'
                                u'7077765ed0df43b1b23d43c9c290daf9/flavors/1',
                                u'rel': u'bookmark'}]},
                  u'hostId':
                  u'78f689fe281dbb1deb8e42ac188a9734faf430ddc905b556b74f6144',
                  u'id': u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                  u'image': {u'id': u'0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                             u'links':
                             [{u'href':
                               u'http://10.11.12.13:8774/'
                               u'7077765ed0df43b1b23d43c9c290daf9/'
                               u'images/0ae46ce1-80e5-447e-b0e8-9eeec81af920',
                               u'rel': u'bookmark'}]},
                  u'key_name': None,
                  u'links':
                  [{u'href':
                    u'http://10.10.20.10:8774/v2/7077765ed0df43b1b23d'
                    u'43c9c290daf9/servers/'
                    u'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
                    u'rel': u'self'},
                   {u'href':
                    u'http://10.10.20.10:8774/7077765ed0df43'
                    u'b1b23d43c9c290daf9/servers/ee662ff5-3de6-46cb-'
                    u'8b85-4eb4317beb7c',
                    u'rel': u'bookmark'}],
                  u'metadata': {},
                  u'name': u'instance2',
                  u'os-extended-volumes:volumes_attached': [],
                  u'security_groups': [{u'name': u'default'}],
                  u'status': u'SHUTOFF',
                  u'tenant_id': u'56762288eea24ab08a3b6d06f5a37c14',
                  u'updated': u'2015-03-04T01:27:22Z',
                  u'user_id': u'2bb2f66f20cb47e9be48a91941e3353b'}

        _test(Image,
              IMAGE,
              '0ae46ce1-80e5-447e-b0e8-9eeec81af920',
              "id",
              Server,
              SERVER,
              'ee662ff5-3de6-46cb-8b85-4eb4317beb7c',
              "id")

    def test_availability_zone_aggregate(self):
        """Test the AvailabilityZone - Aggregate entry."""

        # Test data.
        AVAILABILITY_ZONE = {
            u'hosts':
            {u'ctrl-john.solinea.com':
             {u'nova-cert': {u'active': True,
                             u'available': True,
                             u'updated_at':
                             u'2015-04-02T18:46:27.000000'},
              u'nova-conductor': {u'active': True,
                                  u'available': True,
                                  u'updated_at':
                                  u'2015-04-02T18:46:20.000000'},
              u'nova-consoleauth': {u'active': True,
                                    u'available': True,
                                    u'updated_at':
                                    u'2015-04-02T18:46:27.000000'},
              u'nova-scheduler': {u'active': True,
                                  u'available': True,
                                  u'updated_at':
                                  u'2015-04-02T18:46:27.000000'}}},
            u'zoneName': u'internal',
            u'zoneState': {u'available': True}
            }
        
        AGGREGATE = {u'availability_zone': None,
                     u'created_at': u'2015-04-01T18:36:03.000000',
                     u'deleted': False,
                     u'deleted_at': None,
                     u'hosts': [u'bob.solinea.com'],
                     u'id': 1,
                     u'metadata': {},
                     u'name': u'test-aggregate1',
                     u'updated_at': None}

        _test(AvailabilityZone,
              AVAILABILITY_ZONE,
              "internal",
              "zoneName",
              Aggregate,
              AGGREGATE,
              'test-aggregate1',
              "availability_zone")

    def test_availability_zone_host(self):
        """Test the AvailabilityZone - Host entry."""

        # Test data.
        AVAILABILITY_ZONE = {
            u'hosts':
            {u'ctrl-john.solinea.com':
             {u'nova-cert': {u'active': True,
                             u'available': True,
                             u'updated_at':
                             u'2015-04-02T18:46:27.000000'},
              u'nova-conductor': {u'active': True,
                                  u'available': True,
                                  u'updated_at':
                                  u'2015-04-02T18:46:20.000000'},
              u'nova-consoleauth': {u'active': True,
                                    u'available': True,
                                    u'updated_at':
                                    u'2015-04-02T18:46:27.000000'},
              u'nova-scheduler': {u'active': True,
                                  u'available': True,
                                  u'updated_at':
                                  u'2015-04-02T18:46:27.000000'}}},
            u'zoneName': u'internal',
            u'zoneState': {u'available': True}
            }

        HOST = {u'host_name': u'ctrl-01', u'zone': u'internal'}

        _test(AvailabilityZone,
              AVAILABILITY_ZONE,
              "internal",
              "zoneName",
              Host,
              HOST,
              'ctrl-01',
              "zone")
