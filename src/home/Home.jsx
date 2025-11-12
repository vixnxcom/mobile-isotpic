import React from 'react'
import Title from './Title'
import Hero from './Hero'
import Button from './Button'
import Stats from './Stats'
import Intro from './intro/Intro'
import Foot from './foot/Foot'
import { footer, shape } from '../assets'
import WhyChooseUs from './intro/Choice'
import PaymentPlans from './intro/paymentplans/PaymentPlans'
import HeadChoice from './intro/HeadChoice'
import Image from './intro/Image'
import ImageI from './intro/ImageI'
import ImgFooter from './intro/ImgFooter'

const Home = () => {
  return (
     <div className="min-h-screen   w-full  
                    ">
             <div>
              <Title />
              </div>        
      
      <div className='mx-auto  mx-8 max-w-7xl md:mx-auto'>
        <Hero />
      </div>
      <div className='flex flex-row gap-4'>

       
   <div className='mr-1 xl:mr-10  max-w-7xl md:mx-auto '>
        <Button/>
         </div>

        <div className=' w-[60vw] mx-auto max-w-7xl md:mx-auto'>
          <Stats />
        </div>

        

      </div>
        
       <div className='w-full mx-auto max-w-7xl md:mx-auto'>
        <Intro />
        
       </div>
           

          <div className="rounded-[100px] mt-20 mb-20 blury h-[500px] flex justify-center items-center max-w-7xl md:mx-auto">
      <Image />
        </div>


       <div className='w-full mx-auto mt-20 max-w-7xl md:mx-auto'>
        <HeadChoice />
        <WhyChooseUs />
       </div>
        

  <div className="rounded-[100px] mt-20 mb-20 blury h-[500px] flex justify-center items-center max-w-7xl md:mx-auto">
  <ImageI />
</div>

       <div className='w-full mx-auto mt-20 max-w-7xl md:mx-auto'>
        <PaymentPlans/>
       </div>

      
  <div className="rounded-[100px] mt-20 mb-20 blury h-[500px]  flex justify-center items-center max-w-7xl md:mx-auto">
  <ImgFooter />
</div>

   <div className='bluish mx-auto bottom-0  rounded-t-[200px] '>
  

    {/* <div className='w-full h-[200px] bg-shape rounded-t-[200px]'></div> */}
   
   
    <div className=''>
 <Foot />
    </div>
   </div>



    </div>
  )
}

export default Home
