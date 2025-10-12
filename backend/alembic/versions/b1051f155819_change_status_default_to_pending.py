"""Change status default to pending

Revision ID: b1051f155819
Revises: 2469f349ae26
Create Date: 2025-07-23 08:36:59.995089

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1051f155819'
down_revision: Union[str, Sequence[str], None] = '2469f349ae26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
