class AppException(Exception):
    pass


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
