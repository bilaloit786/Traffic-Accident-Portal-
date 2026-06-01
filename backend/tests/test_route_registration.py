import unittest

from app.main import app


class RouteRegistrationTests(unittest.TestCase):
    def test_core_routes_are_registered(self):
        route_paths = {route.path for route in app.routes}

        expected_paths = {
            "/",
            "/health",
            "/token",
            "/register",
            "/users/me",
            "/api/admin/users",
            "/api/admin/login-activity",
            "/api/admin/security-summary",
            "/api/accidents/",
            "/api/accidents/{accident_id}",
            "/api/accidents/heatmap/data",
            "/api/stats/overview",
            "/api/stats/by-time",
            "/api/predictions/predict",
            "/api/predictions/hotspots",
            "/api/reports/generate",
        }

        self.assertTrue(expected_paths.issubset(route_paths))

    def test_admin_update_routes_support_patch(self):
        patch_routes = {
            route.path
            for route in app.routes
            if hasattr(route, "methods") and "PATCH" in route.methods
        }

        self.assertIn("/api/admin/users/{user_id}/role", patch_routes)
        self.assertIn("/api/admin/users/{user_id}/status", patch_routes)


if __name__ == "__main__":
    unittest.main()
