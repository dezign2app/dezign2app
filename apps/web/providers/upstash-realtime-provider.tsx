"use client"
import React from 'react'
import { RealtimeProvider } from "@upstash/realtime/client";

const UpstashRealtimeProvider = ({children}: {children: React.ReactNode}) => {
  return (
    <RealtimeProvider api={{ url: "/api/realtime" }}>
        {children}
    </RealtimeProvider>
  )
}

export default UpstashRealtimeProvider