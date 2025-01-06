import { SimpleInteractionHistory } from '@/components/HistoryComponent'

const sampleInteractions = [
  {
    id: '1',
    coordinates: [40.7128, -74.0060] as [number, number],
    question: "What are the top attractions in New York City?",
    answer: "New York City offers a wealth of attractions. Some of the most popular include the Statue of Liberty, a symbol of freedom and democracy; Central Park, an urban oasis with 843 acres of green space; the Empire State Building, an iconic skyscraper with panoramic views; Times Square, known for its bright lights and bustling atmosphere; and the Metropolitan Museum of Art, home to over 2 million works of art spanning 5,000 years of human creativity.",
    articles: ["10 Must-See Attractions in NYC", "New York City Travel Guide"]
  },
  {
    id: '2',
    coordinates: [51.5074, -0.1278] as [number, number],
    question: "What's the weather like in London today?",
    answer: "Today in London, the weather is typical of its temperate climate. The current temperature is 18°C (64°F) with partly cloudy skies. There's a gentle breeze from the southwest, and humidity is at 65%. There's a 20% chance of light rain in the afternoon, so it might be wise to carry an umbrella. The weather is expected to clear up by evening, with temperatures dropping to around 13°C (55°F).",
    articles: ["London Weather Forecast", "Best Time to Visit London"]
  },
  {
    id: '3',
    coordinates: [35.6762, 139.6503] as [number, number],
    question: "What are some popular Japanese dishes in Tokyo?",
    answer: "Tokyo offers a diverse range of popular Japanese dishes. Sushi is a must-try, featuring fresh fish over vinegared rice. Ramen, a noodle soup with various toppings, is a beloved comfort food. Tempura, lightly battered and fried seafood or vegetables, is another favorite. Don't miss out on tonkatsu, a breaded and deep-fried pork cutlet. For a quick bite, try onigiri, rice balls filled with various ingredients. Lastly, experience the art of Japanese barbecue with yakiniku, where you grill your own meat at the table.",
    articles: ["Top 10 Must-Try Foods in Tokyo", "A Guide to Tokyo's Food Scene"]
  }
]

export default function Home() {
  return (
      <SimpleInteractionHistory interactions={sampleInteractions} />
  )
}

