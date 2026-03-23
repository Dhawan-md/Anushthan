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

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div className="container nav-container">
        <Link to="/" className="logo">Anushthan</Link>
        
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>For Users</Link>
          <Link to="/pandits" className={`nav-link ${location.pathname === '/pandits' ? 'active' : ''}`}>For Pandits</Link>
          <Link to="/privacy" className={`nav-link ${location.pathname === '/privacy' ? 'active' : ''}`}>Privacy</Link>
          <Link to="/terms" className={`nav-link ${location.pathname === '/terms' ? 'active' : ''}`}>Terms</Link>
          <a href="#download" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Download Now</a>
        </div>

        <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} style={{ display: 'none' }}>
           {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer>
    <div className="container">
      <div className="footer-grid">
        <div className="footer-col" style={{gridColumn: 'span 2'}}>
          <h2 className="footer-logo">Anushthan</h2>
          <p className="footer-desc">
            Bridging the gap between sacred traditions and modern convenience. 
            Discover spiritual serenity with Anushthan—your trusted platform for authentic rituals and Pandits.
          </p>
          <div className="social-links" style={{ display: 'flex', gap: '20px' }}>
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
        <div className="hero-btns" style={{ display: 'flex', gap: '16px' }}>
          <a href="#download" className="btn-primary">Download App <Download size={18} /></a>
          <Link to="/users" className="btn-outline">How it Works</Link>
        </div>
      </div>
    </div>
    {/* Background Glows */}
    <div style={{
      position: 'absolute',
      right: '-100px',
      top: '-100px',
      width: '600px',
      height: '600px',
      background: 'radial-gradient(circle, rgba(255, 153, 51, 0.15) 0%, transparent 70%)',
      zIndex: 1
    }} />
  </section>
);

