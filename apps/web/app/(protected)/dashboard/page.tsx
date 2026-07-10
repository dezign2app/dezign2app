"use client";
import React from "react";
import KanbanBoard from "@/app/(protected)/dashboard/_components/kanban-board";

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <KanbanBoard />
    </div>
  );
};

export default DashboardPage;
