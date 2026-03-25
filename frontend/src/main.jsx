import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="136129495804-ce890rf6o3c59u3hmjfhhlobig6dsal6.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)
