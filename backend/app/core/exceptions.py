class AppException(Exception):
    def __init__(
        self,
        message: str,
        code: str | None = None,
        status_code: int = 500,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class AuthException(AppException):
    def __init__(
        self,
        message: str,
        code: str | None = "ERROR",
        status_code: int = 400,
    ):
        super().__init__(message, code, status_code)
