import React from 'react'

const Body = ({children}: {children: React.ReactNode}) => {
  return (
    <section className="px-4 lg:px-20 size-full flex-1 flex justify-center w-full">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `
            repeating-linear-gradient(180deg, #e5e7eb 0px, #e5e7eb 16px, transparent 16px, transparent 24px),
            repeating-linear-gradient(180deg, #e5e7eb 0px, #e5e7eb 16px, transparent 16px, transparent 24px)
          `,
          backgroundPosition: 'left, right',
          backgroundSize: '1px 100%, 1px 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {children}
      </div>
    </section>
  )
}

export default Body