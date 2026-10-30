import unittest

from security.auth import AuthorizationDenied, Identity, Role, default_authorizer


class AuthTests(unittest.TestCase):
    def test_authorization_is_explicit_and_fail_closed(self):
        authorizer = default_authorizer()
        authorizer.require(Identity("anon_example01", Role.STUDENT), "read_public_lessons")
        with self.assertRaises(AuthorizationDenied):
            authorizer.require(Identity("anon_example01", Role.STUDENT), "read_audit")
        with self.assertRaises(AuthorizationDenied):
            authorizer.require(None, "read_public_lessons")

    def test_malformed_identity_is_denied_without_type_errors(self):
        authorizer = default_authorizer()
        with self.assertRaises(AuthorizationDenied):
            authorizer.require(Identity(123, Role.STUDENT), "read_public_lessons")
        with self.assertRaises(AuthorizationDenied):
            authorizer.require(Identity("anon_example01", "student"), "read_public_lessons")
        with self.assertRaises(AuthorizationDenied):
            authorizer.require(Identity("anon_example01", Role.STUDENT), None)


if __name__ == "__main__":
    unittest.main()
