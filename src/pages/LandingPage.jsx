import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDown, BarChart3, Sparkles, Globe, ShieldCheck, PieChart, Zap } from 'lucide-react';
import Logo from '../components/Logo';

function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showPrivacy, setShowPrivacy] = useState(false);

  const containerRef = useRef(null);

  // Track continuous scrolling across the first huge section to drive the animation sequence
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "center start"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  // 1. Wallet Flap Opens (Rotates backwards revealing inside)
  const flapRotateX = useTransform(smoothProgress, [0, 0.3], [0, -130]);

  // 2. Base pushes down slightly
  const walletY = useTransform(smoothProgress, [0, 1], [0, 200]);

  // 3. Coins/Data Ejecting out of the wallet (exploding upwards and outwards)
  // Maps progress from 0.2 (just as flap opens) to 1 (full expanded)

  // Coin 1 (Gold/Primary)
  const c1y = useTransform(smoothProgress, [0.2, 0.8], [0, -400]);
  const c1x = useTransform(smoothProgress, [0.2, 0.8], [0, -250]);
  const c1r = useTransform(smoothProgress, [0.2, 0.8], [0, -180]);
  const c1s = useTransform(smoothProgress, [0.2, 0.8], [0, 1.2]);
  const c1o = useTransform(smoothProgress, [0.2, 0.3, 0.8, 1], [0, 1, 1, 0]);

  // Coin 2 (Secondary Purple)
  const c2y = useTransform(smoothProgress, [0.15, 0.7], [0, -500]);
  const c2x = useTransform(smoothProgress, [0.15, 0.7], [0, 180]);
  const c2r = useTransform(smoothProgress, [0.15, 0.7], [0, 120]);
  const c2s = useTransform(smoothProgress, [0.15, 0.7], [0, 1.5]);
  const c2o = useTransform(smoothProgress, [0.15, 0.25, 0.7, 0.9], [0, 1, 1, 0]);

  // Coin 3 (Tertiary Pink)
  const c3y = useTransform(smoothProgress, [0.3, 0.9], [0, -350]);
  const c3x = useTransform(smoothProgress, [0.3, 0.9], [0, 300]);
  const c3r = useTransform(smoothProgress, [0.3, 0.9], [0, 240]);
  const c3s = useTransform(smoothProgress, [0.3, 0.9], [0, 1]);
  const c3o = useTransform(smoothProgress, [0.3, 0.4, 0.8, 1], [0, 1, 1, 0]);

  // Abstract Chart Graph Ejecting
  const chartY = useTransform(smoothProgress, [0.25, 1], [0, -600]);
  const chartScale = useTransform(smoothProgress, [0.25, 1], [0.5, 1.5]);
  const chartOp = useTransform(smoothProgress, [0.25, 0.4, 0.9, 1], [0, 1, 1, 0]);

  // Hero Text Opacity fade out
  const textOp = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} style={{ backgroundColor: 'var(--bg)', color: 'var(--on-surface)', position: 'relative' }}>

      {/* NAV */}
      <nav className="landing-nav" style={{ position: 'fixed', width: '100%', background: 'rgba(6,14,32,0.6)', backdropFilter: 'blur(24px)', zIndex: 100 }}>
        <div className="landing-logo" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <Logo size={36} />
          Where it Went?
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <button className="btn-cta" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      {/* HERO / WALLET SEQUENCE HEIGHT */}
      <div style={{ height: '220vh', position: 'relative' }}>

        {/* Sticky Container for the 3D interaction */}
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', perspective: '1400px' }}>

          <div className="orb orb1"></div>
          <div className="orb orb2"></div>

          {/* HERO TEXT (Fades away as you scroll into the wallet animation) */}
          <motion.div style={{ opacity: textOp, position: 'absolute', top: '25%', textAlign: 'center', zIndex: 50, pointerEvents: 'none' }}>
            <div className="hero-eyebrow">Financial Dashboard</div>
            <h1 className="hero-h1">Know exactly<br /><span>where it went.</span></h1>
            <p className="hero-sub" style={{ margin: '0 auto' }}>Scroll</p>
          </motion.div>

          {/* THE 3D WALLET COMPOSITION */}
          <motion.div style={{ y: walletY, position: 'relative', width: '320px', height: '200px', transformStyle: 'preserve-3d', zIndex: 10, marginTop: '20vh' }}>

            {/* The Ejecting Elements (Chart) */}
            <motion.div style={{
              position: 'absolute', top: '40px', left: '10px', right: '10px', height: '120px',
              background: 'rgba(25,37,64,0.8)', backdropFilter: 'blur(10px)', border: '1px solid var(--primary)', borderRadius: '16px',
              y: chartY, scale: chartScale, opacity: chartOp, transformOrigin: 'top center', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '16px'
            }}>
              <div style={{ flex: 1, background: 'var(--primary)', height: '40%', borderRadius: '4px' }}></div>
              <div style={{ flex: 1, background: 'var(--secondary)', height: '70%', borderRadius: '4px' }}></div>
              <div style={{ flex: 1, background: 'var(--tertiary)', height: '50%', borderRadius: '4px' }}></div>
              <div style={{ flex: 1, background: 'var(--primary)', height: '90%', borderRadius: '4px' }}></div>
            </motion.div>

            {/* The Ejecting Elements (Coins) */}
            {/* Coin 1 */}
            <motion.div style={{
              position: 'absolute', top: '60px', left: '120px', width: '64px', height: '64px', borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #5bf4de, #098e7d)',
              boxShadow: '0 10px 30px rgba(91,244,222,0.4), inset 0 0 20px rgba(255,255,255,0.5)', border: '2px solid rgba(255,255,255,0.4)',
              y: c1y, x: c1x, rotateZ: c1r, scale: c1s, opacity: c1o, zIndex: 2
            }}>
              <div style={{ absolute: 'inset', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '28px', fontWeight: '900', color: 'rgba(0,58,51,0.5)' }}>₹</div>
            </motion.div>

            {/* Coin 2 */}
            <motion.div style={{
              position: 'absolute', top: '70px', left: '130px', width: '56px', height: '56px', borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #ac8aff, #5516be)',
              boxShadow: '0 10px 30px rgba(172,138,255,0.4), inset 0 0 20px rgba(255,255,255,0.5)', border: '2px solid rgba(255,255,255,0.3)',
              y: c2y, x: c2x, rotateZ: c2r, scale: c2s, opacity: c2o, zIndex: 2
            }}>
              <div style={{ absolute: 'inset', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '24px', fontWeight: '900', color: 'rgba(255,255,255,0.5)' }}>₹</div>
            </motion.div>

            {/* Coin 3 */}
            <motion.div style={{
              position: 'absolute', top: '50px', left: '140px', width: '48px', height: '48px', borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #ff86c3, #eb3694)',
              boxShadow: '0 10px 30px rgba(255,134,195,0.4), inset 0 0 20px rgba(255,255,255,0.5)', border: '2px solid rgba(255,255,255,0.3)',
              y: c3y, x: c3x, rotateZ: c3r, scale: c3s, opacity: c3o, zIndex: 2
            }}>
              <div style={{ absolute: 'inset', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '20px', fontWeight: '900', color: 'rgba(255,255,255,0.5)' }}>₹</div>
            </motion.div>

            {/* Wallet Back Body */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #091328, #0f1930)',
              border: '1px solid var(--outline-var)', borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)', zIndex: 0,
              overflow: 'hidden'
            }}>
              {/* Inner Wallet Slot / Lining */}
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', height: '80px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', borderTop: '2px solid rgba(91,244,222,0.1)' }}></div>
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', height: '60px', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', borderTop: '2px solid rgba(91,244,222,0.1)' }}></div>
            </div>

            {/* Wallet Front Flap (Rotates open) */}
            <motion.div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
              background: 'linear-gradient(135deg, #141f38, #091328)',
              border: '1px solid #40485d', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px',
              transformOrigin: 'top center', rotateX: flapRotateX, zIndex: 10,
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              display: 'flex', justifyContent: 'center'
            }}>
              {/* Flap Stitching Details */}
              <div style={{ position: 'absolute', inset: '6px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '10px', pointerEvents: 'none' }}></div>

              {/* Metal Clasp Top Half */}
              <div style={{ position: 'absolute', bottom: '-4px', width: '50px', height: '12px', background: 'linear-gradient(90deg, #5bf4de, #098e7d)', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)', borderBottom: '1px solid #11c9b4' }}></div>
            </motion.div>

            {/* Wallet Front Panel */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
              background: 'linear-gradient(180deg, #1a2744, #0b152d)',
              border: '1px solid #40485d', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', borderTop: '1px solid rgba(255,255,255,0.05)',
              zIndex: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'center'
            }}>
              {/* Panel Stitching Details */}
              <div style={{ position: 'absolute', inset: '6px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '10px', borderTop: 'none', pointerEvents: 'none' }}></div>

              {/* Metal Clasp Bottom Receiver */}
              <div style={{ width: '60px', height: '24px', background: 'linear-gradient(90deg, #11c9b4, #003a33)', borderRadius: '0 0 8px 8px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)', border: '1px solid #5bf4de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#060e20' }}></div>
              </div>
            </div>

          </motion.div>

        </div>
      </div>

      {/* FEATURES SECTION */}
      <section id="features" style={{ background: 'var(--bg)', paddingTop: '100px', paddingBottom: '200px', zIndex: 10, position: 'relative' }}>
        <div className="section-label" style={{ background: 'var(--surface-low)', padding: '8px 16px', borderRadius: '100px', display: 'inline-block', left: '50%', transform: 'translateX(-50%)', position: 'relative', backdropFilter: 'blur(10px)' }}>What's inside</div>
        <h2 className="section-title">Finance, but make it<br /><span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>actually beautiful.</span></h2>

        <div className="features-grid" style={{ marginTop: '80px' }}>
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }} className="feature-card">
            <div className="feature-icon"><BarChart3 size={24} /></div>
            <div className="feature-title">Visual Momentum Charts</div>
            <p className="feature-body">See your weekly and monthly cash flow at a glance with sleek, interactive charts mapping your exact inputs.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }} className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, rgba(172,138,255,0.15), rgba(172,138,255,0.05))', color: 'var(--secondary)' }}><Sparkles size={24} /></div>
            <div className="feature-title">AI Budgeting Insights</div>
            <p className="feature-body">Get personalised nudges automatically generated from your own tracking patterns.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.2 }} className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, rgba(255,134,195,0.15), rgba(255,134,195,0.05))', color: 'var(--tertiary)' }}><Globe size={24} /></div>
            <div className="feature-title">Multi-Currency Support</div>
            <p className="feature-body">Track in INR, USD, EUR, GBP and more. Switch instantly and see your balances localised.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }} className="feature-card">
            <div className="feature-icon"><ShieldCheck size={24} /></div>
            <div className="feature-title">Secure Authentication</div>
            <p className="feature-body">Google OAuth integration safely backed by Cloud Firestore infrastructure.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }} className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, rgba(172,138,255,0.15), rgba(172,138,255,0.05))', color: 'var(--secondary)' }}><PieChart size={24} /></div>
            <div className="feature-title">Daily Spending</div>
            <p className="feature-body">See exactly how your money breaks down across various categories with live donut charts.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.2 }} className="feature-card">
            <div className="feature-icon" style={{ background: 'linear-gradient(135deg, rgba(255,134,195,0.15), rgba(255,134,195,0.05))', color: 'var(--tertiary)' }}><Zap size={24} /></div>
            <div className="feature-title">Instant Log</div>
            <p className="feature-body">Add income or expenses in seconds with the Quick Log modal overlay.</p>
          </motion.div>
        </div>
      </section>

      <footer className="app-footer" style={{ marginLeft: 0, paddingLeft: '48px', paddingRight: '48px', position: 'relative', zIndex: 10, background: 'var(--bg)' }}>
        <span>© 2026 Where it Went?</span>
        <div className="footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}>Privacy and Terms</a>
        </div>
      </footer>

      {/* Privacy & Terms Modal */}
      {showPrivacy && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.className.includes('modal-overlay')) setShowPrivacy(false); }}>
          <div className="privacy-modal">
            <button className="modal-close" onClick={() => setShowPrivacy(false)} style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-var)', border: 'none', cursor: 'pointer', transition: '.2s' }}>
              ✕
            </button>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '22px', fontWeight: 800, marginBottom: '24px', background: 'linear-gradient(135deg, #5bf4de, #ac8aff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Privacy &amp; Terms</h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '12px', paddingBottom: '20px' }}>
              <ol style={{ listStyleType: 'decimal', paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', lineHeight: 1.7, color: 'var(--on-surface-var)' }}>
                <li><strong style={{ color: 'var(--on-surface)' }}>Data Collection.</strong> We collect only the financial data you voluntarily enter into the dashboard, including amounts, categories, dates, and notes.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>Authentication.</strong> Sign-in is handled securely via Google OAuth. We do not store your Google password at any point.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>Data Storage.</strong> All entries are stored in Google Cloud Firestore, encrypted in transit and at rest, under your unique user ID.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>No Third-Party Sharing.</strong> Your financial data is never sold, shared with, or disclosed to any third-party services or advertisers.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>Analytics.</strong> Charts and insights are generated entirely from your own data and processed client-side in your browser.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>Cookies.</strong> We use only essential authentication cookies. No tracking or marketing cookies are employed.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>Data Deletion.</strong> You may delete individual entries at any time. To request full account deletion, contact us directly.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>Accuracy.</strong> This dashboard is a personal budgeting tool and does not constitute financial advice. Users are responsible for the accuracy of their entries.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>Modifications.</strong> We reserve the right to update these terms. Continued use of the dashboard constitutes acceptance of any changes.</li>
                <li><strong style={{ color: 'var(--on-surface)' }}>Availability.</strong> The service is provided &ldquo;as is&rdquo; without warranty. We do not guarantee uninterrupted access or data preservation beyond reasonable effort.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
