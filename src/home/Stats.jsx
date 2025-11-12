import React from 'react'

const Stats = () => {
  return (
    <div className=' justify-center items-center '>

    <div className='flex flex-row gap-12 '>
      <div className='intermid w-full font-medium tracking-wide gray200'>
    <span className='text-3xl text-black aeon-bold '>100+</span>  Clients
      </div>
      <div className='intermid w-full font-medium tracking-wide gray200'>
         <span className='text-3xl text-black aeon-bold'>5</span> Star Ratings
      </div>
      <div className='intermid w-full font-medium tracking-wide gray200 '>
       <span className='text-3xl text-black aeon-bold'>99.9%</span> Productivity Boost 
      </div>
      </div>

      <div className='flex flex-row gap-12 mt-1'>
      <div className='intermid  font-medium tracking-wide gray200'>
       <span className='text-3xl text-black aeon-bold'>80%</span> Accelerate reporting
      </div>
      <div className='intermid  font-medium tracking-wide gray200'>
       <span className='text-3xl text-black aeon-bold'>24/7</span> Customer Support
      </div>
    </div>
    </div>
  )
}

export default Stats
