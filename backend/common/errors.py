"""API error helpers and custom exception handler."""

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler


class BusinessLogicError(APIException):
    """Custom exception for business logic errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A business logic error occurred."
    default_code = "business_logic_error"


class ResourceNotFoundError(APIException):
    """Custom exception for resource not found errors."""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "The requested resource was not found."
    default_code = "not_found"


class PermissionDeniedError(APIException):
    """Custom exception for permission denied errors."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action."
    default_code = "permission_denied"


class ValidationError(APIException):
    """Custom exception for validation errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Validation failed."
    default_code = "validation_error"


class ImmutableRecordError(APIException):
    """Custom exception for attempts to modify immutable records."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This record cannot be modified or deleted."
    default_code = "immutable_record"


def custom_exception_handler(exc, context):
    """Custom exception handler with consistent error format."""
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "error": {
                "code": getattr(exc, "default_code", "error"),
                "message": str(exc.detail) if hasattr(exc, "detail") else str(exc),
                "status": response.status_code,
            }
        }

        if hasattr(exc, "detail") and isinstance(exc.detail, dict):
            error_data["error"]["details"] = exc.detail

        response.data = error_data

    return response


def error_response(
    message: str,
    code: str = "error",
    status_code: int = 400,
    details: dict | None = None,
):
    """Create a standardized error response."""
    data = {
        "error": {
            "code": code,
            "message": message,
            "status": status_code,
        }
    }
    if details:
        data["error"]["details"] = details

    return Response(data, status=status_code)
