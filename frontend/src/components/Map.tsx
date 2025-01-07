'use client'

import { useEffect, useRef } from 'react'
import { useMapEvents, useMap } from 'react-leaflet'
import { LatLngTuple, Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import CustomIcon from './CustomIcon'
// Dynamically import the MapContainer component to ensure it only runs on the client side
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface MapProps {
  onMapClick?: (lat: number, lng: number) => void
  clickedCoords?: LatLngTuple | null
  center?: LatLngTuple
  coordinates?: LatLngTuple
  markers?: LatLngTuple[]
  zoom?: number
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

export default function Map({ onMapClick, clickedCoords, center, coordinates, markers = [], zoom=13}: MapProps) {
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize()
    }
  }, [center])

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      whenReady={() => { mapRef.current = mapRef.current as LeafletMap }}
    >
      {center && <ChangeView center={center} zoom={zoom} />}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {coordinates && <Marker position={coordinates} />}
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      {clickedCoords && (
        <Marker position={clickedCoords} icon={CustomIcon}></Marker>
      )}
      {markers.map((marker, index) => (
        <Marker key={index} position={marker} icon={CustomIcon}/>
      ))}
    </MapContainer>
  )
}

