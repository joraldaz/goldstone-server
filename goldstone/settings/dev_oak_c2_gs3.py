from .development import *       # pylint: disable=W0614,W0401

OS_USERNAME = 'admin'
OS_TENANT_NAME = 'admin'
OS_PASSWORD = '2caa6a4d9c9d49ce'
OS_AUTH_URL = 'http://10.10.20.10:5000/v2.0/'

#
# override ES settings
#
ES_HOST = "10.10.20.203"
ES_PORT = "9200"
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}

# ElasticUtils Settings
ES_URLS = [ES_HOST + ":" + ES_PORT]
