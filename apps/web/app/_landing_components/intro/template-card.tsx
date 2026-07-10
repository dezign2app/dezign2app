import React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip'
import { Button } from '@workspace/ui/components/button'

interface TemplateCardProps {
  className?: string
  title: string
  description: string
  authorImg: string
  authorName: string
  experienceStack: { src: string; alt: string; className?: string }[],
  features: string[],
}

const TemplateCard = ({ className, title, description, authorImg, authorName, experienceStack, features }: TemplateCardProps) => {
  return (
    <div className={`w-full h-fit border overflow-hidden border-gray-200 rounded-xl shadow-lg bg-white relative group ${className || ''}`}>
      <div className='absolute inset-0 invisible group-hover:visible z-10 bg-black/20 flex items-center justify-center transition delay-300'>
        <Button variant="default" size="lg" className='bg-white text-black invisible group-hover:visible transition'>View</Button> 
      </div>
      {/* header */}
      <div
        className='h-10 w-full flex items-center px-4 justify-between'
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 16px, transparent 4px, transparent 24px)',
          backgroundPosition: 'bottom',
          backgroundSize: '100% 1px',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className='flex flex-col'>
            <p className='text-xs font-semibold text-start tracking-wider'>{title}</p>
            <p className='text-xs text-gray-600'>{description}</p>
        </div>
        <div className='flex gap-1'>
            <div className='flex gap-2 items-center'> 
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Avatar src={authorImg} alt={authorName} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className='bg-black text-white' arrowClassName='bg-black fill-black' >
                        <p>{authorName}</p>
                    </TooltipContent>
                </Tooltip>
                <div className='flex'>
                    {experienceStack.map((tech, index) => (
                        <Avatar 
                          key={index}
                          src={tech.src} 
                          className={tech.className || '-ml-1 size-4'} 
                          alt={tech.alt} 
                        />
                    ))}
                </div>
            </div>
        </div>
      </div>
      {/* body */}
      <div className='flex gap-2 h-fit min-h-20 w-full'>
        <div className='flex items-start justify-start p-2 text-xs gap-1 flex-wrap h-fit'>
          {features.map((tech, index) => (
            <div key={index} className='w-fit h-fit bg-gray-50 border px-1.5 py-0.5 rounded-md'>
              <p>{tech}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TemplateCard


const Avatar = ({src, className, alt}: {src: string, className?: string, alt: string}) => {
    return (
        <div className={`size-5 rounded-full bg-gray-200 overflow-hidden border flex items-center justify-center ${className || ''}`}>
            <img src={src} alt={alt} />
        </div>
    )
}