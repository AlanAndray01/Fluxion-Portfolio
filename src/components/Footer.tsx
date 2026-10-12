'use client';

import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        <div className="footer-col brand-col">
          <a href="#" className="navbar-brand footer-brand">Fluxion</a>
          <p className="brand-desc">Research &amp; Development in 3D Collisions and WebGL Experiences.</p>
          <ul className="footer-social-links">
            <li><a href="#" aria-label="Discord"><i className="fa-brands fa-discord"></i></a></li>
            <li><a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a></li>
            <li><a href="#" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp"></i></a></li>
            <li><a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a></li>
          </ul>
        </div>
        
        <div className="footer-row-mobile">
          <div className="footer-col">
            <h3>Contact</h3>
            <ul className="footer-link-list">
              <li><a href="mailto:arslanshah.dev@gmail.com">arslanshah.dev@gmail.com</a></li>
              <li><a href="tel:03285393128">03285393128</a></li>
              <li><span>FSD, Pakistan</span></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Navigation</h3>
            <ul className="footer-link-list">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#projects">Work</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Fluxion. All rights reserved.
      </div>
    </footer>
  );
}
