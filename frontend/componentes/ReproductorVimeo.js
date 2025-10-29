import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';

export default function ReproductorVimeo({ videoId, onClose }) {
  useEffect(() => {
    const lock = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        StatusBar.setHidden(true, 'fade');
      } catch {}
    };
    if (Platform.OS !== 'web') lock();
    return () => {
      const unlock = async () => {
        try {
          await ScreenOrientation.unlockAsync();
          StatusBar.setHidden(false, 'fade');
        } catch {}
      };
      if (Platform.OS !== 'web') unlock();
    };
  }, [videoId]);

  const src = `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`;

  return (
    <View style={estilos.root}>
      {Platform.OS === 'web' ? (
        <iframe
          title="vimeo"
          src={src}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          frameBorder="0"
          style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        />
      ) : (
        <WebView
          style={estilos.player}
          allowsFullscreenVideo
          source={{ uri: src }}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
        />
      )}
      <View style={estilos.topBar}>
        {!!onClose && (
          <TouchableOpacity onPress={onClose} style={estilos.iconBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  player: { flex: 1, backgroundColor: '#000' },
  topBar: { position: 'absolute', top: 8, left: 8, right: 8, zIndex: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
});