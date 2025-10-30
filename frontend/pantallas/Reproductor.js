// /**
//  * Pantalla: Reproductor
//  *
//  * Propósito
//  * - Obtiene el video principal (tráiler) de un contenido por `tipo` e `id`.
//  * - Renderiza `ReproductorVideo` con el identificador resultante.
//  *
//  * Props clave
//  * - `tipo`: 'movie' | 'tv' (por defecto 'movie').
//  * - `id`: número/identificador TMDB del contenido.
//  */
// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
// import ReproductorVideo from '../componentes/ReproductorVideo';
// import { obtenerVideosContenido } from '../servicios/api';

// export default function Reproductor({ tipo = 'movie', id }) {
//   const [videoId, setVideoId] = useState(null);
//   const [cargando, setCargando] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         const datos = await obtenerVideosContenido(tipo, id);
//         const principal = datos?.trailer_principal;
//         setVideoId(principal?.key || null);
//       } catch (e) {
//         setError(e.message);
//       } finally {
//         setCargando(false);
//       }
//     })();
//   }, [tipo, id]);

//   if (cargando) return <View style={estilos.centro}><ActivityIndicator size="large" /></View>;
//   if (error) return <View style={estilos.centro}><Text style={{ color: '#fff' }}>Error: {error}</Text></View>;

//   return <ReproductorVideo videoId={videoId} />;
// }

// const estilos = StyleSheet.create({
//   centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#141414' },
// });