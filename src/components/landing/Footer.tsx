import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-brand">
                <img src={logoImg} alt="Vee Digital Solutions" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white block leading-none">Vee Digital</span>
                <span className="text-white/40 text-xs font-body">Solutions</span>
              </div>
            </Link>
            <p className="text-white/50 text-sm font-body leading-relaxed max-w-xs">
              Kenya's premium SaaS POS + E-Commerce platform. Accept M-Pesa payments, manage your store, and grow your business online and offline.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all text-white/60 text-sm font-bold">W</a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all text-white/60 text-sm font-bold">f</a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all text-white/60 text-sm font-bold">ig</a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5 text-sm text-white/50 font-body">
              {["Features", "Pricing", "Reviews", "Changelog", "Status Page"].map((l) => (
                <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5 text-sm text-white/50 font-body">
              {["Documentation", "API Reference", "Lipana Setup Guide", "WhatsApp Support", "Blog"].map((l) => (
                <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm text-white/50 font-body">
              {["About Us", "Contact", "Careers", "veedigitalsolutions.online"].map((l) => (
                <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Section */}
        <div className="mt-16 pt-12 border-t border-white/10">
          <h3 className="font-display font-bold text-lg text-white mb-8">Legal Information</h3>
          <div className="grid lg:grid-cols-2 gap-10 text-white/40 text-xs font-body leading-relaxed">
            {/* Left legal column */}
            <div className="space-y-6">
              <div>
                <h4 className="font-display font-semibold text-white/70 text-sm mb-2">Privacy Policy</h4>
                <p>Vee Digital Solutions ("we", "us", "our") is committed to protecting your privacy. We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This includes your name, email address, phone number, and payment information. We use this information to provide, maintain, and improve our services, process transactions, send transactional and promotional communications, and comply with legal obligations. We do not sell your personal information to third parties. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. You have the right to access, update, or delete your personal information at any time by contacting us.</p>
              </div>

              <div>
                <h4 className="font-display font-semibold text-white/70 text-sm mb-2">Terms & Conditions</h4>
                <p>By accessing or using Vee Digital Solutions platform, you agree to be bound by these Terms and Conditions. You must be at least 18 years old and a registered business owner in Kenya to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to use our platform only for lawful business purposes and in compliance with all applicable Kenyan laws and regulations. We reserve the right to suspend or terminate your account if we detect fraudulent activity, violation of our terms, or any activity that may harm our platform or other users. These terms are governed by the laws of the Republic of Kenya.</p>
              </div>

              <div>
                <h4 className="font-display font-semibold text-white/70 text-sm mb-2">Refund Policy</h4>
                <p>Subscription fees paid to Vee Digital Solutions are non-refundable except as required by Kenyan consumer protection law. If you believe you have been charged in error, please contact our support team within 7 days of the charge. We will investigate and, where applicable, issue a refund within 14 business days. Transaction fees charged by Lipana (M-Pesa API provider) are subject to their own refund policy and are outside our control. We do not process refunds for M-Pesa transactions directly; these must be handled through Safaricom's dispute resolution process.</p>
              </div>

              <div>
                <h4 className="font-display font-semibold text-white/70 text-sm mb-2">Cookie Policy</h4>
                <p>We use cookies and similar tracking technologies to enhance your experience on our platform. Essential cookies are necessary for the platform to function and cannot be disabled. Analytics cookies help us understand how you use our platform so we can improve it. Preference cookies remember your settings and preferences. You can control non-essential cookies through your browser settings; however, disabling certain cookies may affect platform functionality. By continuing to use our platform, you consent to our use of cookies as described in this policy.</p>
              </div>
            </div>

            {/* Right legal column */}
            <div className="space-y-6">
              <div>
                <h4 className="font-display font-semibold text-white/70 text-sm mb-2">Payment Policy</h4>
                <p>All subscription payments are processed in Kenyan Shillings (KES) via M-Pesa. Subscriptions are billed monthly and must be approved by our admin team. Upon submitting payment proof, your subscription will be activated within 24 hours during business days (Monday–Friday, 8am–6pm EAT). Customer payments on your storefront are processed via Lipana's M-Pesa STK Push. We are not responsible for delays caused by Safaricom network issues. Platform commission, if applicable, is deducted automatically before payout processing.</p>
              </div>

              <div>
                <h4 className="font-display font-semibold text-white/70 text-sm mb-2">Limitation of Liability</h4>
                <p>To the maximum extent permitted by Kenyan law, Vee Digital Solutions shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of or inability to use our services. Our total liability for any claim arising from or related to these terms or our services shall not exceed the amount you paid us in the 3 months preceding the claim. We do not guarantee uninterrupted, secure, or error-free operation of our platform, though we maintain a 99.9% uptime SLA target.</p>
              </div>

              <div>
                <h4 className="font-display font-semibold text-white/70 text-sm mb-2">Data Protection & Compliance</h4>
                <p>We comply with Kenya's Data Protection Act (2019) and are committed to GDPR-aligned data handling practices. Your data is stored on secure, encrypted servers. We retain your data for as long as your account is active or as needed to provide services. Upon account deletion, we will delete your personal data within 30 days, except where required by law. You have the right to data portability — you can request a full export of your data at any time. We conduct regular security audits and penetration testing to protect your information.</p>
              </div>

              <div>
                <h4 className="font-display font-semibold text-white/70 text-sm mb-2">Dispute Resolution & Governing Law</h4>
                <p>Any dispute arising from or relating to these terms or your use of Vee Digital Solutions shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to mediation under the Kenyan Arbitration Act. If mediation is unsuccessful, disputes shall be resolved by the courts of Kenya, sitting in Nairobi. These Terms and Conditions are governed by and construed in accordance with the laws of the Republic of Kenya, including the Kenya Consumer Protection Act (2012), the Information Communications Act, and the Data Protection Act (2019). By using our services, you consent to the exclusive jurisdiction of Kenyan courts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs font-body text-center">
            © {year} Vee Digital Solutions. All rights reserved.
          </p>
          <p className="text-white/40 text-xs font-body text-center">
            Built, Developed & Maintained by{" "}
            <a href="https://veedigitalsolutions.online" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-brand-light transition-colors font-semibold">
              veedigitalsolutions.online
            </a>
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30 font-body">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
