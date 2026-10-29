import unittest

from app import app, users


class AuthenticationFlowTest(unittest.TestCase):
    def setUp(self):
        users.clear()
        self.client = app.test_client()

    def test_register_login_and_protected_dashboard(self):
        registered = self.client.post("/register", json={
            "name": "DriveWise Demo", "email": "demo@example.com", "password": "samplePass123"
        })
        self.assertEqual(registered.status_code, 201)

        logged_in = self.client.post("/login", json={
            "email": "demo@example.com", "password": "samplePass123"
        })
        self.assertEqual(logged_in.status_code, 200)
        token = logged_in.get_json()["token"]

        dashboard = self.client.get("/dashboard", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.get_json()["email"], "demo@example.com")
        self.assertEqual(self.client.get("/dashboard").status_code, 401)


if __name__ == "__main__":
    unittest.main()
