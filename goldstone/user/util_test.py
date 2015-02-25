"""Unit Test utilities.

These are used by the unit tests of multiple apps.

TODO: Find a neutral home for this.

"""
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
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, Client
from rest_framework.status import HTTP_200_OK

# Test URL
LOGIN_URL = "/accounts/login"

# Http response content used by multiple tests.
CONTENT_BAD_TOKEN = '{"detail":"Invalid token"}'
CONTENT_MISSING_FIELDS = '{"username":["This field is required."],' \
                         '"password":["This field is required."]}'
CONTENT_MISSING_PASSWORD = '{"password":["This field is required."]}'
CONTENT_MISSING_USERNAME = '{"username":["This field is required."]}'
CONTENT_NO_CREDENTIALS = \
    '{"detail":"Authentication credentials were not provided."}'
CONTENT_NO_PERMISSION = \
    '{"detail":"You do not have permission to perform this action."}'
CONTENT_NON_FIELD_ERRORS = \
    '{"non_field_errors":["Unable to login with provided credentials."]}'
CONTENT_NOT_BLANK = '{"username":["This field may not be blank."],'\
                    '"password":["This field may not be blank."]}'
CONTENT_UNIQUE_USERNAME = '{"username":["This field must be unique."]}'

# The payload string for the HTTP Authorization header.
AUTHORIZATION_PAYLOAD = "Token %s"

# Test data
TEST_USER = ("fred", "fred@fred.com", "meh")


def login(username, password):
    """Log a user in.

    This is for use on a login that is supposed to succeed. It checks the
    system response with asserts before returning.

    :param username: The username to use
    :type username: str
    :param password: The password to use
    :type password: str
    :return: If a successful login, the authorization token's value
    :rtype: str

    """

    # Log the user in, and return the auth token's value.
    client = Client()
    response = client.post(LOGIN_URL,
                           {"username": username, "password": password})

    assert response.status_code == HTTP_200_OK

    # pylint: disable=E1101
    assert isinstance(response.data["auth_token"], basestring)

    return response.data["auth_token"]      # pylint: disable=E1101


def create_and_login():
    """Create a user and log them in.

    :return: The authorization token's value
    :rtype: str

    """

    # Create a user
    get_user_model().objects.create_user(*TEST_USER)
    return login(TEST_USER[0], TEST_USER[2])


class Setup(SimpleTestCase):

    """A base class to ensure we do needed housekeeping before each test."""

    def setUp(self):
        """Do explicit database reseting because SimpleTestCase doesn't always
        reset the database to as much of an initial state as we expect."""

        get_user_model().objects.all().delete()
