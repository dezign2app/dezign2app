"use client";
import React from "react";
import { FeatureSwitcher } from "./FeatureSwitcher";
import { EffortlessSection } from "./EffortlessSection";

export { FeatureSwitcher, EffortlessSection };

const Features = () => {
  return (
    <>
      <FeatureSwitcher />
      <EffortlessSection />
    </>
  );
};

export default Features;
