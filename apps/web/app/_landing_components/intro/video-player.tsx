import React from "react";

const VideoPlayer = ({src}: {src: string}) => {
  return (
    <iframe
      width="100%"
      height="100%"
      src={src}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="absolute inset-0 w-full h-full"
    />
  );
};

export default VideoPlayer;