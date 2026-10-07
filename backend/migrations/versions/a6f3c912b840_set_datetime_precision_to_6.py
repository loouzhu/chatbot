"""set datetime precision to 6

Revision ID: a6f3c912b840
Revises: d9821532eb21
Create Date: 2026-10-06

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql


revision: str = "a6f3c912b840"
down_revision: str | Sequence[str] | None = "d9821532eb21"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_DATETIME_COLUMNS = (
    ("user", "created_at", False, sa.text("CURRENT_TIMESTAMP(6)")),
    ("verification_code", "expire_at", False, None),
    ("verification_code", "used_at", True, None),
    (
        "verification_code",
        "created_at",
        False,
        sa.text("CURRENT_TIMESTAMP(6)"),
    ),
    ("password_reset_token", "expires_at", False, None),
    ("password_reset_token", "used_at", True, None),
    (
        "password_reset_token",
        "created_at",
        False,
        sa.text("CURRENT_TIMESTAMP(6)"),
    ),
    ("token", "expire_at", False, None),
    ("token", "created_at", False, sa.text("CURRENT_TIMESTAMP(6)")),
    ("conversation", "created_at", False, sa.text("CURRENT_TIMESTAMP(6)")),
    (
        "conversation",
        "updated_at",
        False,
        sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
    ),
    ("message", "created_at", False, sa.text("CURRENT_TIMESTAMP(6)")),
)


def upgrade() -> None:
    for table_name, column_name, nullable, server_default in _DATETIME_COLUMNS:
        op.alter_column(
            table_name,
            column_name,
            existing_type=mysql.DATETIME(),
            type_=mysql.DATETIME(fsp=6),
            existing_nullable=nullable,
            server_default=server_default,
        )


def downgrade() -> None:
    for table_name, column_name, nullable, _server_default in _DATETIME_COLUMNS:
        previous_default = (
            sa.text("CURRENT_TIMESTAMP")
            if (table_name, column_name) == ("token", "created_at")
            else None
        )
        op.alter_column(
            table_name,
            column_name,
            existing_type=mysql.DATETIME(fsp=6),
            type_=mysql.DATETIME(),
            existing_nullable=nullable,
            server_default=previous_default,
        )
