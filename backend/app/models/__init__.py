# app/models/__init__.py
#
# Import all ORM model classes here so SQLAlchemy registers them
# with Base.metadata before init_db() calls create_all().

from app.models.category import Category        # noqa: F401
from app.models.product  import Product         # noqa: F401
from app.models.policy   import PolicyDocument  # noqa: F401

# Future models:
# from app.models.customer import Customer  # noqa: F401
