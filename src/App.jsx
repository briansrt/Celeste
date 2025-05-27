import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './App.css'
import Celeste from './components/Celeste'
import RequireAuth from './components/RequireAuth'
import Register from './components/Register'
import { ToastContainer } from 'react-toastify';
import Login from './components/Login'
import 'react-toastify/dist/ReactToastify.css';

function App() {

  return (
    <BrowserRouter>
      {/* <Navigation/> */}
      <Routes>
        <Route index element={<Login />}></Route>
        <Route path="/Celeste" element={<RequireAuth> <Celeste /></RequireAuth>}></Route>
        <Route path="/Register" element={<Register />}></Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </BrowserRouter>
  )
}

export default App
