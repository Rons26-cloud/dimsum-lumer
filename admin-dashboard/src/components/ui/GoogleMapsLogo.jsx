import googleMapsLogo from "../../assets/google-maps-logo.svg";

export default function GoogleMapsLogo({ size=18, className="" }) {
  return <img src={googleMapsLogo} alt="" aria-hidden="true" width={size} height={size} className={`shrink-0 object-contain ${className}`}/>;
}
