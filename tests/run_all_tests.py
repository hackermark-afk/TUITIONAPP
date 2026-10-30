#!/usr/bin/env python3
"""
TUITIONAPP - Automated Test Suite Runner
Runs unit and integration tests across all modules.
"""

import unittest
import sys
import os

if __name__ == "__main__":
    test_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, os.path.dirname(test_dir))
    
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=test_dir, pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    sys.exit(0 if result.wasSuccessful() else 1)
