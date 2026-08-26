import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";
import "./styles/scrollbar.css";
import "./styles/animation.css";
import { initializeLoginSecurity } from "./services/loginSecurityService.js";
import { ThemeProvider } from "./theme/ThemeContext.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import SeoManager from "./components/seo/SeoManager.jsx";

initializeLoginSecurity();

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <LanguageProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SeoManager />
        <App />
      </BrowserRouter>
    </LanguageProvider>
  </ThemeProvider>
);