const Home = () => (
  <>
    <Hero />
    <section style={{ background: 'white' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Why Choose Anushthan?</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}> We combine tradition with technology to bring you a seamless spiritual experience. </p>
        </div>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
          {[
            { title: 'Verified Pandits', desc: 'Every priest on our platform undergoes a rigorous verification process to ensure authenticity.', icon: <CheckCircle2 size={40} color="var(--primary)" /> },
            { title: 'Wide Range of Services', desc: 'From Griha Pravesh to Satyanarayan Puja, find every ritual you need.', icon: <Users size={40} color="var(--primary)" /> },
            { title: 'Transparent Pricing', desc: 'Fixed rates for all services, ensuring no hidden costs or last-minute surprises.', icon: <Star size={40} color="var(--primary)" /> }
          ].map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
              <h3 style={{ marginBottom: '16px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    
    <section id="download" style={{ background: 'var(--primary)', color: 'white' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '24px', color: 'white' }}>Available on All Devices</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '48px', opacity: 0.9 }}>Download the Anushthan app today and take your spiritual journey to the next level.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button className="btn-white" style={{ background: 'white', color: 'var(--primary)', padding: '16px 40px', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 600 }}>App Store</button>
          <button className="btn-white" style={{ background: 'white', color: 'var(--primary)', padding: '16px 40px', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 600 }}>Google Play</button>
        </div>
      </div>
    </section>
  </>
);

const ForUsers = () => (
  <section>
    <div className="container">
       <span className="badge">Devotee Portal</span>
       <h1 className="hero-title">Experience Serenity <br/> at Your Fingertips</h1>
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '60px' }}>
          <div>
            <h2 style={{ marginBottom: '32px' }}>How to Book?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {[
                { step: '01', title: 'Choose Your Service', desc: 'Browse through hundreds of Vedic services and pujas tailored to your needs.' },
                { step: '02', title: 'Pick a Date & Time', desc: 'Select a convenient time slot that fits your schedule.' },
                { step: '03', title: 'Expert Pandit Assigned', desc: 'We match you with the best-rated Pandit available in your locality.' },
                { step: '04', title: 'Experience the Devotion', desc: 'Focus on your prayer while we handle all the logistical arrangements.' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '24px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', opacity: 0.5 }}>{item.step}</span>
                  <div>
                    <h3 style={{ marginBottom: '8px' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '40px', alignSelf: 'start' }}>
            <h2 style={{ marginBottom: '24px' }}>Benefits for You</h2>
            <ul style={{ listStyle: 'none' }}>
               {[
                 'Authentic Vedic rituals performed by certified experts',
                 'Hassle-free experience: We bring the materials (Puja Samagri)',
                 'Support in multiple languages',
                 'Secure online payments and 24/7 assistance'
               ].map((text, i) => (
                 <li key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
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
  <section>
    <div className="container">
       <span className="badge">Pandit Community</span>
       <h1 className="hero-title">Grow Your Seva. <br/>Reach More Devotees.</h1>
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '60px' }}>
          <div className="glass-card" style={{ padding: '40px', alignSelf: 'start' }}>
            <h2 style={{ marginBottom: '24px' }}>Why Join Us?</h2>
            <ul style={{ listStyle: 'none' }}>
               {[
                 'Direct access to thousands of devotees looking for services',
                 'Easy scheduling and booking management through our app',
                 'Reliable and timely payments directly to your account',
                 'Help build your digital reputation with ratings and reviews'
               ].map((text, i) => (
                 <li key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                   <CheckCircle2 size={18} color="var(--primary)" />
                   <span>{text}</span>
                 </li>
               ))}
            </ul>
          </div>
          <div>
            <h2 style={{ marginBottom: '32px' }}>The Onboarding Process</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {[
                { step: '01', title: 'Register Online', desc: 'Create your profile and select your areas of expertise.' },
                { step: '02', title: 'Document Verification', desc: 'Upload your certifications and IDs for a trust badge.' },
                { step: '03', title: 'Get Approved', desc: 'Once verified, you start appearing in user searches.' },
                { step: '04', title: 'Start Accepting Bookings', desc: 'Receive notifications and manage your spiritual journey.' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '24px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', opacity: 0.5 }}>{item.step}</span>
                  <div>
                    <h3 style={{ marginBottom: '8px' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '48px' }}>
               <a href="#download" className="btn-primary">Register as Pandit <Download size={18} /></a>
            </div>
          </div>
       </div>
    </div>
  </section>
);

const PrivacyPolicy = () => (
  <section>
    <div className="container">
      <h1 className="hero-title" style={{ fontSize: '3rem' }}>Privacy Policy</h1>
      <div className="glass-card" style={{ padding: '60px', marginTop: '40px', color: 'var(--text-muted)' }}>
        <h3>1. Information We Collect</h3>
        <p style={{ marginBottom: '24px' }}>We collect personal information such as your name, email address, phone number, and location only when you provide it to us during registration or booking.</p>
        <h3>2. How We Use Your Information</h3>
        <p style={{ marginBottom: '24px' }}>Your information is used to facilitate bookings, verify identities, process payments, and improve our services. We do not sell your data to third parties.</p>
        <h3>3. Data Security</h3>
        <p style={{ marginBottom: '24px' }}>We implement industry-standard security measures to protect your personal information from unauthorized access or disclosure.</p>
        <h3>4. Cookies</h3>
        <p style={{ marginBottom: '24px' }}>Our website uses cookies to enhance user experience and analyze traffic patterns.</p>
      </div>
    </div>
  </section>
);

const Terms = () => (
  <section>
    <div className="container">
      <h1 className="hero-title" style={{ fontSize: '3rem' }}>Terms & Conditions</h1>
      <div className="glass-card" style={{ padding: '60px', marginTop: '40px', color: 'var(--text-muted)' }}>
        <h3>1. Acceptance of Terms</h3>
        <p style={{ marginBottom: '24px' }}>By using Anushthan, you agree to these terms and conditions. If you do not agree, please do not use our services.</p>
        <h3>2. Service Booking</h3>
        <p style={{ marginBottom: '24px' }}>Bookings are subject to availability. Users must provide accurate information for time slots and locations.</p>
        <h3>3. Cancellation Policy</h3>
        <p style={{ marginBottom: '24px' }}>Cancellations made less than 24 hours before the service may be subject to a nominal fee.</p>
        <h3>4. User Conduct</h3>
        <p style={{ marginBottom: '24px' }}>Users and Pandits must treat each other with respect and dignity. Any form of harassment is strictly prohibited.</p>
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
