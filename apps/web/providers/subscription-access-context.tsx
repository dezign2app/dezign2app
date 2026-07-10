"use client";

import React, { createContext, useContext } from "react";

interface SubscriptionAccessContextType {
  isReadOnly: boolean;
  showPaywall: (dismissible?: boolean) => void;
}

export const SubscriptionAccessContext = createContext<SubscriptionAccessContextType>({
  isReadOnly: false,
  showPaywall: () => {},
});

export const useSubscriptionAccess = () => useContext(SubscriptionAccessContext);
