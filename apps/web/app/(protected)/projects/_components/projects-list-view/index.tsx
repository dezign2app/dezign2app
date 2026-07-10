import React from "react";
import { ProjectListHeader } from "./project-list-header";
import { ProjectsGrid } from "./projects-grid";

export const ProjectsListView = () => {
  return (
    <div className="w-full bg-background hide-scrollbar flex flex-col relative h-full">
      <ProjectListHeader />
      <ProjectsGrid />
    </div>
  );
};
