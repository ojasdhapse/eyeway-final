#!/usr/bin/env python3
"""
Test script for obstacle detection API
Tests both navigation and vision endpoints to ensure isolation
"""

import requests
import json
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8001"
NAVIGATION_ENDPOINT = f"{BASE_URL}/navigate"
VISION_ENDPOINT = f"{BASE_URL}/vision/detect-obstacles"
VISION_HEALTH_ENDPOINT = f"{BASE_URL}/vision/health"

# Test data
TEST_LOCATION = {
    "current_location": {
        "lat": 19.0760,
        "lng": 72.8777
    },
    "destination": "Gateway of India, Mumbai"
}

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def test_vision_health():
    """Test vision API health check"""
    print_header("Testing Vision API Health Check")
    
    try:
        response = requests.get(VISION_HEALTH_ENDPOINT, timeout=5)
        data = response.json()
        
        if response.status_code == 200:
            print_success(f"Vision API is {data.get('status', 'unknown')}")
            print_info(f"API Key Configured: {data.get('api_key_configured', False)}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check error: {e}")
        return False

def test_navigation():
    """Test that navigation still works (CRITICAL)"""
    print_header("Testing Navigation Endpoint (MUST WORK)")
    
    try:
        response = requests.post(
            NAVIGATION_ENDPOINT,
            json=TEST_LOCATION,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Navigation endpoint working!")
            print_info(f"Route Mode: {data.get('route_mode', 'N/A')}")
            print_info(f"Distance: {data.get('total_distance_meters', 0)/1000:.1f} km")
            print_info(f"Time: {data.get('estimated_time_minutes', 0)} minutes")
            return True
        else:
            print_error(f"Navigation failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Navigation error: {e}")
        return False

def test_vision_with_image(image_path):
    """Test vision API with actual image"""
    print_header(f"Testing Vision API with Image: {image_path}")
    
    if not Path(image_path).exists():
        print_error(f"Image not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': ('test.jpg', f, 'image/jpeg')}
            response = requests.post(
                VISION_ENDPOINT,
                files=files,
                timeout=10
            )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Vision API responded: {data.get('message', 'N/A')}")
            
            if data.get('success'):
                obstacles = data.get('obstacles', [])
                print_info(f"Detected {len(obstacles)} obstacle(s)")
                
                for i, obs in enumerate(obstacles, 1):
                    print(f"\n  Obstacle {i}:")
                    print(f"    Type: {obs.get('object_type', 'unknown')}")
                    print(f"    Position: {obs.get('position', 'unknown')}")
                    print(f"    Confidence: {obs.get('confidence', 0):.2%}")
                    print(f"    Description: {obs.get('description', 'N/A')}")
                
                return True
            else:
                print_error(f"Vision API failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print_error(f"Vision API error: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Vision API error: {e}")
        return False

def test_vision_error_handling():
    """Test that vision errors don't crash the server"""
    print_header("Testing Vision Error Handling")
    
    try:
        # Send invalid data
        response = requests.post(
            VISION_ENDPOINT,
            files={'image': ('test.txt', b'not an image', 'text/plain')},
            timeout=10
        )
        
        # Should return 200 with success=False, not crash
        if response.status_code == 200:
            data = response.json()
            if not data.get('success'):
                print_success("Vision API handles errors gracefully")
                print_info(f"Error message: {data.get('message', 'N/A')}")
                return True
            else:
                print_error("Vision API should have failed with invalid image")
                return False
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error handling test failed: {e}")
        return False

def test_navigation_after_vision_error():
    """CRITICAL: Ensure navigation works after vision error"""
    print_header("Testing Navigation After Vision Error (CRITICAL)")
    
    # First cause a vision error
    try:
        requests.post(
            VISION_ENDPOINT,
            files={'image': ('bad.txt', b'bad data', 'text/plain')},
            timeout=5
        )
    except:
        pass
    
    # Now test navigation
    return test_navigation()

def main():
    """Run all tests"""
    print_header("🧪 Obstacle Detection API Test Suite")
    print_info("Testing backend integration and isolation")
    
    results = {
        "Vision Health Check": test_vision_health(),
        "Navigation Endpoint": test_navigation(),
        "Vision Error Handling": test_vision_error_handling(),
        "Navigation After Vision Error": test_navigation_after_vision_error(),
    }
    
    # Optional: Test with actual image if provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        results["Vision with Image"] = test_vision_with_image(image_path)
    else:
        print_info("\nTo test with an image, run: python test_api.py path/to/image.jpg")
    
    # Summary
    print_header("📊 Test Results Summary")
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    # Critical check
    if not results.get("Navigation Endpoint"):
        print("\n" + "!"*60)
        print("  ⚠️  CRITICAL: NAVIGATION IS BROKEN!")
        print("  This should NEVER happen. Rollback immediately.")
        print("!"*60)
        sys.exit(1)
    
    if passed == total:
        print_success("\n🎉 All tests passed! Integration successful.")
        sys.exit(0)
    else:
        print_error(f"\n⚠️  {total - passed} test(s) failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
