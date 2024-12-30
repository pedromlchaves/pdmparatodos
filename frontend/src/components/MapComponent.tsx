"use client"

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getLocationInfo } from '../app/actions'
import { signOut } from "next-auth/react"

const Map = dynamic(() => import('./Map'), {
  loading: () => <p>Loading map...</p>,
  ssr: false
})

const cities = {
  Porto: [41.1579, -8.6291],
  Lisbon: [38.7223, -9.1393]
} as const

type City = keyof typeof cities
type Coordinates = [number, number]

export default function MapComponent() {
  const [selectedCity, setSelectedCity] = useState<City>('Porto')
  const [clickedCoords, setClickedCoords] = useState<Coordinates | null>(null)
  const [locationInfo, setLocationInfo] = useState<any>(null)
  const [layerName, setLayerName] = useState<string>('')

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedCoords([lat, lng])
    setLocationInfo(null)
  }, [])

  const handleCityChange = (value: City) => {
    setSelectedCity(value)
    setClickedCoords(null)
    setLocationInfo(null)
  }

  const handleSubmitCoordinates = async () => {
    if (clickedCoords) {
      const info = await getLocationInfo(clickedCoords[0], clickedCoords[1], layerName || undefined)
      setLocationInfo(info)
    }
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center relative">
      <div className="w-full flex justify-between mb-4">
        <h1 className="text-2xl font-bold">City Map</h1>
        <Button onClick={() => signOut({ callbackUrl: "/login" })}>Sign Out</Button>
      </div>
      <div className="z-10 mb-4 flex gap-4">
        <Select onValueChange={handleCityChange} value={selectedCity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a city" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(cities).map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full max-w-2xl h-[400px] mb-4 z-0">
        <Map 
          onMapClick={handleMapClick} 
          clickedCoords={clickedCoords} 
          center={cities[selectedCity] as [number, number]} 
        />
      </div>
      {clickedCoords && (
        <div className="bg-gray-100 p-4 rounded-md w-full max-w-2xl mb-4">
          <h2 className="text-lg font-semibold mb-2">Clicked Coordinates:</h2>
          <p>Latitude: {clickedCoords[0].toFixed(6)}</p>
          <p>Longitude: {clickedCoords[1].toFixed(6)}</p>
          <Button 
            onClick={handleSubmitCoordinates}
            className="mt-2"
          >
            Get Location Info
          </Button>
        </div>
      )}
      {locationInfo && (
        <div className="bg-gray-100 p-4 rounded-md w-full max-w-2xl overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Location Information:</h2>
          <pre className="text-sm">{JSON.stringify(locationInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

