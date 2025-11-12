import React from 'react'
import Headplan from './Headplan'
import Starter from './Starter'
import Basic from './Basic'
import Premium from './Premium'

const PaymentPlans = () => {
  return (
    <div className='w-full mx-auto'>
      <div>
        <Headplan />
      </div>

      {/* First row */}
      <div className='flex flex-row justify-center items-center gap-8'>
        <div className='rounded-[14px] w-[470px]  h-[500px] shadow-lg border border-purple-100 flex flex-start'>
          <Starter />
        </div>
        <div className='rounded-[14px]  w-[470px] h-[500px] shadow-lg border border-purple-100 flex flex-start'>
          <Basic />
        </div>
      </div>

      {/* Second row (Premium aligned with Starter) */}
      <div className='flex justify-start ml-[calc((100%-470px*2-2rem)/2)]'>
        <div className='rounded-[14px] w-[470px] mt-10 h-[500px] shadow-lg border border-purple-100 flex flex-start'>
          <Premium />
        </div>
      </div>
    </div>
  )
}

export default PaymentPlans
