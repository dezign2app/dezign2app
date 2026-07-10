import React from "react";

export const SentMessage = ({ message }: { message: string }) => {
  return (
    <div className="flex justify-end w-full">
      <div className="max-w-[90%] border bg-background w-fit px-3 py-1.5 rounded-2xl rounded-tr-sm break-words">
        <p className="text-xs">{message}</p>
      </div>
    </div>
  );
};
