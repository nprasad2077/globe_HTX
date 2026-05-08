# Globe Contours

Interactive 3D elevation map of the USA built with Mapbox GL JS, React, and Vite. Features exaggerated terrain, contour lines, 3D buildings, and a satellite view toggle.

## Features

- 3D terrain with 2.25x elevation exaggeration
- Hillshade and elevation-colored contour lines
- 3D extruded buildings at city zoom levels
- Dark contour mode and realistic satellite mode toggle
- Search by city/state or lat,lng coordinates
- Compass and navigation controls

## Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

1. Create a `.env` file in the project root with your Mapbox access token:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

1. Start the dev server:

```bash
npm run dev
```

Open <http://localhost:5173> in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Controls

- **Scroll** — zoom in/out
- **Drag** — pan the map
- **Right-drag** — rotate and tilt
- **Compass** (top-right) — click to reset north
- **Search box** — enter a city/state or `lat,lng` and press Go
- **Layer toggle** — switch between contour and satellite views
