# import sys
import os

# sys.path.append(os.path.dirname(os.path.realpath(__file__))+'/lib')


import re
from keycloak import KeycloakOpenID
# import boto3

# secretman = boto3.client('secretsmanager')

server_url = os.environ['SERVERURL']
client_id = os.environ['CLIENTID']
realm_name = os.environ['REALMNAME']
# secrets = secretman.get_secret_value(SecretId = os.environ['SECRETID'])

keycloak_openid = KeycloakOpenID(
    server_url=server_url,
    client_id=client_id,
    realm_name=realm_name,
    # client_secret_key=secrets
    )


def check_role(roles):
    checked_role = "view-profile"
    return checked_role in roles

def handler(event, context):
    print(event)

    """validate the incoming token"""

    # Retrieve the token info
    try:
        # Get the user name info
        access_token = event['identitySource'][0].split(' ')[1]
        userinfo = keycloak_openid.userinfo(access_token)
        user_name = userinfo['preferred_username']

        # Verify token and retrieve role info
        KEYCLOAK_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\n" + keycloak_openid.public_key() + "\n-----END PUBLIC KEY-----"
        options = {"verify_signature": True, "verify_aud": False, "verify_exp": True}
        token_info = keycloak_openid.decode_token(access_token, key=KEYCLOAK_PUBLIC_KEY, options=options)
        print(token_info)
        roles = token_info['resource_access']['account']['roles']
        roleid = token_info['roleid']
        if not check_role(roles):
            raise Exception('Unauthorized')
        context = {
            'content': [roleid, user_name] # $context.authorizer.key -> value
        }

        return {
                    "isAuthorized": True,
                    "context": context
                }
    except Exception as e:
        print(e)
        return {
                    "isAuthorized": False,
                }
