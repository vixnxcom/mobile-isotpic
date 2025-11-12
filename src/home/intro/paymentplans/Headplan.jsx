import React from 'react'

const Headplan = () => {
  return (
        <div className='flex flex-col justify-center items-center mt-1 '>
  
        <div className='mx-auto '>
            <h1 className='aeon-bold  font-bold text-black tracking-wider text-3xl flex flex-row gap-2'><span>
                <div className='w-3 h-3  bg-purple-600  mt-2 shadow-xl border border-purple-700 rounded-full'></div></span>
                Payment Plans</h1>
        </div>

         <div className='max-w-6xl mt-5 mb-16'>
         <p className='px-4 py-10 inter text-xl '>
    We offer flexible payment plans to suit your budget. Our one-time payment option lets you focus on managing your 
    business - free from ongoing financial distractions.

        </p>
    </div>

    </div>
  )
}

export default Headplan
