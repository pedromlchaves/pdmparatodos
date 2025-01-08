"use client"

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getLocationInfo, getResponseCount } from '../app/actions'
import { Loader2 } from 'lucide-react'
import { QuestionModal } from './QuestionModal'
import { Label } from "@/components/ui/label"
import { Footer } from './Footer'
import { Header } from './Header'
import { getSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingAlert } from './FloatingAlert'
import { Input } from "@/components/ui/input"
import { getGeocodingInfo } from '../app/actions'

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
  const [responseCount, setResponseCount] = useState<number | null>(null)
  const [responselimit, setResponseLimit] = useState<number | null>(null)
  const [disableQuestion, setDisableQuestion] = useState(Boolean)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState(String)
  const [address, setAddress] = useState<string>("")

  useEffect(() => {
    const fetchResponseCount = async () => {
      try {
        const session = await getSession()
        const token = session?.user?.access_token
        if (!token) {
          throw new Error("No access token found");
        }
        const { questions_asked, limit } = await getResponseCount(token)
        console.log(questions_asked)
        console.log(limit)
        if (questions_asked > limit) {
          setDisableQuestion(true)
          setAlertMessage("Excedeu o limite mensal de perguntas.")
          setShowAlert(true)
        } else { 
          setDisableQuestion(false)
        }
        console.log(disableQuestion)
      } catch (error) {
        console.error("Error fetching response count:", error)
      }
    }

    fetchResponseCount()
  }, [])

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

  const handleShowAlert = () => {
    setShowAlert(true)
  }

  const handleCloseAlert = () => {
    setShowAlert(false)
  }

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value)
    
  }

  const handleAddressKeyPress = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()

      // Example: Fetch coordinates based on the address
      const geodata = await getGeocodingInfo(address)
      const coords = [geodata.results[0].geometry.location['lat'], geodata.results[0].geometry.location['lng']] as Coordinates
      setClickedCoords(coords)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <FloatingAlert
        title="Atenção"
        description={alertMessage}
        show={showAlert}
        onClose={handleCloseAlert}
        variant="red"
      />
      <main className="flex-grow p-4">
        <div className="container mx-auto w-full max-w-[75%]">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>
                <Label htmlFor="city-select" className="text-sm font-medium">
                  Seleccione um Município
                </Label>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Card className="w-full md:w-3/4 z-0">
              <CardContent className="p-0   flex-1 h-[400px] bg-white rounded-lg overflow-hidden shadow-md">
                  <Map 
                    onMapClick={handleMapClick} 
                    clickedCoords={clickedCoords} 
                    center={cities[selectedCity] as Coordinates} 
                  />
              </CardContent>
            </Card>
            <Card className="w-full md:w-1/4">
              <CardContent className="bg-white p-4 rounded-lg shadow-md h-[400px] flex flex-col">
                <div className="flex-grow">
                  <h2 className="text-lg font-semibold mb-2">
                    {clickedCoords ? "Local seleccionado:" : "Seleccione um local"}
                  </h2>
                  {clickedCoords ? (
                    <>
                      <p>Latitude: {clickedCoords[0].toFixed(6)}</p>
                      <p>Longitude: {clickedCoords[1].toFixed(6)}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">Clique no mapa para seleccionar coordenadas</p>
                  )}
                  <div className="mt-4">
                    <Label htmlFor="address-input" className="text-sm font-medium">
                      Ou introduza a morada:
                    </Label>
                    <Input 
                      id="address-input"
                      value={address}
                      onChange={handleAddressChange}
                      onKeyPress={handleAddressKeyPress}
                      placeholder="e.g. Rua de Ceuta, Porto"
                      className="mt-2"
                    />
                  </div>
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
                    lat={clickedCoords ? clickedCoords[0] : 0}
                    lon={clickedCoords ? clickedCoords[1] : 0}
                    properties={locationInfo} 
                    selectedCity={selectedCity}
                    disabled={!isInfoLoaded || disableQuestion}
                    tooltip={disableQuestion ? "You have exceeded your monthly question limit." : ""}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          {!isLoading && isInfoLoaded && locationInfo && (
            <Card>
              <CardContent className='p-0'>
                <div className="p-4 bg-white rounded-lg shadow-md max-h-[400px] overflow-auto">
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
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

