"use client"

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getLocationInfo } from '../app/actions'
import { Loader2 } from 'lucide-react'
import { QuestionModal } from './QuestionModal'
import { Label } from "@/components/ui/label"
import { Footer } from './Footer'
import { Header } from './Header'
import { getSession } from "next-auth/react";

const Map = dynamic(() => import('./Map'), {
  loading: () => <p>Loading map...</p>,
  ssr: false
})

const cities = {
  Porto: [41.1579, -8.6291]
} as const

type City = keyof typeof cities
type Coordinates = [number, number]

export default function MapComponent() {
  const [selectedCity, setSelectedCity] = useState<City>('Porto')
  const [clickedCoords, setClickedCoords] = useState<Coordinates | null>(null)
  const [locationInfo, setLocationInfo] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInfoLoaded, setIsInfoLoaded] = useState(false)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedCoords([lat, lng])
    setLocationInfo(null)
    setIsInfoLoaded(false)
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
        const session = await getSession()
        const token = session?.user?.access_token
        if (!token) {
          throw new Error("No access token found");
        }
        const properties = await getLocationInfo(clickedCoords[0], clickedCoords[1], selectedCity, token)
        console.log(selectedCity)
        setLocationInfo(properties)
      } catch (error) {
        console.error("Error fetching location info:", error)
        setLocationInfo(null)
      } finally {
        setIsLoading(false)
        setIsInfoLoaded(true)
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow p-4">
      <div className="container mx-auto w-full max-w-[75%]">
          <div className="mb-4">
            <Label htmlFor="city-select" className="text-sm font-medium">
              Seleccione um Município
            </Label>
            <Select onValueChange={handleCityChange} value={selectedCity}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Seleccione um Município" />
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
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-3/4 z-0">
              <div className="h-[400px] bg-white rounded-lg overflow-hidden shadow-md">
                <Map 
                  onMapClick={handleMapClick} 
                  clickedCoords={clickedCoords} 
                  center={cities[selectedCity] as Coordinates} 
                />
              </div>
            </div>
            <div className="w-full md:w-1/4">
              <div className="bg-white p-4 rounded-lg shadow-md h-[400px] flex flex-col">
                <div className="flex-grow">
                  <h2 className="text-lg font-semibold mb-2">
                    {clickedCoords ? "Coordenadas seleccionadas:" : "Seleccione coordenadas"}
                  </h2>
                  {clickedCoords ? (
                    <>
                      <p>Latitude: {clickedCoords[0].toFixed(6)}</p>
                      <p>Longitude: {clickedCoords[1].toFixed(6)}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">Clique no mapa para seleccionar coordenadas</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleSubmitCoordinates}
                    disabled={isLoading || !clickedCoords}
                    className="w-full h-10"
                  >
                    <span className="mr-2">Obter Informação</span>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </Button>
                  <QuestionModal 
                    properties={locationInfo} 
                    selectedCity={selectedCity}
                    disabled={!isInfoLoaded}
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            {isLoading && (
              <div className="flex items-center justify-center w-full h-[200px] bg-white rounded-lg shadow-md">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {!isLoading && locationInfo && (
              <div
              className="bg-white p-6 rounded-lg shadow-md max-h-[400px] overflow-auto"
            >
                <h2 className="text-lg font-semibold mb-2">Informação da Localização:</h2>
                <Accordion type="single" collapsible className="w-full">
                  {Object.values(locationInfo).flat().map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>
                      {/* @ts-expect-error need better research on types */}
                      {item.nome?.startsWith("PDM") ? <strong>{item.nome}</strong> : item.nome || `Item ${index + 1}`}
                      </AccordionTrigger> 
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
        </div>
      </main>
      <Footer />
    </div>
  )
}

