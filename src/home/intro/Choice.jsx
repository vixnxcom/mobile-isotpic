import React from "react";
import { flexible, friendly, insights, platform, reliable } from "../../assets";
// Example: import { BarChart, Layers, Zap, UserCheck, Shield } from "lucide-react";

const WhyChooseUs = () => {
  const features = [
    {
      title: "All-in-One Platform",
      desc: "Manage payments, inventory, invoices, and operations in a single dashboard.",
      icon: <img src={platform} className="p-4 text-purple-200" />
    },
    {
      title: "Real-Time Insights",
      desc: "Make smarter decisions with instant data visibility and analytics.",
       icon: <img src={insights} className="p-2 text-purple-200" />

    },
    {
      title: "Scalable & Flexible",
      desc: "From startups to enterprises, our ERP adapts as your business grows.",
    icon: <img src={flexible} className="p-2 text-purple-200" />
    },
    {
      title: "User-Friendly Design",
      desc: "A modern interface built with speed and simplicity in mind.",
    icon: <img src={friendly} className="p-2 text-purple-200" />
    },
    {
      title: "Reliable Support",
      desc: "Dedicated support to guide you every step of your ERP journey.",
       icon: <img src={reliable} className="p-5 text-purple-200" />
    },
  ];

  return (
    <section className="mt-5 flex flex-col justify-center items-center">
      <div className="px-6 text-center">

   


     <div className='max-w-6xl'>

      <p className='px-4 py-10 inter text-xl text-left'>
          Our ERP system is built to help you simplify operations, gain insights, 
          and scale with confidence. Here’s what makes us stand out:
        </p>
      </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 mt-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-[14px] shadow-xs border border-purple-200 p-4 hover:shadow-lg transition"
            >
              <div className="flex justify-center mb-4">
                {/* Replace with your icons */}
                <div className="w-40 h-40 flex items-center justify-center
                 rounded-full border border-purple-300">
                  {/* {feature.icon} */}
                  {feature.icon}
                </div>
              </div>
              <h3 className="inline-flex items-center justify-center
              text-xl aeon-bold  text-black 
              px-4 mb-2">
                {feature.title}
              </h3>
              <p className='p-4 max-w-[440px] text-gray-600 inter'>
                {feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
