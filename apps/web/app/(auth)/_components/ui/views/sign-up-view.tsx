import { SignUp } from "@clerk/nextjs";
import React from "react";

export const SignUpView = () => {
  return <SignUp routing="hash" />;
};
