from __future__ import annotations

import hashlib
import io
from dataclasses import dataclass

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/webp": b"RIFF",
    "image/gif": b"GIF8",
}


@dataclass(frozen=True)
class CloudinaryUpload:
    secure_url: str
    public_id: str


class CloudinaryConfigurationError(RuntimeError):
    pass


class InvalidImageUpload(ValueError):
    pass


def _configure_cloudinary() -> None:
    if not all((settings.cloudinary_cloud_name, settings.cloudinary_api_key, settings.cloudinary_api_secret)):
        raise CloudinaryConfigurationError("Cloudinary credentials are not configured")
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


async def upload_product_image(upload: UploadFile, public_id_prefix: str) -> CloudinaryUpload:
    _configure_cloudinary()
    content_type = upload.content_type or ""
    signature = ALLOWED_IMAGE_TYPES.get(content_type)
    if signature is None:
        raise InvalidImageUpload("Only JPEG, PNG, WebP, and GIF images are allowed")

    content = await upload.read(settings.cloudinary_max_upload_bytes + 1)
    if len(content) > settings.cloudinary_max_upload_bytes:
        raise InvalidImageUpload("Image exceeds the maximum allowed size")
    if not content.startswith(signature):
        raise InvalidImageUpload("Image content does not match its declared type")
    if content_type == "image/webp" and content[8:12] != b"WEBP":
        raise InvalidImageUpload("Invalid WebP image")

    digest = hashlib.sha256(content).hexdigest()[:24]
    public_id = f"{public_id_prefix}/{digest}"
    result = await run_in_threadpool(
        cloudinary.uploader.upload,
        io.BytesIO(content),
        public_id=public_id,
        folder="fasrord/products",
        resource_type="image",
        overwrite=False,
        use_filename=False,
        unique_filename=False,
        invalidate=True,
    )
    return CloudinaryUpload(secure_url=result["secure_url"], public_id=result["public_id"])


def delete_product_image(public_id: str) -> None:
    _configure_cloudinary()
    cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)