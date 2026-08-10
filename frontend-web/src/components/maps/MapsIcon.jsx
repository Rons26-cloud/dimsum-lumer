import mapsLogo from "../../assets/images/maps.png";

export default function MapsIcon({ size = 20, className = "", alt = "" }) {
  return <img src={mapsLogo} alt={alt} width={size} height={size} loading="eager" className={`shrink-0 object-contain ${className}`.trim()} />;
}
