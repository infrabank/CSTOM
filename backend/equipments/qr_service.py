"""QR Code generation service for equipment."""

import io
import qrcode
from django.http import HttpResponse


def generate_equipment_qr(
    equipment_id: int, base_url: str = "https://cstom.example.com"
) -> HttpResponse:
    """
    Generate QR code for equipment.

    Args:
        equipment_id: Equipment ID
        base_url: Base URL for the application

    Returns:
        HttpResponse with PNG image
    """
    # Generate URL that points to equipment detail page
    equipment_url = f"{base_url}/equipments/{equipment_id}"

    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(equipment_url)
    qr.make(fit=True)

    # Create image
    img = qr.make_image(fill_color="black", back_color="white")

    # Save to bytes buffer
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    # Return as HTTP response
    response = HttpResponse(buffer.getvalue(), content_type="image/png")
    response["Content-Disposition"] = (
        f'inline; filename="equipment_{equipment_id}_qr.png"'
    )
    return response
