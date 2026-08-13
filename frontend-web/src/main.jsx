import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";
import "./styles/scrollbar.css";
import "./styles/animation.css";
import { initializeLoginSecurity } from "./services/loginSecurityService.js";
import WelcomeIntro from "./components/welcome/WelcomeIntro.jsx";
import { ThemeProvider } from "./theme/ThemeContext.jsx";

initializeLoginSecurity();

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <WelcomeIntro>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </WelcomeIntro>
  </ThemeProvider>
);
