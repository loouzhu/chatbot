def build_cache_key(
    *, business: str, purpose: str, identifier: str, resource: str
) -> str:
    return f"{business}:{purpose}:{resource}:{identifier}"


def verify_code_key(business: str, purpose: str, identifier: str) -> str:
    return build_cache_key(
        business=business,
        purpose=purpose,
        identifier=identifier,
        resource="verify_code",
    )


def send_limit_key(business: str, purpose: str, identifier: str) -> str:
    return build_cache_key(
        business=business,
        purpose=purpose,
        identifier=identifier,
        resource="send_limit",
    )
