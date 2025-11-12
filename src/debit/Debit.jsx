import React from 'react'
import { coins, credia, text } from '../assets'

const Debit = () => {
  return (
   <div className="min-h-screen bg-shapee shadow-sm rounded-[14px] border border-white">


      
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           

             <div className="bg-white mt-20 p-6 rounded-[14px] border border-gray-200">
                     <div className="text-center py-8 text-gray-500">
                       <img src={credia} className="h-25 w-25 mx-auto mb-4 " />
                       <p className="mb-2 inter">Debit Account Feature not Available</p>
                       <p className="text-sm inter">Your recently received payments will appear here.</p>
                     </div>
                   </div>

            </div>
            </div>
      
    
          
    
  )
}

export default Debit
