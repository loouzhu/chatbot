from pathlib import Path

from alibabacloud_credentials.client import Client as CredentialClient
from alibabacloud_dm20151123 import models as dm_models
from alibabacloud_dm20151123.client import Client as DmClient
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_tea_util import models as util_models
from app.core.config import settings


class EmailClient:
    def __init__(self):

        credential = CredentialClient()

        config = open_api_models.Config(credential=credential)

        config.endpoint = settings.ALIYUN_DM_ENDPOINT

        self.client = DmClient(config)
        self.template_path = Path(__file__).with_name("templates") / ""

    async def send_mail(self, email: str, username: str, code: str):
        template_path = self.template_path / "register.html"
        html = template_path.read_text(encoding="utf-8")
        print(username, code)
        html = html.replace("{{ username }}", username)
        html = html.replace("{{ code }}", code)
        request = dm_models.SingleSendMailRequest(
            account_name=settings.ALIYUN_DM_ACCOUNT,
            address_type=1,
            reply_to_address=False,
            to_address=email,
            subject="验证码",
            html_body=html,
            text_body="",
        )

        runtime = util_models.RuntimeOptions()

        response = await self.client.single_send_mail_with_options_async(
            request, runtime
        )

        return response
