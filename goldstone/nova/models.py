"""Nova app models."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from elasticsearch_dsl import A
from goldstone.drfes.models import DailyIndexDocType
from goldstone.models import TopologyData


class AgentsData(TopologyData):
    """Return data from ES about nova agents"""
    _DOC_TYPE = 'nova_agents_list'
    _INDEX_PREFIX = 'goldstone-'


class AggregatesData(TopologyData):
    """Return data from ES about nova aggregates"""
    _DOC_TYPE = 'nova_aggregates_list'
    _INDEX_PREFIX = 'goldstone-'


class AvailZonesData(TopologyData):
    """Return data from ES about nova availability zones"""
    _DOC_TYPE = 'nova_avail_zones_list'
    _INDEX_PREFIX = 'goldstone-'


class CloudpipesData(TopologyData):
    """Return data from ES about nova cloud pipes"""
    _DOC_TYPE = 'nova_cloudpipes_list'
    _INDEX_PREFIX = 'goldstone-'


class FlavorsData(TopologyData):
    """Return data from ES about nova flavors"""
    _DOC_TYPE = 'nova_flavors_list'
    _INDEX_PREFIX = 'goldstone-'


class FloatingIpPoolsData(TopologyData):
    """Return data from ES about nova floating IP pools"""
    _DOC_TYPE = 'nova_floating_ip_pools_list'
    _INDEX_PREFIX = 'goldstone-'


class HostsData(TopologyData):
    """Return data from ES about nova hosts"""
    _DOC_TYPE = 'nova_hosts_list'
    _INDEX_PREFIX = 'goldstone-'


class HypervisorsData(TopologyData):
    """Return data from ES about nova hypervisors"""
    _DOC_TYPE = 'nova_hypervisors_list'
    _INDEX_PREFIX = 'goldstone-'


class NetworksData(TopologyData):
    """Return data from ES about nova networks"""
    _DOC_TYPE = 'nova_networks_list'
    _INDEX_PREFIX = 'goldstone-'


class SecGroupsData(TopologyData):
    """Return data from ES about nova security groups"""
    _DOC_TYPE = 'nova_secgroups_list'
    _INDEX_PREFIX = 'goldstone-'


class ServersData(TopologyData):
    """Return data from ES about nova servers"""
    _DOC_TYPE = 'nova_servers_list'
    _INDEX_PREFIX = 'goldstone-'


class ServicesData(TopologyData):
    """Return data from ES about nova services"""
    _DOC_TYPE = 'nova_services_list'
    _INDEX_PREFIX = 'goldstone-'
