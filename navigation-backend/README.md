# 🚀 Navigation Backend with Obstacle Detection

## Overview

This is a **production-ready FastAPI backend** that provides:

1. **Turn-by-turn navigation** using Google Maps API
2. **Real-time obstacle detection** using Google Cloud Vision API

**Key Feature**: Navigation and vision are **completely isolated** - vision failures will never affect navigation.

---

## 🏗️ Architecture

```
FastAPI Backend
├── Navigation Service (Core - UNTOUCHED)
│   ├── /navigate - Get turn-by-turn directions
│   └── Google Maps API integration
│
└── Vision Service (New - Additive)
    ├── /vision/detect-obstacles - Detect obstacles from camera
    ├── /vision/health - Health check
    └── Google Cloud Vision API integration
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Note**: The same API key works for both Maps and Vision APIs.

### 3. Run Server

```bash
# Development
uvicorn app.main:app --reload --port 8001

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 4. Test Endpoints

```bash
# Test navigation
curl -X POST "http://localhost:8001/navigate" \
  -H "Content-Type: application/json" \
  -d '{
    "current_location": {"lat": 19.0760, "lng": 72.8777},
    "destination": "Gateway of India, Mumbai"
  }'

# Test vision health
curl "http://localhost:8001/vision/health"

# Test obstacle detection
curl -X POST "http://localhost:8001/vision/detect-obstacles" \
  -F "image=@test_image.jpg"
```

---

## 📚 API Documentation

### Navigation Endpoints

#### POST `/navigate`

Get turn-by-turn navigation from current location to destination.

**Request:**
```json
{
  "current_location": {
    "lat": 19.0760,
    "lng": 72.8777
  },
  "destination": "Gateway of India, Mumbai"
}
```

**Response:**
```json
{
  "route_mode": "walking",
  "total_distance_meters": 5420,
  "estimated_time_minutes": 68,
  "steps": [
    {
      "instruction": "Head south on XYZ Road",
      "distance_meters": 250,
      "duration_seconds": 180,
      "maneuver": "turn-left",
      "start_location": {"lat": 19.0760, "lng": 72.8777},
      "end_location": {"lat": 19.0755, "lng": 72.8780}
    }
  ],
  "polyline": "encoded_polyline_string"
}
```

---

### Vision Endpoints

#### POST `/vision/detect-obstacles`

Analyze camera frame for obstacles.

**Request:**
- Multipart form data with `image` file
- Optional: `max_results` (default: 10)

**Response:**
```json
{
  "success": true,
  "obstacles": [
    {
      "object_type": "human",
      "confidence": 0.92,
      "position": "FRONT",
      "description": "Human detected front"
    },
    {
      "object_type": "vehicle",
      "confidence": 0.87,
      "position": "RIGHT",
      "description": "Vehicle detected right"
    }
  ],
  "message": "Analysis complete"
}
```

#### GET `/vision/health`

Check vision API status.

**Response:**
```json
{
  "status": "healthy",
  "api_key_configured": true
}
```

---

## 🧪 Testing

### Automated Tests

```bash
# Run test suite
python test_api.py

# Test with specific image
python test_api.py path/to/test_image.jpg
```

### Manual Testing

```bash
# Test navigation (MUST ALWAYS WORK)
curl -X POST "http://localhost:8001/navigate" \
  -H "Content-Type: application/json" \
  -d '{
    "current_location": {"lat": 19.0760, "lng": 72.8777},
    "destination": "Marine Drive, Mumbai"
  }'

# Test obstacle detection
curl -X POST "http://localhost:8001/vision/detect-obstacles" \
  -F "image=@sample_image.jpg"
```

---

## 📦 Project Structure

```
navigation-backend/
├── app/
│   ├── api/
│   │   ├── navigate.py          # Navigation endpoints (UNTOUCHED)
│   │   └── vision.py            # Vision endpoints (NEW)
│   ├── services/
│   │   ├── google_maps.py       # Maps integration (UNTOUCHED)
│   │   └── vision_service.py    # Vision integration (NEW)
│   ├── parsers/
│   │   ├── route_parser.py      # Route parsing (UNTOUCHED)
│   │   └── obstacle_parser.py   # Obstacle parsing (NEW)
│   ├── models/
│   │   └── schemas.py           # Data models (EXTENDED)
│   ├── utils/
│   │   └── errors.py            # Error classes (EXTENDED)
│   ├── core/
│   │   └── config.py            # Configuration (UNTOUCHED)
│   └── main.py                  # FastAPI app (MINIMAL CHANGES)
├── requirements.txt             # Dependencies (EXTENDED)
├── test_api.py                  # Test suite (NEW)
├── OBSTACLE_DETECTION.md        # Documentation (NEW)
└── .env                         # Environment variables
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_MAPS_API_KEY` | Google API key with Maps + Vision enabled | Yes |

