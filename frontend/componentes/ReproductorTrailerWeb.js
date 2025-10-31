// Reproductor web para trailers (YouTube/Vimeo/URLs directas) con controles de reproducción
import React from 'react';
import ReactPlayer from 'react-player';

export default function ReproductorTrailerWeb({
  youtubeId,
  vimeoId,
  url,
  playing = true,
  muted = true,
  onReady,
  onError,
  onPlay,
  onPause,
  style,
}) {
  let source = null;
  if (youtubeId) {
    source = `https://www.youtube.com/watch?v=${youtubeId}`;
  } else if (vimeoId) {
    source = `https://vimeo.com/${vimeoId}`;
  } else if (url) {
    source = url;
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#000', ...style }}>
      {source ? (
        <ReactPlayer
          url={source}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          controls
          playsinline
          onReady={onReady}
          onError={onError}
          onPlay={onPlay}
          onPause={onPause}
          config={{
            youtube: { playerVars: { modestbranding: 1, rel: 0, fs: 1, playsinline: 1 } },
            vimeo: { playerOptions: { title: 0, byline: 0, portrait: 0 } },
          }}
        />
      ) : null}
    </div>
  );
}
