import unittest

from security.rate_limit import InMemoryRateLimiter, RateLimitExceeded


class RateLimitTests(unittest.TestCase):
    def test_limits_each_caller_and_expires_window(self):
        now = [100.0]
        limiter = InMemoryRateLimiter(2, 10, clock=lambda: now[0])
        limiter.check("anon_student_1")
        limiter.check("anon_student_1")
        with self.assertRaises(RateLimitExceeded) as context:
            limiter.check("anon_student_1")
        self.assertEqual(context.exception.retry_after, 10.0)
        limiter.check("anon_student_2")
        now[0] = 110.1
        limiter.check("anon_student_1")

    def test_invalid_configuration_and_keys_fail_closed(self):
        with self.assertRaises(ValueError):
            InMemoryRateLimiter(0, 1)
        with self.assertRaises(ValueError):
            InMemoryRateLimiter(1, 0)
        limiter = InMemoryRateLimiter(1, 1)
        with self.assertRaises(ValueError):
            limiter.check(" ")


if __name__ == "__main__":
    unittest.main()
