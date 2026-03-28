import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  Home as HomeIcon, 
  Users, 
  UserPlus, 
  Shield, 
  FileText, 
  Download, 
  PhoneCall, 
  Mail, 
  Instagram, 
  Facebook, 
  Twitter,
  ChevronRight,
  Menu,
  X,
  Star,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';

// --- Components ---
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <nav className={`${scrolled ? 'scrolled' : ''} ${mobileOpen ? 'mobile-nav-open' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="logo">Anushthan</Link>
        
        <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>For Users</Link>
          <Link to="/pandits" className={`nav-link ${location.pathname === '/pandits' ? 'active' : ''}`}>For Pandits</Link>
          <Link to="/privacy" className={`nav-link ${location.pathname === '/privacy' ? 'active' : ''}`}>Privacy</Link>
          <Link to="/terms" className={`nav-link ${location.pathname === '/terms' ? 'active' : ''}`}>Terms</Link>
          <a href="#download" className="btn-primary nav-download-btn">Download Now</a>
        </div>

        <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
           {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer>
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <h2 className="footer-logo">Anushthan</h2>
          <p className="footer-desc">
            Bridging the gap between sacred traditions and modern convenience. 
            Discover spiritual serenity with Anushthan—your trusted platform for authentic rituals and Pandits.
          </p>
          <div className="social-links">
            <Instagram size={24} />
            <Facebook size={24} />
            <Twitter size={24} />
          </div>
        </div>
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/users">For Users</Link></li>
            <li><Link to="/pandits">For Pandits</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <ul className="footer-links">
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><a href="mailto:support@anushthan.com">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 Anushthan. All spiritual rights reserved.</p>
        <p>Made with devotion by Karios Team</p>
      </div>
    </div>
  </footer>
);

// --- Pages ---

const Hero = () => (
  <section className="hero">
    <div className="container">
      <div className="hero-content fade-up">
        <span className="badge">Authentic Spiritual Services</span>
        <h1 className="hero-title">Discover Serenity. <br/>Book Your Sacred Rituals.</h1>
        <p className="hero-subtitle">
          Anushthan connects you with experienced and verified Pandits for all your religious needs—from birth ceremonies to festive pujas.
        </p>
        <div className="hero-btns">
          <a href="#download" className="btn-primary">Download App <Download size={18} /></a>
          <Link to="/users" className="btn-outline">How it Works</Link>
        </div>
      </div>
    </div>
    {/* Background Glows */}
    <div className="hero-glow" />
  </section>
);

const Home = () => (
  <>
    <Hero />
    <section className="features-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Why Choose Anushthan?</h2>
          <p className="section-subtitle"> We combine tradition with technology to bring you a seamless spiritual experience. </p>
        </div>
        <div className="features-grid">
          {[
            { title: 'Verified Pandits', desc: 'Every priest on our platform undergoes a rigorous verification process to ensure authenticity.', icon: <CheckCircle2 size={40} color="var(--primary)" /> },
            { title: 'Wide Range of Services', desc: 'From Griha Pravesh to Satyanarayan Puja, find every ritual you need.', icon: <Users size={40} color="var(--primary)" /> },
            { title: 'Transparent Pricing', desc: 'Fixed rates for all services, ensuring no hidden costs or last-minute surprises.', icon: <Star size={40} color="var(--primary)" /> }
          ].map((item, idx) => (
            <div key={idx} className="glass-card feature-card">
              <div className="feature-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    
    <section id="download" className="cta-section">
      <div className="container cta-container">
        <h2 className="cta-title">Available on All Devices</h2>
        <p className="cta-subtitle">Download the Anushthan app today and take your spiritual journey to the next level.</p>
        <div className="cta-btns">
          <button className="btn-white">App Store</button>
          <button className="btn-white">Google Play</button>
        </div>
      </div>
    </section>
  </>
);

const ForUsers = () => (
  <section className="split-page">
    <div className="container">
       <span className="badge">Devotee Portal</span>
       <h1 className="hero-title">Experience Serenity <br/> at Your Fingertips</h1>
       <div className="split-content">
          <div className="steps-container">
            <h2 className="split-title">How to Book?</h2>
            <div className="steps-list">
              {[
                { step: '01', title: 'Choose Your Service', desc: 'Browse through hundreds of Vedic services and pujas tailored to your needs.' },
                { step: '02', title: 'Pick a Date & Time', desc: 'Select a convenient time slot that fits your schedule.' },
                { step: '03', title: 'Expert Pandit Assigned', desc: 'We match you with the best-rated Pandit available in your locality.' },
                { step: '04', title: 'Experience the Devotion', desc: 'Focus on your prayer while we handle all the logistical arrangements.' }
              ].map((item, idx) => (
                <div key={idx} className="step-item">
                  <span className="step-number">{item.step}</span>
                  <div>
                    <h3 className="step-title">{item.title}</h3>
                    <p className="step-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card side-card">
            <h2 className="split-title">Benefits for You</h2>
            <ul className="benefit-list">
               {[
                 'Authentic Vedic rituals performed by certified experts',
                 'Hassle-free experience: We bring the materials (Puja Samagri)',
                 'Support in multiple languages',
                 'Secure online payments and 24/7 assistance'
               ].map((text, i) => (
                 <li key={i} className="benefit-item">
                   <CheckCircle2 size={18} color="var(--primary)" />
                   <span>{text}</span>
                 </li>
               ))}
            </ul>
          </div>
       </div>
    </div>
  </section>
);

const ForPandits = () => (
  <section className="split-page">
    <div className="container">
       <span className="badge">Pandit Community</span>
       <h1 className="hero-title">Grow Your Seva. <br/>Reach More Devotees.</h1>
       <div className="split-content reverse">
          <div className="glass-card side-card">
            <h2 className="split-title">Why Join Us?</h2>
            <ul className="benefit-list">
               {[
                 'Direct access to thousands of devotees looking for services',
                 'Easy scheduling and booking management through our app',
                 'Reliable and timely payments directly to your account',
                 'Help build your digital reputation with ratings and reviews'
               ].map((text, i) => (
                 <li key={i} className="benefit-item">
                   <CheckCircle2 size={18} color="var(--primary)" />
                   <span>{text}</span>
                 </li>
               ))}
            </ul>
          </div>
          <div className="steps-container">
            <h2 className="split-title">The Onboarding Process</h2>
            <div className="steps-list">
              {[
                { step: '01', title: 'Register Online', desc: 'Create your profile and select your areas of expertise.' },
                { step: '02', title: 'Document Verification', desc: 'Upload your certifications and IDs for a trust badge.' },
                { step: '03', title: 'Get Approved', desc: 'Once verified, you start appearing in user searches.' },
                { step: '04', title: 'Start Accepting Bookings', desc: 'Receive notifications and manage your spiritual journey.' }
              ].map((item, idx) => (
                <div key={idx} className="step-item">
                  <span className="step-number">{item.step}</span>
                  <div>
                    <h3 className="step-title">{item.title}</h3>
                    <p className="step-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="register-cta">
               <a href="#download" className="btn-primary">Register as Pandit <Download size={18} /></a>
            </div>
          </div>
       </div>
    </div>
  </section>
);

const PrivacyPolicy = () => (
  <section className="legal-page">
    <div className="container">
      <h1 className="hero-title legal-title">Privacy Policy</h1>
      <div className="glass-card legal-card">
        <p className="legal-text"><strong>Effective Date: March 28, 2025</strong></p>
        
        <p className="legal-text">Anushthan ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.</p>

        <h3>1. Information We Collect</h3>
        <p className="legal-text"><strong>Personal Data:</strong> We collect information that you voluntarily provide, including your name, email address, phone number (verified via OTP), and profile pictures.</p>
        <p className="legal-text"><strong>Location Information:</strong> With your permission, we collect precise location data to match you with Pandits in your vicinity and facilitate service delivery.</p>
        <p className="legal-text"><strong>Professional Data (Pandits):</strong> For priests, we collect certification documents, experience details, and identification proof for verification purposes.</p>

        <h3>2. How We Use Your Information</h3>
        <ul className="legal-text" style={{ paddingLeft: '20px', marginBottom: '24px' }}>
          <li>To facilitate and manage your ritual bookings.</li>
          <li>To verify identity and maintain a secure platform.</li>
          <li>To process payments through our secure partners.</li>
          <li>To send push notifications regarding booking statuses.</li>
          <li>To improve our App’s functionality and user experience.</li>
        </ul>

        <h3>3. Third-Party Services</h3>
        <p className="legal-text">We share data with trusted service providers to operate our platform:</p>
        <ul className="legal-text" style={{ paddingLeft: '20px', marginBottom: '24px' }}>
          <li><strong>Firebase:</strong> Used for authentication, OTP delivery, and push notifications.</li>
          <li><strong>Twilio:</strong> Used as a fallback for SMS OTP delivery.</li>
          <li><strong>Razorpay:</strong> Processes all financial transactions securely.</li>
          <li><strong>AWS (Amazon Web Services):</strong> Securely stores user-uploaded documents and images.</li>
          <li><strong>Google Maps:</strong> Provides location-based services and distance calculations.</li>
        </ul>

        <h3>4. Data Retention & Deletion</h3>
        <p className="legal-text">We retain your data for as long as your account is active. You may request account deletion at any time through the app settings or by contacting our support team. Upon deletion, your personal data will be removed from our active databases within 30 days, except where retention is required by law.</p>

        <h3>5. Security</h3>
        <p className="legal-text">We implement industry-standard encryption (SSL/TLS) and security protocols to protect your data. However, no electronic transmission over the internet is 100% secure.</p>

        <h3>6. Children's Privacy</h3>
        <p className="legal-text">Anushthan does not knowingly collect data from children under the age of 13. Our services are intended for use by adults.</p>

        <h3>7. Contact Us</h3>
        <p className="legal-text">If you have any questions about this Privacy Policy, please contact us at:<br/>
        <strong>Email:</strong> support@anushthan.com<br/>
        <strong>Address:</strong> Karios Dev Team, Spiritual Tech Hub.</p>
      </div>
    </div>
  </section>
);

const Terms = () => (
  <section className="legal-page">
    <div className="container">
      <h1 className="hero-title legal-title">Terms & Conditions</h1>
      <div className="glass-card legal-card">
        <p className="legal-text"><strong>Last updated: March 28, 2025</strong></p>

        <h3>1. Acceptance of Terms</h3>
        <p className="legal-text">By downloading or using the Anushthan app, you agree to be bound by these terms. If you do not agree to these terms, do not use the service.</p>

        <h3>2. Service Description</h3>
        <p className="legal-text">Anushthan is a marketplace platform that connects devotees ("Users") with spiritual practitioners ("Pandits"). We facilitate the booking and payment process but are not the direct providers of the spiritual services themselves.</p>

        <h3>3. User Accounts</h3>
        <p className="legal-text">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Mobile verification via OTP is required for all users.</p>

        <h3>4. Booking & Cancellation</h3>
        <ul className="legal-text" style={{ paddingLeft: '20px', marginBottom: '24px' }}>
          <li>Bookings are confirmed only after successful payment or as per the Pandit's acceptance.</li>
          <li>Cancellations by users within 12 hours of the ritual may incur a 20% convenience fee.</li>
          <li>If a Pandit fails to arrive, a full refund will be processed to the user's original payment method.</li>
        </ul>

        <h3>5. Payment Terms</h3>
        <p className="legal-text">All payments are handled via Razorpay. We do not store your credit card or bank details on our servers. Prices for services are inclusive of platform fees and applicable taxes.</p>

        <h3>6. Conduct and Safety</h3>
        <p className="legal-text">Both Users and Pandits agree to treat each other with mutual respect. We reserve the right to ban users who engage in harassment, fraud, or inappropriate behavior.</p>

        <h3>7. Spiritual Disclaimer</h3>
        <p className="legal-text">While we verify the Vedic knowledge and background of Pandits on our platform, Anushthan does not guarantee specific spiritual, financial, or personal outcomes from the performance of any ritual or puja.</p>

        <h3>8. Limitation of Liability</h3>
        <p className="legal-text">To the maximum extent permitted by law, Anushthan shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the platform.</p>
      </div>
    </div>
  </section>
);

const App = () => {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<ForUsers />} />
          <Route path="/pandits" element={<ForPandits />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default App;
