import DashboardUninvited from './pages/DashboardUninvited';
import AdminDashboard from './pages/AdminDashboard';
import TrainerList from './components/TrainerList';
import InviteTrainer from './components/InviteTrainer';
import AdminUsers from './pages/AdminUsers';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import AdminTrainerView from "./pages/AdminTrainerView";
import AdminTraineeView from "./pages/AdminTraineeView";
import AdminTrainerVideos from "./pages/AdminTrainerVideos";
import TrainerVideos from './pages/TrainerVideos';
import AdminReviewVideos from './pages/AdminReviewVideos';


import { LoadingProvider } from "./contexts/LoadingProvider";   // LOADING
import "./components/Dashboard.css";         

import Login from './pages/Login';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import TraineeList from './pages/TraineeList';
import TraineeProfile from './pages/TraineeProfile';
import TraineePage from './pages/TraineePage';
import TrainerPage from './pages/TrainerPage';
import AdminLogin from './pages/AdminLogin';
import GoogleOAuthCallback from './pages/GoogleOAuthCallback';

import UploadVideo from './pages/UploadVideo';
import TraineeAnalyticsPage from "./pages/TraineeAnalyticsPage";
import WorkoutPage from './pages/WorkoutPage'; 


// ...existing code...

import './App.css';

function App() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoadingProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            {/* <Route path="/register" element={<Register />} /> */}
            <Route path="/home" element={<Dashboard />} />
            <Route path="/trainer/trainees/:traineeId" element={<TraineeAnalyticsPage />} />
            
            <Route path="/admin/login" element={<AdminLogin />} />
            {/* <Route path="/InviteTrainee" element={<InviteTrainee />} /> */}
            <Route path="/TraineeList" element={<TraineeList />} />
            <Route path="/TraineeProfile" element={<TraineeProfile />} />
            <Route path="/trainees/:id" element={<TraineeProfile />} />
            <Route path="/trainee" element={<TraineePage />} />
            <Route path="/workout/:videoId" element={<WorkoutPage />} />
            
            {/* Trainer routes */}
            <Route path="/trainer" element={<TrainerPage />} />
            <Route path="/trainer/invite" element={<InviteTrainer />} />
            <Route path="/trainer/list" element={<TrainerList />} />
            {/* <Route path="/trainers/:id" element={<TrainerProfile />} /> */}

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
            <Route path="/dashboard-uninvited" element={<DashboardUninvited />} />

            <Route path="/trainer/upload" element={<UploadVideo />} />
            <Route path="/trainer/videos" element={<TrainerVideos />} />
            {/* admin */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/trainers/:trainerId" element={<AdminTrainerView />} />
            <Route path="/admin/trainees/:traineeId" element={<AdminTraineeView />} />
            <Route path="/admin/trainers/:trainerId/videos" element={<AdminTrainerVideos />} />
            <Route path="/admin/review-videos" element={<AdminReviewVideos />} />
          </Routes>
        </div>
      </Router>
      </LoadingProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
