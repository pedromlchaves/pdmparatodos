'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { LatLngTuple, Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import CustomIcon from './CustomIcon'

interface MapProps {
  onMapClick: (lat: number, lng: number) => void
  clickedCoords: LatLngTuple | null
  center: LatLngTuple
}

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function ChangeView({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function Map({ onMapClick, clickedCoords, center }: MapProps) {
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize()
    }
  }, [center])

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      whenReady={() => { mapRef.current = mapRef.current as LeafletMap }}
    >
      <ChangeView center={center} zoom={13} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClickHandler onMapClick={onMapClick} />
      {clickedCoords && (
        <Marker position={clickedCoords} icon={CustomIcon}>
          <Popup>
            You clicked here:<br />
            Lat: {clickedCoords[0].toFixed(6)}<br />
            Lng: {clickedCoords[1].toFixed(6)}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

