'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme, useApp } from '@/context';
import './About.css';

export default function About() {
  const { currentTheme } = useTheme();
  const { user } = useApp();

  const isDark = currentTheme.startsWith('dark');

  const missionImage = isDark ? '/assets/mission_dark.png' : '/assets/mission_light.png';
  const techStackImage = isDark ? '/assets/tech_dark.png' : '/assets/tech_light.png';
  const storyImage = isDark ? '/assets/story_dark.png' : '/assets/story_light.png';

  return (
    <div className="about-page-wrapper page-content">
      <header className="about-header">
        <h1 className="about-page-title">About TaskManagerPro</h1>
        <p className="about-page-subtitle">Your Ultimate Project Managment Partner</p>
        <div className="about-header-actions">
          {!user ? (
            <Link href="/" className="btn btn-primary about-btn-back">
               Get Started
            </Link>
          ) : (
            <>
              <Link href="/dashboard" className="btn btn-secondary about-btn-back">
                <i className="fas fa-chart-simple"></i> Back to Dashboard
              </Link>
              <Link href="/projects" className="btn btn-primary about-btn-start">
                <i className="fas fa-folder"></i> Back to Projects
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="about-main-content">
        <section className="about-section about-intro-section">
          <div className="about-text-block">
            <h2 className="about-section-title">Elevate Your Productivity</h2>
            <p className="about-paragraph">
              In today's fast-paced digital landscape, staying organised is not just a preference; it's a necessity.
              TaskManagerPro is more than just an application; it's your central hub for project success, designed from
              the ground up to streamline your workflow, boost team collaboration, and keep you on track towards your goals.
            </p>
            <p className="about-paragraph">
              Built with modern technologies, our platform provides a secure and intuitive interface for managing complex
              projects, breaking them down into achievable tasks, and monitoring progress every step of the way. Whether
              you're a solo freelancer or part of a bustling team, TaskManagerPro scales with your needs.
            </p>
          </div>
          <img
            src={missionImage}
            alt="TaskManagerPro Dashboard Conceptual Illustration"
            className="about-image about-intro-image"
          />
        </section>

        <section className="about-section about-features-section card">
          <div className="card-body about-features-body">
            <h2 className="about-section-title text-center">Power-Packed Features</h2>

            <div className="about-features-grid">
              <div className="about-feature-item">
                <div className="about-feature-icon stat-icon stat-icon-primary"><i className="fas fa-folder-open"></i></div>
                <h3 className="about-feature-title">Project Management</h3>
                <p className="about-feature-desc">Create unlimited projects, invite members, and control access with intuitive ownership controls.</p>
              </div>
              <div className="about-feature-item">
                <div className="about-feature-icon stat-icon stat-icon-warning"><i className="fas fa-tasks"></i></div>
                <h3 className="about-feature-title">Detailed Tasks</h3>
                <p className="about-feature-desc">Assign tasks, set priorities, track statuses, and add deadlines. Highlight critical items with a URL.</p>
              </div>
              <div className="about-feature-item">
                <div className="about-feature-icon stat-icon stat-icon-success"><i className="fas fa-comments"></i></div>
                <h3 className="about-feature-title">Team Collaboration</h3>
                <p className="about-feature-desc">Engage in discussions directly within tasks, share feedback, and keep everyone in the loop.</p>
              </div>
              <div className="about-feature-item">
                <div className="about-feature-icon stat-icon stat-icon-info"><i className="fas fa-bell"></i></div>
                <h3 className="about-feature-title">Real-Time Notifications</h3>
                <p className="about-feature-desc">Stay updated with in-app alerts and browser push notifications for assignments, comments, and due dates.</p>
              </div>
              <div className="about-feature-item">
                <div className="about-feature-icon"><i className="fas fa-paperclip"></i></div>
                <h3 className="about-feature-title">File Attachments</h3>
                <p className="about-feature-desc">Securely upload and share documents, images, PDFs, and zip files related to your tasks (up to 10 MB).</p>
              </div>
              <div className="about-feature-item">
                <div className="about-feature-icon"><i className="fas fa-bullhorn"></i></div>
                <h3 className="about-feature-title">Project Announcements</h3>
                <p className="about-feature-desc">Broadcast important updates to your entire team with Markdown support and pinning capabilities.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section about-story-section">
          {/* PLACEHOLDER: Image/Illustration representing a journey, growth, or the 'story' concept */}
          <img
            src={storyImage}
            alt="Conceptual illustration of a developmental journey"
            className="about-image about-story-image desktop-only"
          />
          <div className="about-text-block">
            <h2 className="about-section-title">The Journey</h2>
            <p className="about-paragraph">
              Our story began with a simple observation: existing project management tools often fell short for modern
              development workflows, being either too simplistic for complex needs or overly burdensome with features
              that rarely got used. We set out to create the platform we wanted to use ourselves – powerful yet accessible,
              feature-rich but uncluttered.
            </p>
            <p className="about-paragraph">
              Years of development, countless iterations, and invaluable feedback from early adopters have shaped
              TaskManagerPro into what it is today. Our dedication to quality, performance, and user experience remains
              unwavering, and this is just the beginning. We're constantly working on new features and improvements
              to help you work smarter, not harder.
            </p>
          </div>
          <img
            src={storyImage}
            alt="Conceptual illustration of a developmental journey"
            className="about-image about-story-image mobile-only"
          />
        </section>

        <section className="about-section about-tech-section card">
          <div className="card-body about-tech-body">
            <div className="about-tech-header-grid">
              <h2 className="about-section-title">The Engine Under The Hood</h2>
              <p className="about-section-subtitle">A powerful platform deserves powerful tech.</p>
              <img
                src={techStackImage}
                alt="Logos for Next.js, Express, PostgreSQL, Cloudinary"
                className="about-image about-tech-stack-image"
              />
            </div>
            <p className="about-paragraph text-center">
              TaskManagerPro is a modern full-stack application built for performance, security, and scalability.
              Our technology stack is meticulously chosen to deliver a seamless user experience, ensuring your data is safe and your tools are always available.
            </p>
            <div className="about-tech-list-wrapper">
              <ul className="about-tech-list">
                <li className="about-tech-list-item"><strong>Frontend:</strong> Next.js, React, Context API</li>
                <li className="about-tech-list-item"><strong>Backend:</strong> Express.js 18+, Node.js</li>
                <li className="about-tech-list-item"><strong>Database:</strong> PostgreSQL 14+</li>
              </ul>
              <ul className="about-tech-list">
                <li className="about-tech-list-item"><strong>File Storage:</strong> Cloudinary</li>
                <li className="about-tech-list-item"><strong>Authentication:</strong> JWT (Secure, state-less tokens)</li>
                <li className="about-tech-list-item"><strong>Hosting:</strong> Vercel (Frontend), Oracle Cloud (Backend, DB)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="about-section about-team-section">
          <div className="about-text-block">
            <h2 className="about-section-title text-center">Built By Visionaries, Driven By You</h2>
            <p className="about-paragraph text-center">
              While we prefer to let our work do the talking, it's worth mentioning that TaskManagerPro is the product of
              a dedicated team of developers, designers, and project managers passionate about efficiency. But the most
              important part of our team? That's you. Your usage, your feedback, and your success define our mission and drive
              our continuous innovation.
            </p>
            <p className="about-paragraph text-center">
              We are committed to transparent development and active community engagement. Have an idea for a feature?
              Found a bug? Want to share how TaskManagerPro changed your workflow? We'd love to hear from you. Your input
              directly helps us make our platform better for everyone.
            </p>
            <div className="about-team-contact">
              <Link href="#" className="btn btn-secondary about-contact-btn">
                <i className="fas fa-envelope"></i> Contact Us
              </Link>
              <Link href="#" className="btn btn-ghost about-contact-btn">
                <i className="fas fa-bug"></i> Report a Bug
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="about-footer">
        <p className="about-footer-text">&copy; 2024 TaskManagerPro Inc. All rights reserved.</p>
        <p className="about-footer-subtext">Optimising productivity, one project at a time.</p>
      </footer>
    </div>
  );
}