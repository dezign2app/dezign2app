"use client";
import { useOrganization } from "@clerk/nextjs";
import React, { ReactNode } from "react";
import { AuthLayout } from "../layouts/auth-layout";
import { OrgSelectionView } from "../views/org-selection-view";

export const OrganizationGuard = ({ children }: { children: ReactNode }) => {
  const { organization } = useOrganization();
  if (!organization) {
    return (
      <AuthLayout>
        <OrgSelectionView />
      </AuthLayout>
    );
  }
  return <>{children}</>;
};
