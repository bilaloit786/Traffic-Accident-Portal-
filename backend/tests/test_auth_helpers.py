import unittest
from datetime import timedelta

from jose import jwt

from app.core.auth import ALGORITHM, SECRET_KEY, create_access_token, get_password_hash, verify_password


class AuthHelperTests(unittest.TestCase):
    def test_password_hash_verification(self):
        hashed_password = get_password_hash("strong-test-password")

        self.assertTrue(verify_password("strong-test-password", hashed_password))
        self.assertFalse(verify_password("wrong-password", hashed_password))

    def test_access_token_contains_subject_and_role(self):
        token = create_access_token(
            {"sub": "admin", "role": "admin"},
            expires_delta=timedelta(minutes=5),
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        self.assertEqual(payload["sub"], "admin")
        self.assertEqual(payload["role"], "admin")
        self.assertIn("exp", payload)


if __name__ == "__main__":
    unittest.main()
