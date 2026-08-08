import React from 'react'
import { Polyline } from 'react-leaflet'

/**
 * Komponen RoutePolyline
 * Menggambar garis rute pengantaran di peta Leaflet (antara toko dan pelanggan).
 */
export default function RoutePolyline({ 
  positions, 
  color = '#f97316', 
  weight = 4, 
  opacity = 0.7, 
  dashArray = '10, 10' 
}) {
  // Validasi apakah array positions valid dan memiliki minimal 2 titik koordinat
  if (!positions || !Array.isArray(positions) || positions.length < 2) {
    return null
  }

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        opacity,
        dashArray,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  )
}