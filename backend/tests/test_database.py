import unittest
from datetime import date, datetime, time

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.database import Accident, Base, LoginAudit, User
from app.core.auth import get_password_hash


class DatabaseModelTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_accident_crud_round_trip(self):
        accident = Accident(
            latitude=32.574,
            longitude=74.075,
            datetime=datetime(2025, 3, 15, 17, 30),
            date=date(2025, 3, 15),
            time=time(17, 30),
            day_of_week="Saturday",
            hour=17,
            weather="Clear",
            road_type="Residential",
            severity="Moderate",
            injuries=2,
            fatalities=0,
            vehicles_involved=2,
            description="Unit test accident",
        )
        self.db.add(accident)
        self.db.commit()

        saved = self.db.query(Accident).filter_by(description="Unit test accident").one()
        self.assertEqual(saved.severity, "Moderate")

        saved.severity = "Severe"
        self.db.commit()
        self.assertEqual(self.db.query(Accident).filter_by(id=saved.id).one().severity, "Severe")

        self.db.delete(saved)
        self.db.commit()
        self.assertEqual(self.db.query(Accident).count(), 0)

    def test_user_unique_constraints_and_login_audit(self):
        user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("pass123"),
            role="admin",
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        audit = LoginAudit(
            username=user.username,
            user_id=user.id,
            ip_address="127.0.0.1",
            user_agent="unit-test",
            success=1,
        )
        self.db.add(audit)
        self.db.commit()

        self.assertEqual(self.db.query(User).filter_by(username="admin").one().role, "admin")
        self.assertEqual(self.db.query(LoginAudit).filter_by(user_id=user.id).count(), 1)

        duplicate = User(
            username="admin",
            email="another@example.com",
            hashed_password=get_password_hash("pass123"),
            role="user",
        )
        self.db.add(duplicate)
        with self.assertRaises(IntegrityError):
            self.db.commit()


if __name__ == "__main__":
    unittest.main()
