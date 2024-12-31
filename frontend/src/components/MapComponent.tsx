"use client"

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getLocationInfo } from '../app/actions'
import { signOut } from "next-auth/react"
import { Loader2 } from 'lucide-react'
import { QuestionModal } from './QuestionModal'

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
  const [locationInfo, setLocationInfo] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
      setIsLoading(true)
      try {
        const properties = await getLocationInfo(clickedCoords[0], clickedCoords[1])
        setLocationInfo(properties)
      } catch (error) {
        console.error("Error fetching location info:", error)
        setLocationInfo(null)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const renderItemContent = (item: any) => {
    return Object.entries(item).map(([key, value]) => {
      if (key != "uuid" && key != "id_objeto")   
      {
        return (
          <li key={key} className="mb-1">
            <span className="font-semibold">{key}: </span>
            {String(value)}
          </li>
        )
      }
    return null
  }).filter(Boolean)
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
      <div className="w-full max-w-2xl h-[400px] mb-4 z-0 bg-gray-200">
        <Map 
          onMapClick={handleMapClick} 
          clickedCoords={clickedCoords} 
          center={cities[selectedCity] as Coordinates} 
        />
      </div>
      {clickedCoords && (
        <div className="bg-gray-100 p-4 rounded-md w-full max-w-2xl mb-4">
          <h2 className="text-lg font-semibold mb-2">Clicked Coordinates:</h2>
          <p>Latitude: {clickedCoords[0].toFixed(6)}</p>
          <p>Longitude: {clickedCoords[1].toFixed(6)}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button 
              onClick={handleSubmitCoordinates}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Get Location Info'
              )}
            </Button>
            {locationInfo && <QuestionModal properties={locationInfo} />}
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center w-full py-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      {!isLoading && locationInfo && (
        <div className="bg-gray-100 p-4 rounded-md w-full max-w-2xl overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Location Information:</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {Object.values(locationInfo).flat().map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                {/* @ts-expect-error need better research on types */}
                <AccordionTrigger>{item.nome || `Item ${index + 1}`}</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5">
                    {renderItemContent(item)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  )
}