### API Key Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable APIs:
   - ✅ Directions API
   - ✅ Geocoding API
   - ✅ Cloud Vision API
3. Create API key
4. Add to `.env` file

---

## 🚀 Deployment

### Render Deployment

1. **Connect GitHub Repository**
2. **Configure Build**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Add Environment Variable**:
   - Key: `GOOGLE_MAPS_API_KEY`
   - Value: Your API key
4. **Deploy**

### Health Checks

- Navigation: `GET /navigate` (returns 405 - method not allowed, but service is up)
- Vision: `GET /vision/health` (returns status)

---

## 🔒 Security

### Rate Limiting

- Vision API: 1 request/second (configurable in `vision_service.py`)
- Navigation: No limit (adjust as needed)

### Error Handling

- All errors are caught and returned as JSON
- Vision errors don't affect navigation
- Graceful degradation on API failures

### Privacy

- Images are NOT stored
- Processed in-memory only
- No logging of image data

---

## 📊 Performance

### API Quotas

**Google Maps API (Free Tier)**:
- 40,000 requests/month

**Google Cloud Vision API (Free Tier)**:
- 1,000 requests/month

**Recommendation**: Monitor usage and upgrade to paid tier if needed.

### Optimization Tips

1. **Reduce Vision Frequency**: Increase interval to 3-5 seconds
2. **Lower Image Quality**: Use 30-50% quality
3. **Cache Results**: Cache recent detections
4. **Edge Processing**: Use TensorFlow Lite on-device

---

## 🐛 Troubleshooting

### Navigation Not Working

```bash
# Check API key
curl "http://localhost:8001/vision/health"

# Check logs
tail -f logs/app.log

# Test Google Maps API directly
curl "https://maps.googleapis.com/maps/api/directions/json?origin=19.0760,72.8777&destination=Gateway+of+India&key=YOUR_KEY"
```

### Vision API Errors

**403 Forbidden**:
- Enable Cloud Vision API in Google Cloud Console
- Verify billing is enabled

**Timeout**:
- Reduce image size
- Check network connection

**Low Accuracy**:
- Increase image quality
- Ensure good lighting
- Use higher resolution

---

## 📈 Monitoring

### Logs

```bash
# View logs
tail -f logs/app.log

# Filter vision logs
grep "vision" logs/app.log

# Filter navigation logs
grep "navigate" logs/app.log
```

### Metrics

Track:
- Request count (navigation vs vision)
- Response times
- Error rates
- API quota usage

---

## 🔄 Rollback

If anything goes wrong:

1. **Quick Disable** (no redeployment):
   ```python
   # In app/main.py
   # app.include_router(vision_router)  # Comment this line
   ```

2. **Full Rollback**:
   ```bash
   git revert HEAD
   git push
   ```

3. **Verify Navigation**:
   ```bash
   python test_api.py
   ```

---

## 📚 Documentation

- **Obstacle Detection**: See `OBSTACLE_DETECTION.md`
- **React Native Integration**: See `../REACT_NATIVE_INTEGRATION.md`
- **API Docs**: Visit `http://localhost:8001/docs` (Swagger UI)

---

## 🤝 Contributing

1. **Never modify navigation code** without explicit approval
2. **Always test navigation** after changes
3. **Ensure vision failures** don't affect navigation
4. **Document all changes**

---

## 📄 License

Same as parent project.

---

## 🆘 Support

If you encounter issues:

1. **Check health endpoint**: `/vision/health`
2. **Run test suite**: `python test_api.py`
3. **Check logs**: Look for error messages
4. **Verify API key**: Ensure all APIs are enabled
5. **Rollback if needed**: Navigation must always work

**Critical Rule**: If navigation breaks, rollback immediately. Vision is optional, navigation is essential.
