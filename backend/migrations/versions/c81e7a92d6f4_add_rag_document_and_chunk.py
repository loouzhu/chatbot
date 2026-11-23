"""Add document and chunk tables for RAG.

Revision ID: c81e7a92d6f4
Revises: b7d2c9e04a61
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision = "c81e7a92d6f4"
down_revision = "b7d2c9e04a61"
branch_labels = None
depends_on = None


def upgrade() -> None:
    timestamp = sa.DateTime(timezone=True).with_variant(
        mysql.DATETIME(timezone=True, fsp=6), "mysql"
    )
    op.create_table(
        "document",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("chunk_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            timestamp,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_document_id", "document", ["id"])
    op.create_index("ix_document_user_id", "document", ["user_id"])

    op.create_table(
        "chunk",
        sa.Column("id", sa.String(64), nullable=False),
        sa.Column("document_id", sa.String(64), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["document_id"], ["document.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "chunk_index", name="uq_chunk_document_index"),
    )
    op.create_index("ix_chunk_id", "chunk", ["id"])
    op.create_index("ix_chunk_document_id", "chunk", ["document_id"])


def downgrade() -> None:
    op.drop_index("ix_chunk_document_id", table_name="chunk")
    op.drop_index("ix_chunk_id", table_name="chunk")
    op.drop_table("chunk")
    op.drop_index("ix_document_user_id", table_name="document")
    op.drop_index("ix_document_id", table_name="document")
    op.drop_table("document")
