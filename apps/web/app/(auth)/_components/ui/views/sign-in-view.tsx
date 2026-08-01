import { SignIn } from "@clerk/nextjs";
import React from "react";

export const SignInView = () => {
  return <SignIn routing="hash" />;
};
