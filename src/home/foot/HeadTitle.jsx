import React from 'react'
import { cloud } from '../../assets'

const HeadTitle = () => {
  return (
    <div className="flex flex-col justify-center items-center">      
      <div className="max-w-4xl lg:max-w-4xl mt-5">      
        <p className="inter text-blue-200 text-center"> 
          <span className='aeon-bold text-xl text-blue-200'>
            Isotxpes ERP System
          </span> empowers businesses with real-time insights and streamlined workflows.
          Secure, scalable, and built for growth, it adapts to your unique needs.
          Experience smarter decisions and simplified operations with our solution.
        </p>
      </div>
             
      <p className="inter text-blue-200 mt-5">
        Your Entire Business, One Dashboard
      </p>
        
      <div className='justify-center items-center'>
        <h1 className='aeon-bold text-xl mt-10 text-center text-blue-200'>
          For more inquiries or custom plans reach us at
        </h1>
        <p className="inter text-blue-200 text-center mt-5 underline">
          <a 
            href="mailto:contact.isotxpes@gmail.com" 
            className="text-blue-200 hover:text-blue-400 transition-colors"
          >
            contact.isotxpes@gmail.com
          </a>
        </p>
      </div>

      <div className="flex flex-col items-right mt-20">
        <h2 className="tshadow text-9xl flex opacity-50 items-center">
          <span className="text-4xl mr-3">©</span>
          ISOTXPES 2025
        </h2>
        <br />
        <p className="inter text-blue-500 mx-auto p-2">All Rights Reserved</p>
      </div>
    </div>
  )
}

export default HeadTitle
