import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

const INITIAL_CENTER = [-98.5795, 39.8283]
const INITIAL_ZOOM = 4
const INITIAL_PITCH = 55
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function App() {
  const mapRef = useRef()
  const mapContainerRef = useRef()
  const [query, setQuery] = useState('')
  const [isSatellite, setIsSatellite] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    const coords = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)
    if (coords) {
      const [, a, b] = coords
      mapRef.current.flyTo({ center: [parseFloat(b), parseFloat(a)], zoom: 12, pitch: 55 })
      return
    }

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&country=us&limit=1`
    )
    const data = await res.json()
    if (data.features?.length) {
      const [lng, lat] = data.features[0].center
      mapRef.current.flyTo({ center: [lng, lat], zoom: 12, pitch: 55 })
    }
  }

  const applyTerrain = () => {
    const map = mapRef.current
    if (map.getSource('mapbox-dem')) return

    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    })
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.25 })
  }

  const applyDarkLayers = () => {
    const map = mapRef.current
    applyTerrain()

    map.addLayer({
      id: 'hillshade',
      type: 'hillshade',
      source: 'mapbox-dem',
      paint: {
        'hillshade-exaggeration': 0.8,
        'hillshade-shadow-color': '#0a0a2e',
        'hillshade-highlight-color': '#ffe4a0',
        'hillshade-accent-color': '#2d1b69',
      },
    })

    map.addLayer({
      id: 'contour-lines',
      type: 'line',
      source: { type: 'vector', url: 'mapbox://mapbox.mapbox-terrain-v2' },
      'source-layer': 'contour',
      paint: {
        'line-color': [
          'interpolate', ['linear'], ['get', 'ele'],
          0, '#1a3a4a', 500, '#2d6b4f', 1500, '#8b6914', 3000, '#c45a3c', 4500, '#ffffff',
        ],
        'line-width': ['match', ['get', 'index'], 5, 1.2, 10, 2, 0.4],
        'line-opacity': 0.6,
      },
    })

    map.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 12,
      paint: {
        'fill-extrusion-color': '#aac',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.7,
      },
    })

    map.setFog({
      range: [1, 12],
      color: '#0f0f2e',
      'horizon-blend': 0.3,
      'high-color': '#1a0533',
      'space-color': '#000000',
      'star-intensity': 0.3,
    })

    map.setLight({ anchor: 'viewport', color: '#ffd699', intensity: 0.4, position: [1.5, 45, 30] })
  }

  const applySatelliteLayers = () => {
    const map = mapRef.current
    applyTerrain()

    map.addSource('composite-sat', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    })

    map.addLayer({
      id: '3d-buildings',
      source: 'composite-sat',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 12,
      paint: {
        'fill-extrusion-color': '#ddd',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.6,
      },
    })

    map.setFog({
      range: [0.5, 10],
      color: '#ffffff',
      'horizon-blend': 0.1,
      'high-color': '#4682b4',
      'space-color': '#000011',
      'star-intensity': 0.5,
    })

    map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.5, position: [1.5, 45, 30] })
  }

  const toggleStyle = () => {
    const map = mapRef.current
    const center = map.getCenter()
    const zoom = map.getZoom()
    const pitch = map.getPitch()
    const bearing = map.getBearing()
    const next = !isSatellite

    map.setStyle(next ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/mapbox/dark-v11')

    map.once('style.load', () => {
      map.setCenter(center)
      map.setZoom(zoom)
      map.setPitch(pitch)
      map.setBearing(bearing)
      if (next) applySatelliteLayers()
      else applyDarkLayers()
    })

    setIsSatellite(next)
  }

  useEffect(() => {
    mapboxgl.accessToken = TOKEN

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: INITIAL_PITCH,
      bearing: -10,
    })

    mapRef.current.on('style.load', () => {
      applyDarkLayers()
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

    return () => mapRef.current.remove()
  }, [])

  return (
    <>
      <form className="search-box" onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city/state or lat,lng"
        />
        <button type="submit">Go</button>
      </form>
      <button className="layer-toggle" onClick={toggleStyle}>
        {isSatellite ? '🗺️ Contour' : '🛰️ Satellite'}
      </button>
      <div id="map-container" ref={mapContainerRef} />
    </>
  )
}

export default App
