import React from 'react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  
  return (
    <div className="fitaddict-bg">
      <nav className="fitaddict-navbar">
        <div className="fitaddict-logo">FitAddict</div>
        <ul className="fitaddict-navlinks">
          <li><a href="#features">Features</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><button onClick={() => navigate('/login')} className="nav-auth-btn">Sign In</button></li>
          <li><button onClick={() => navigate('/admin/login')} className="nav-auth-btn" style={{background:'#a855f7',color:'#fff',marginLeft:8}}>Admin Login</button></li>
        </ul>
      </nav>
      <main className="fitaddict-main">
        <section className="fitaddict-hero">
          <h1>Welcome to <span>FitAddict</span></h1>
          <p>Your journey to a healthier, stronger you starts here. Track workouts, set goals, and join a community of fitness enthusiasts!</p>
          <div className="hero-buttons">
            <button onClick={() => navigate('/login')} className="fitaddict-btn">Sign in</button>
            <button onClick={() => navigate('/admin/login')} className="fitaddict-btn" style={{background:'#a855f7',color:'#fff',marginLeft:12}}>Admin Login</button>
          </div>
        </section>
        <section id="features" className="fitaddict-features">
          <h2>Features</h2>
          <div className="fitaddict-features-list">
            <div className="fitaddict-feature-card">
              <h3>Workout Tracker</h3>
              <p>Log your workouts, monitor progress, and stay motivated with detailed analytics.</p>
            </div>
            <div className="fitaddict-feature-card">
              <h3>Goal Setting</h3>
              <p>Set personal fitness goals and milestones to keep yourself accountable.</p>
            </div>
            <div className="fitaddict-feature-card">
              <h3>Community</h3>
              <p>Connect with other FitAddicts, share achievements, and join challenges.</p>
            </div>
          </div>
        </section>
        <section id="about" className="fitaddict-about">
          <h2>About FitAddict</h2>
          <p>FitAddict is designed for everyone, from beginners to pros. Our mission is to make fitness accessible, fun, and rewarding for all.</p>
        </section>
        <section id="contact" className="fitaddict-contact">
          <h2>Contact Us</h2>
          <p>Have questions or feedback? <a href="mailto:support@fitaddict.com">Email us</a> and we'll get back to you soon!</p>
        </section>
      </main>
      <footer className="fitaddict-footer">
        &copy; {new Date().getFullYear()} FitAddict. All rights reserved.
      </footer>
    </div>
  );
}

export default HomePage;