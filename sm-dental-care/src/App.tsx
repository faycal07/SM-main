import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import WelcomePage from "./components/WelcomePage";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import RegisterPage from "./components/RegisterPage";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Patients from "./components/Patients";
 
const App = () => {
  return ( 
    <> 
     <ToastContainer
        position="top-right" // Position du toast
        autoClose={30000} // Durée avant la fermeture automatique (en millisecondes)
        hideProgressBar={false} // Afficher la barre de progression
        newestOnTop={true} // Afficher les nouveaux toasts en haut
        closeOnClick // Permet de fermer le toast en cliquant dessus
        pauseOnFocusLoss // Met en pause si l'utilisateur quitte la fenêtre
        draggable // Rend le toast déplaçable
        pauseOnHover // Met en pause la fermeture si l'utilisateur survole le toast
      />
    <Router>  
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
      </Routes>
    </Router>
    </>
  );
};

export default App;
