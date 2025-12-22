import streamlit as st
import requests

st.title("Navigation Backend Tester")

lat = st.number_input("Latitude", value= 21.101964)
lng = st.number_input("Longitude", value=79.100174)
destination = st.text_input("Destination", "nearest coffee shop")

if st.button("Navigate"):
    payload = {
        "current_location": {"lat": lat, "lng": lng},
        "destination": destination
    }

    response = requests.post("http://localhost:8001/navigate", json=payload)

    if response.status_code == 200:
        data = response.json()
        st.success(f"Route Mode: {data['route_mode']}")
        st.write("Distance (m):", data["total_distance_meters"])
        st.write("ETA (min):", data["estimated_time_minutes"])
        st.json(data["steps"])
    else:
        st.error(response.text)