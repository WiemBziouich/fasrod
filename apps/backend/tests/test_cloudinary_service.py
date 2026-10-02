from io import BytesIO
from dataclasses import replace

import pytest
from starlette.datastructures import Headers
from starlette.datastructures import UploadFile

from app.services import cloudinary_service


def make_upload(content: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        file=BytesIO(content),
        filename="product-image.png",
        headers=Headers({"content-type": content_type}),
    )


@pytest.mark.asyncio
async def test_upload_rejects_non_image_content(monkeypatch):
    monkeypatch.setattr(cloudinary_service, "_configure_cloudinary", lambda: None)

    with pytest.raises(cloudinary_service.InvalidImageUpload):
        await cloudinary_service.upload_product_image(
            make_upload(b"not an image", "image/png"),
            "product/color",
        )


@pytest.mark.asyncio
async def test_upload_rejects_oversized_image(monkeypatch):
    monkeypatch.setattr(cloudinary_service, "_configure_cloudinary", lambda: None)
    monkeypatch.setattr(
        cloudinary_service,
        "settings",
        replace(cloudinary_service.settings, cloudinary_max_upload_bytes=4),
    )

    with pytest.raises(cloudinary_service.InvalidImageUpload):
        await cloudinary_service.upload_product_image(
            make_upload(b"\x89PNG\r\n\x1a\nimage", "image/png"),
            "product/color",
        )


@pytest.mark.asyncio
async def test_upload_returns_secure_cloudinary_asset(monkeypatch):
    monkeypatch.setattr(cloudinary_service, "_configure_cloudinary", lambda: None)
    monkeypatch.setattr(
        cloudinary_service.cloudinary.uploader,
        "upload",
        lambda *args, **kwargs: {
            "secure_url": "https://res.cloudinary.com/example/image/upload/fasrord/products/hash.png",
            "public_id": "fasrord/products/product/color/hash",
        },
    )

    result = await cloudinary_service.upload_product_image(
        make_upload(b"\x89PNG\r\n\x1a\nimage", "image/png"),
        "product/color",
    )

    assert result.secure_url.startswith("https://")
    assert result.public_id.endswith("/hash")
