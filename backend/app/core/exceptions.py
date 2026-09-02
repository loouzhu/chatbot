class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = ""):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


# 未授权
class UnauthorizedException(AppException):
    pass


# 禁止访问
class ForbiddenException(AppException):
    pass


# 验证失败
class ValidationException(AppException):
    pass


# 找不到内容
class NotFoundException(AppException):
    pass
