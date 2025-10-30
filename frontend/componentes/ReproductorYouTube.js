// Componente ReproductorYouTube:
// Reproduce trailers de YouTube (WebView/iframe), maneja errores y fullscreen.
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Platform, Dimensions, StatusBar, Text, TouchableOpacity, Linking } from 'react-native';
import Constants from 'expo-constants';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
// Nota: requiere dependencia 'react-native-webview'
import { WebView } from 'react-native-webview';

// Reproductor YouTube embebido mediante WebView
// Reproduce trailers dentro de la app usando el ID de YouTube
export default function ReproductorYouTube({
  videoId,
  onClose,
  autoFullscreenOnLandscape = true,
  autoCloseOnEnd = true,
  muted = true,
}) {
  const [isLandscape, setIsLandscape] = useState(false);
  const webRef = useRef(null);
  const [mode, setMode] = useState('embed'); // embed | nocookie | watch
  const [blocked, setBlocked] = useState(false);

  // Forzar orientación horizontal al iniciar el reproductor (móvil)
  useEffect(() => {
    const setupOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        StatusBar.setHidden(true, 'fade');
      } catch {}
    };
    if (Platform.OS !== 'web') setupOrientation();
    return () => {
      const cleanup = async () => {
        try {
          await ScreenOrientation.unlockAsync();
          StatusBar.setHidden(false, 'fade');
        } catch {}
      };
      if (Platform.OS !== 'web') cleanup();
    };
  }, [videoId]);

  // Detectar orientación para fullscreen
  useEffect(() => {
    let sub;
    const updateFromDims = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height);
    };
    updateFromDims();
    const dimsSub = Dimensions.addEventListener('change', updateFromDims);
    const subscribeOrientation = async () => {
      try {
        sub = await ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
          const o = orientationInfo.orientation;
          const landscape = o === ScreenOrientation.Orientation.LANDSCAPE_LEFT || o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
          setIsLandscape(landscape);
        });
      } catch {}
    };
    subscribeOrientation();
    return () => {
      try { if (sub) ScreenOrientation.removeOrientationChangeListener(sub); } catch {}
      try { dimsSub?.remove?.(); } catch {}
      StatusBar.setHidden(false, 'fade');
    };
  }, []);

  // Construcción de URL / HTML del reproductor
  // En web: incluir origin; en nativo: usar HTML con iframe sin origin (evita error 153)
  const baseDomain = useMemo(() => (mode === 'nocookie' ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com'), [mode]);
  let srcUrl = `${baseDomain}/${mode === 'watch' ? 'watch?v=' + videoId : `embed/${videoId}?autoplay=1&controls=1&fs=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1${muted ? '&mute=1' : ''}`}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const origin = window.location.origin;
      if (mode !== 'watch') srcUrl += `&origin=${encodeURIComponent(origin)}`;
    } catch {}
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style>html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}</style>
        ${mode === 'watch' ? '' : '<script>var onYouTubeIframeAPIReady, player;</script><script src="https://www.youtube.com/iframe_api"></script>'}
        <script>
          function postRN(data){
            try{window.ReactNativeWebView.postMessage(JSON.stringify(data));}catch(e){}
          }
          ${mode === 'watch' ? '' : `onYouTubeIframeAPIReady = function(){
            player = new YT.Player('player', {events: {onReady: function(){ try{ player.mute && player.mute(); }catch(e){}; postRN({type:'ready'}); },onStateChange: function(e){ postRN({type:'state', data: e.data}); },onError: function(e){ postRN({type:'error', code: e.data}); }}});
          }`}
        </script>
      </head>
      <body>
        ${mode === 'watch' ? `
          <iframe id="player" src="https://m.youtube.com/watch?v=${videoId}&autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen frameborder="0" style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000"></iframe>
        ` : `
          <iframe id="player" src="${baseDomain}/embed/${videoId}?autoplay=1&controls=1&fs=1&modestbranding=1&rel=0&playsinline=1${muted ? '&mute=1' : ''}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen frameborder="0" style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000"></iframe>
        `}
      </body>
    </html>`;

  return (
    <View style={estilos.root}>
      {videoId ? (
        Platform.OS === 'web' ? (
          // En web, usar iframe nativo para máximo soporte
          <iframe
            title="trailer"
            src={muted && srcUrl.indexOf('mute=1') === -1 ? srcUrl + '&mute=1' : srcUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            frameBorder="0"
            style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
          />
        ) : (
          <WebView
            ref={webRef}
            style={estilos.player}
            source={{ html, baseUrl: 'https://www.youtube.com' }}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            mixedContentMode="always"
            userAgent={
              Platform.OS === 'android'
                ? 'Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
                : undefined
            }
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data?.type === 'error') {
                  if ([150,101,5,15,153].includes(Number(data.code))) {
                    // probar siguiente modo si existe
                    if (mode === 'embed') setMode('nocookie');
                    else if (mode === 'nocookie') setMode('watch');
                    else setBlocked(true);
                  }
                }
                if (data?.type === 'state') {
                  // 0: ended, 1: playing, 2: paused, 3: buffering
                  if (Number(data.data) === 0 && autoCloseOnEnd && typeof onClose === 'function') {
                    try { onClose(); } catch {}
                  }
                }
              } catch (e) {}
            }}
          />
        )
      ) : (
        <View style={estilos.fallback}><Text style={{ color: '#fff' }}>Tráiler no disponible</Text></View>
      )}

      {/* Barra superior */}
      <View style={estilos.topBar} pointerEvents="box-none">
        {!!onClose && (
          <TouchableOpacity style={estilos.iconBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {blocked && (
        <View style={estilos.blockOverlay}>
          <Text style={estilos.blockText}>Este tráiler no permite reproducción embebida.</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, justifyContent: 'center' }}>
            <TouchableOpacity style={estilos.blockBtn} onPress={() => { setBlocked(false); setMode('watch'); }}>
              <Text style={estilos.blockBtnTxt}>Probar vista móvil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.blockBtn} onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}>
              <Text style={estilos.blockBtnTxt}>Abrir en YouTube</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  player: { flex: 1, backgroundColor: '#000' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 8, left: 8, right: 8, zIndex: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  blockOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.7)' },
  blockText: { color: '#fff', textAlign: 'center' },
  blockBtn: { backgroundColor: '#E50914', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  blockBtnTxt: { color: '#fff', fontWeight: '700' },
});
