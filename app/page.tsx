// 'use client'

// import { useState } from 'react'
// import Header from './components/header'
// import Footer from './components/footer'
// import EmailAutomationContainer from './components/email-automation-container'

// export default function Home() {
//   const [key, setKey] = useState(0) // For resetting components

//   const handleClearAll = () => {
//     setKey(prev => prev + 1) // Force component reset
//   }

//   const handleNewAutomation = () => {
//     setKey(prev => prev + 1) // Force component reset
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-msg-subtle">
//       <Header onClear={handleClearAll} onNewAutomation={handleNewAutomation} />
      
//       <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
//         <EmailAutomationContainer key={key} />
//       </main>

//       <Footer />
//     </div>
//   )
// }

'use client'

import { useState } from 'react'
import Header from './components/header'
import Footer from './components/footer'
import UnifiedEmailProcessor from './components/unified-email-processor'

export default function Home() {
  const [key, setKey] = useState(0) // For resetting the component

  const handleClearAll = () => {
    setKey(prev => prev + 1) // Force component reset
  }

  const handleNewAutomation = () => {
    setKey(prev => prev + 1) // Force component reset
  }

  return (
    <div className="min-h-screen flex flex-col bg-msg-subtle">
      <Header onClear={handleClearAll} onNewAutomation={handleNewAutomation} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <UnifiedEmailProcessor key={key} />
      </main>

      <Footer />
    </div>
  )
}